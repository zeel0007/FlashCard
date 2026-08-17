import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  code: {
    type: String,
    required: true,
  },
  timeComplexity: {
    type: String,
    default: '',
    trim: true,
  },
  spaceComplexity: {
    type: String,
    default: '',
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    default: 'General',
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['learning', 'review', 'mastered'],
    default: 'learning',
  },
  lastRevised: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

const Card = mongoose.model('Card', cardSchema);

export default Card;
