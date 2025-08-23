import express from 'express';
import * as dotenv from 'dotenv';
// We no longer need Cloudinary, so it can be removed or commented out.
// import { v2 as cloudinary } from 'cloudinary';

import Post from '../mongodb/models/post.js';

dotenv.config();

const router = express.Router();

// GET ALL POSTS (This route is unchanged)
router.route('/').get(async (req, res) => {
  try {
    const posts = await Post.find({});
    res.status(200).json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetching posts failed, please try again' });
  }
});

// CREATE A POST (This is the corrected route)
router.route('/').post(async (req, res) => {
  try {
    const { name, prompt, photo } = req.body;

    // We removed the Cloudinary upload step.
    // The 'photo' is already a URL from picsum.photos.

    const newPost = await Post.create({
      name,
      prompt,
      photo, // Save the photo URL directly to the database
    });

    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    // Also, let's log the error to the console for better debugging in the future!
    console.error(err); 
    res.status(500).json({ success: false, message: 'Unable to create a post, please try again' });
  }
});

export default router;