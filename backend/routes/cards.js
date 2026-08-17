import express from 'express';
import Card from '../models/Card.js';

const router = express.Router();

// Get all flashcards
router.get('/', async (req, res) => {
  try {
    const cards = await Card.find().sort({ updatedAt: -1 });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new flashcard
router.post('/', async (req, res) => {
  const { title, description, code, timeComplexity, spaceComplexity, category, difficulty } = req.body;
  
  const card = new Card({
    title,
    description,
    code,
    timeComplexity,
    spaceComplexity,
    category,
    difficulty,
  });

  try {
    const newCard = await card.save();
    res.status(201).json(newCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update flashcard details or study status
router.put('/:id', async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Update fields if they are provided in request body
    if (req.body.title !== undefined) card.title = req.body.title;
    if (req.body.description !== undefined) card.description = req.body.description;
    if (req.body.code !== undefined) card.code = req.body.code;
    if (req.body.timeComplexity !== undefined) card.timeComplexity = req.body.timeComplexity;
    if (req.body.spaceComplexity !== undefined) card.spaceComplexity = req.body.spaceComplexity;
    if (req.body.category !== undefined) card.category = req.body.category;
    if (req.body.difficulty !== undefined) card.difficulty = req.body.difficulty;
    if (req.body.status !== undefined) {
      card.status = req.body.status;
      card.lastRevised = new Date(); // Update revision date if status changes
    }

    const updatedCard = await card.save();
    res.json(updatedCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a flashcard
router.delete('/:id', async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    await Card.deleteOne({ _id: req.params.id });
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
