import express from 'express';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const router = express.Router();

// This is the specific URL for Google's Imagen model
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict`;

router.route('/').get((req, res) => {
  res.status(200).json({ message: 'Hello from Google AI DALL-E route!' });
});

router.route('/').post(async (req, res) => {
  // First, check if the API key is present
  if (!process.env.GOOGLE_API_KEY) {
    const errorMsg = 'Server configuration error: GOOGLE_API_KEY is not defined in the .env file.';
    console.error(`!!! CRITICAL ERROR: ${errorMsg} !!!`);
    return res.status(500).send(errorMsg);
  }

  try {
    const { prompt } = req.body;
    
    // Construct the full URL with the API key
    const fullApiUrl = `${API_URL}?key=${process.env.GOOGLE_API_KEY}`;

    // Google's API expects the prompt inside a specific JSON structure
    const payload = {
      instances: [{ prompt: prompt }],
      parameters: { "sampleCount": 1 }
    };

    const response = await fetch(fullApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI API Error:', errorText);
      return res.status(response.status).send(errorText);
    }

    const data = await response.json();

    // The image data is in the 'bytesBase64Encoded' field of the first prediction
    if (data.predictions && data.predictions.length > 0 && data.predictions[0].bytesBase64Encoded) {
      const base64Image = data.predictions[0].bytesBase64Encoded;
      res.status(200).json({ photo: base64Image });
    } else {
      throw new Error('Invalid response structure from Google AI API.');
    }

  } catch (error) {
    console.error('General Error in POST route:', error);
    res.status(500).send(error.message);
  }
});

export default router;
