const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String },
  phone: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }
});

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true, // Ensure unique slugs
    trim: true
  },
  author: {
    type: String,
    required: true,
    default: 'Alena Studio'
  },
  date: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  categories: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  likes: {
    type: Number,
    default: 0
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  authorBio: {
    name: { type: String, default: 'Mark Grey' },
    title: { type: String, default: 'Web Designer' },
    description: { type: String },
    image: { type: String, default: '/images/user/1.jpg' }
  }
});

const Blog = mongoose.model('Blog', blogSchema);
const Comment = mongoose.model('Comment', commentSchema);

module.exports = { Blog, Comment };