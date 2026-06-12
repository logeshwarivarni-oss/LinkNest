const Url = require('../models/Url');
const https = require('https');

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

/**
 * Simple Regex-based User-Agent parser.
 */
function parseUserAgent(ua) {
  if (!ua || ua === 'Unknown') {
    return { browser: 'Unknown', os: 'Unknown', device: 'Desktop' };
  }
  
  let device = 'Desktop';
  if (/mobi|android|iphone|ipad|ipod/i.test(ua)) {
    device = 'Mobile';
  }
  
  let os = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';
  
  let browser = 'Unknown';
  if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  
  return { browser, os, device };
}

/**
 * IP Geolocation lookup using a public lookup service.
 */
function getLocationFromIp(ip) {
  return new Promise((resolve) => {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.includes('127.0.0.') || ip === 'localhost') {
      return resolve({ country: 'Localhost', city: 'Localhost' });
    }
    
    const cleanIp = ip.replace(/^.*:/, '').trim();
    const url = `https://ipapi.co/${cleanIp}/json/`;
    
    const req = https.get(url, { timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && !parsed.error) {
            return resolve({
              country: parsed.country_name || 'Unknown',
              city: parsed.city || 'Unknown'
            });
          }
        } catch (e) {
          // ignore parsing error
        }
        resolve({ country: 'Unknown', city: 'Unknown' });
      });
    });
    
    req.on('error', () => {
      resolve({ country: 'Unknown', city: 'Unknown' });
    });
  });
}

module.exports = {
  generateUniqueShortCode,
  parseUserAgent,
  getLocationFromIp
};
