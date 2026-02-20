import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Object, default: {} },
  status: { type: String, enum: ['sent', 'failed', 'skipped'], default: 'sent' },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const Notification = mongoose.model('Notification', notificationSchema);
