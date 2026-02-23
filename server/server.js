import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { Mistral } from '@mistralai/mistralai';

import { roastPrompt, pickFilesPrompt } from './prompts.js';

dotenv.config();

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY ?? "",
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

    const chatResponse = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: roastPrompt(profanity) },
        { role: 'user', content: JSON.stringify(repo_summary) },
      ],
      responseFormat: { type: 'json_object' },
    });

    const result = JSON.parse(chatResponse.choices[0].message.content.trim());
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

app.listen(5000, () => console.log('Server running on http://localhost:5000'));
