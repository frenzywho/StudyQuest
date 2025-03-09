import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  id: String,
  type: {
    type: String,
    enum: ['user', 'ai'],
    required: true,
  },
  content: String,
  timestamp: Date,
  image: String,
});

const ConversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: 'New Conversation',
  },
  messages: [MessageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
