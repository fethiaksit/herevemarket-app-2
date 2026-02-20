import { Notification } from '../models/notification.js';
import { User } from '../models/user.js';

const expoTokenRegex = /^ExponentPushToken\[[^\]]+\]$/;

export const isValidExpoToken = (token) => expoTokenRegex.test(token || '');

export const sendUserNotification = async ({ userId, type, title, body, data = {} }) => {
  const user = await User.findOne({ externalId: userId });
  let status = 'skipped';
  try {
    if (user?.pushToken && isValidExpoToken(user.pushToken)) {
      status = 'sent';
    }
  } catch {
    status = 'failed';
  }
  return Notification.create({ userId, type, title, body, data, status });
};
