import express from 'express';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch'; // We'll use node-fetch for this

dotenv.config();

const router = express.Router();

// Hugging Face API endpoint for Stable Diffusion
const API_URL = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';

router.route('/').get((req, res) => {
  res.status(200).json({ message: 'Hello from Hugging Face DALL-E route!' });
});

// Helper function to add a delay for retries
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.route('/').post(async (req, res) => {
  // First, check if the API key is present
  if (!process.env.HUGGINGFACE_API_KEY) {
    const errorMsg = 'Server configuration error: HUGGINGFACE_API_KEY is not defined in the .env file.';
    console.error(`!!! CRITICAL ERROR: ${errorMsg} !!!`);
    return res.status(500).send(errorMsg);
  }

  const { prompt } = req.body;
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // Make the API request to Hugging Face
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      // Check if the response is an image (successful)
      if (response.headers.get('content-type').startsWith('image/')) {
        const imageBuffer = await response.buffer();
        const base64Image = imageBuffer.toString('base64');
        return res.status(200).json({ photo: base64Image });
      }

      // If the response is not an image, it's an error
      const errorData = await response.json();
      console.error(`Hugging Face API Error (Attempt ${attempt + 1}):`, errorData);

      // Check if it's a "model is loading" error and retry if so
      if (errorData.error && errorData.error.includes('is currently loading') && attempt < maxRetries - 1) {
        const waitTime = errorData.estimated_time || 20;
        console.log(`Model is loading, waiting ${waitTime} seconds before retrying...`);
        await delay(waitTime * 1000);
        attempt++;
      } else {
        // For any other error, stop and send the error message
        return res.status(500).send(errorData.error || 'Failed to generate image.');
      }
    } catch (error) {
      console.error('General Error in POST route:', error);
      return res.status(500).send(error.message);
    }
  }

  // This is reached only if all retries fail
  res.status(500).send('Failed to generate image after multiple retries as the model is still loading.');
});

export default router;
