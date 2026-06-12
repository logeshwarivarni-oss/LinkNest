const Url = require('../models/Url');

/**
 * Generates a random 6-character alphanumeric string.
 */
function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars.charAt(randomIndex);
  }
  return result;
}

/**
 * Generates a unique short code checking against existing database entries.
 */
async function generateUniqueShortCode() {
  let code = generateRandomCode();
  let exists = await Url.findOne({ shortCode: code });
  
  let attempts = 0;
  while (exists && attempts < 10) {
    code = generateRandomCode();
    exists = await Url.findOne({ shortCode: code });
    attempts++;
  }
  
  if (attempts >= 10) {
    throw new Error('Failed to generate a unique short code. Please try again.');
  }
  
  return code;
}

module.exports = {
  generateUniqueShortCode
};
