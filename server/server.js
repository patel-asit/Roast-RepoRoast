import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Mistral } from '@mistralai/mistralai';
import { Redis } from '@upstash/redis';
import { createStreamingParser } from 'llm-json-validator';

import { roastPrompt, pickFilesPrompt } from './prompts.js';

dotenv.config();

const mistralKeys = [
  process.env.MISTRAL_API_KEY_1,
  process.env.MISTRAL_API_KEY_2,
  process.env.MISTRAL_API_KEY_3,
].filter(Boolean);


if (mistralKeys.length === 0) throw new Error('No Mistral API keys found');

let mistralKeyIndex = Math.floor(Math.random() * mistralKeys.length);

function getMistralClient() {
  const key = mistralKeys[mistralKeyIndex % mistralKeys.length];
  mistralKeyIndex = (mistralKeyIndex + 1) % mistralKeys.length;
  return { client: new Mistral({ apiKey: key }), keyLabel: `${key.slice(0, 4)}...${key.slice(-4)}` };
}

async function mistralCallWithRetry(fn) {
  const maxAttempts = mistralKeys.length * 2;
  let lastError;
  for (let i = 0; i < maxAttempts; i++) {
    const { client, keyLabel } = getMistralClient();
    try {
      const result = await fn(client);
      console.log(`Using Mistral API key: ${keyLabel}`);
      return result;
    } catch (err) {
      lastError = err;
      const status = err?.statusCode ?? err?.status ?? err?.response?.status;
      if (status === 429 || status === 402) continue;
      throw err;
    }
  }
  throw lastError;
}

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

    // Check cache first and return normal JSON response
    const cached = await getCachedRoast(repoUrl, profanity);
    if (cached) {
      return res.status(200).json({
        roast: cached.roast,
        verdict: cached.verdict,
        cached: true,
      });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (event, payload) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    let latest = { roast: '', verdict: '' };

    await mistralCallWithRetry(async (client) => {
      const stream = await client.chat.stream({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: roastPrompt(profanity) },
          { role: 'user', content: JSON.stringify(repo_summary) },
        ],
        responseFormat: { type: 'json_object' },
      });

      const parser = createStreamingParser({
        returnParsedJson: false,
        dummyValues: {
          string: '',
          number: 0,
          boolean: false,
          null: null,
        },
      });

      latest = { roast: '', verdict: '' };

      for await (const event of stream) {
        const textChunk = extractTextFromStreamEvent(event);
        if (!textChunk) continue;

        const balanced = parser.appendChunk(textChunk);
        if (typeof balanced !== 'string') continue;

        const parsed = tryParseRoastJson(balanced, latest);
        if (!parsed) continue;

        latest = parsed;
        sendEvent('chunk', latest);
      }

      const finalBalanced = parser.getCurrentData();
      if (typeof finalBalanced === 'string') {
        const finalParsed = tryParseRoastJson(finalBalanced, latest);
        if (finalParsed) latest = finalParsed;
      }
    });

    // Save to cache, push to recent list, increment counter (non-blocking)
    if (latest.roast) {
      setCachedRoast(repoUrl, profanity, latest.roast, latest.verdict);
      pushRecentRoast(repoUrl, latest.verdict);
      incrementRoastCount();
    }

    sendEvent('done', { ...latest, cached: false });
    res.end();
  } catch (error) {
    console.error('Error roasting repo:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Too many roasts being done!! Try again in a few seconds' });
    }
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ message: 'Too many roasts being done!! Try again in a few seconds' })}\n\n`);
    res.end();
  }
});

app.post('/pick-files', async (req, res) => {
  try {
    const { paths } = req.body;

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid paths array' });
    }

    const chatResponse = await mistralCallWithRetry(m => m.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: pickFilesPrompt(paths) }],
      responseFormat: { type: 'json_object' },
      temperature: 0,
      maxTokens: 512,
    }));

    const result = JSON.parse(chatResponse.choices[0].message.content.trim());
    res.status(200).json(result);
  } catch (error) {
    console.error('Error picking files:', error);
    res.status(500).json({ error: 'Too many roasts being done!! Try again in a few seconds' });
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

function extractTextFromStreamEvent(event) {
  const payload = event?.data ?? event;
  const delta = payload?.choices?.[0]?.delta?.content;

  if (typeof delta === 'string') {
    return delta;
  }

  if (Array.isArray(delta)) {
    return delta
      .map((part) => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        return '';
      })
      .join('');
  }

  const messageContent = payload?.choices?.[0]?.message?.content;
  if (typeof messageContent === 'string') {
    return messageContent;
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part) => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        return '';
      })
      .join('');
  }

  return '';
}

function tryParseRoastJson(raw, previous) {
  if (typeof raw !== 'string' || !raw.trim()) return null;

  const patched = raw.replace(
    /("roast"\s*:\s*"[\s\S]*?")\s*("verdict"\s*:)/,
    '$1, $2',
  );

  try {
    const parsed = JSON.parse(patched);
    if (!parsed || typeof parsed !== 'object') return null;

    const next = {
      roast: typeof parsed.roast === 'string' ? parsed.roast : previous.roast,
      verdict: typeof parsed.verdict === 'string' ? parsed.verdict : previous.verdict,
    };

    if (next.roast === previous.roast && next.verdict === previous.verdict) {
      return null;
    }

    return next;
  } catch {
    return null;
  }
}