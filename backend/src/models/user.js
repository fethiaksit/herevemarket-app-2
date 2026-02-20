import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  externalId: { type: String, required: true, unique: true },
  pushToken: { type: String, default: '' },
  role: { type: String, default: 'user' },
  pushTokenUpdatedAt: Date,
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
