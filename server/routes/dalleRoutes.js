import express from 'express';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import FormData from 'form-data';

dotenv.config();

const router = express.Router();

// Stability AI API endpoint
const API_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image';

router.route('/').get((req, res) => {
  res.status(200).json({ message: 'Hello from Stability AI DALL-E route!' });
});

router.route('/').post(async (req, res) => {
  // First, check if the API key is present
  if (!process.env.STABILITY_API_KEY) {
    const errorMsg = 'Server configuration error: STABILITY_API_KEY is not defined in the .env file.';
    console.error(`!!! CRITICAL ERROR: ${errorMsg} !!!`);
    return res.status(500).send(errorMsg);
  }

  try {
    const { prompt } = req.body;

    // Stability AI's API expects the prompt in a specific JSON structure within form-data
    const formData = new FormData();
    formData.append('text_prompts[0][text]', prompt);
    formData.append('samples', 1);
    formData.append('cfg_scale', 7);
    formData.append('steps', 30);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        ...formData.getHeaders(),
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stability AI API Error:', errorText);
      return res.status(response.status).send(errorText);
    }

    const data = await response.json();

    // The image data is in the 'base64' field of the first artifact
    if (data.artifacts && data.artifacts.length > 0 && data.artifacts[0].base64) {
      const base64Image = data.artifacts[0].base64;
      res.status(200).json({ photo: base64Image });
    } else {
      throw new Error('Invalid response structure from Stability AI API.');
    }

  } catch (error) {
    console.error('General Error in POST route:', error);
    res.status(500).send(error.message);
  }
});

export default router;
