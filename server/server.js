import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Mistral } from '@mistralai/mistralai';
import { Redis } from '@upstash/redis';

import { roastPrompt, pickFilesPrompt } from './prompts.js';

dotenv.config();

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY ?? "",
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/roast', async (req, res) => {
  try {
    const { repo_summary, profanity } = req.body;

    if (!repo_summary || typeof repo_summary !== 'object' || profanity === undefined) {
      return res.status(400).json({ error: 'Missing or invalid repo_summary or profanity flag' });
    }

    const repoUrl = `github.com/${repo_summary.owner}/${repo_summary.name}`;

    // Check cache first
    const cached = await getCachedRoast(repoUrl, profanity);
    if (cached) {
      return res.status(200).json({ roast: cached.roast, verdict: cached.verdict, cached: true });
    }

    const chatResponse = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: roastPrompt(profanity) },
        { role: 'user', content: JSON.stringify(repo_summary) },
      ],
      responseFormat: { type: 'json_object' },
    });

    const result = JSON.parse(chatResponse.choices[0].message.content.trim());

    // Save to cache, push to recent list, increment counter (non-blocking)
    setCachedRoast(repoUrl, profanity, result.roast, result.verdict);
    pushRecentRoast(repoUrl, result.verdict);
    incrementRoastCount();

    res.status(200).json(result);
  } catch (error) {
    console.error('Error roasting repo:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/pick-files', async (req, res) => {
  try {
    const { paths } = req.body;

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid paths array' });
    }

    const chatResponse = await mistral.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: pickFilesPrompt(paths) }],
      responseFormat: { type: 'json_object' },
      temperature: 0,
      maxTokens: 512,
    });

    const result = JSON.parse(chatResponse.choices[0].message.content.trim());
    res.status(200).json(result);
  } catch (error) {
    console.error('Error picking files:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/', (_, res) => {
  res.status(200).json({ message: 'RepoRoast server running' });
});

app.get('/roast-count', async (_, res) => {
  try {
    const count = await getRoastCount();
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching roast count:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/recent-roasts', async (_, res) => {
  try {
    const roasts = await getRecentRoasts();
    res.status(200).json({ roasts });
  } catch (error) {
    console.error('Error fetching recent roasts:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));


/**
 * Build a cache key in the format "owner/repo:profanity" or "owner/repo:clean"
 */
function cacheKey(repoUrl, profanity) {
  const match = repoUrl.trim().toLowerCase().replace(/\.git$/, "").match(/([^\/]+\/[^\/]+)$/);
  const slug = match ? match[1] : repoUrl.trim().toLowerCase();
  return `roast:${slug}:${profanity ? "profanity" : "clean"}`;
}

async function getCachedRoast(repoUrl, profanity) {
  try {
    const key = cacheKey(repoUrl, profanity);
    const cached = await redis.get(key);
    return cached ?? null;
  } catch (err) {
    console.warn('Redis get error (non-fatal):', err?.message);
    return null;
  }
}

async function setCachedRoast(repoUrl, profanity, roast, verdict) {
  try {
    const key = cacheKey(repoUrl, profanity);
    const value = {
      roast,
      verdict,
      repo_url: repoUrl,
      created_at: new Date().toISOString(),
    };
    await redis.set(key, value);
  } catch (err) {
    console.warn('Redis set error (non-fatal):', err?.message);
  }
}

const ROAST_COUNT_KEY = 'roast:total_count';
const ROAST_RECENT_KEY = 'roast:recent';
const ROAST_RECENT_MAX = 20;

async function pushRecentRoast(repoUrl, verdict) {
  try {
    const domain = repoUrl.replace('github.com/', '');
    const entry = JSON.stringify({ domain, verdict });
    await redis.lpush(ROAST_RECENT_KEY, entry);
    await redis.ltrim(ROAST_RECENT_KEY, 0, ROAST_RECENT_MAX - 1);
  } catch (err) {
    console.warn('Redis lpush error (non-fatal):', err?.message);
  }
}

async function getRecentRoasts() {
  try {
    const items = await redis.lrange(ROAST_RECENT_KEY, 0, ROAST_RECENT_MAX - 1);
    return items.map((item) => (typeof item === 'string' ? JSON.parse(item) : item));
  } catch (err) {
    console.warn('Redis lrange error (non-fatal):', err?.message);
    return [];
  }
}

async function incrementRoastCount() {
  try {
    await redis.incr(ROAST_COUNT_KEY);
  } catch (err) {
    console.warn('Redis incr error (non-fatal):', err?.message);
  }
}

async function getRoastCount() {
  try {
    const count = await redis.get(ROAST_COUNT_KEY);
    return count ?? 0;
  } catch (err) {
    console.warn('Redis get count error (non-fatal):', err?.message);
    return 0;
  }
}