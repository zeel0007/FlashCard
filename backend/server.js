import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cardsRouter from './routes/cards.js';
import Card from './models/Card.js';
import { seedCards } from './seedData.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/cards', cardsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Serve frontend static assets in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback route to serve React index.html for client side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Database connection & Server initialization
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa_flashcards';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB database successfully');
    
    // Seed default cards if empty
    try {
      const cardCount = await Card.countDocuments();
      if (cardCount === 0) {
        console.log('No cards found in database. Initializing with default DSA flashcards...');
        await Card.insertMany(seedCards);
        console.log('Successfully seeded default cards!');
      }
    } catch (seedError) {
      console.error('Error seeding database:', seedError);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB database connection error:', err.message);
    console.log('Please make sure your MongoDB instance is running locally or check MONGODB_URI in your .env file.');
    
    // Start server anyway so frontend doesn't crash, but log error for user
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT} without DB connection (offline/fallback mode)`);
    });
  });
