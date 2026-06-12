const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return the first error's message or array of errors
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const registerValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validateResults
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validateResults
];

const shortenValidation = [
  body('originalUrl')
    .trim()
    .notEmpty().withMessage('Original URL is required')
    .isURL().withMessage('Please enter a valid URL (e.g. http://example.com)'),
  body('customAlias')
    .optional({ checkFalsy: true })
    .trim()
    .isAlphanumeric().withMessage('Custom alias must be alphanumeric (letters and numbers only)')
    .isLength({ min: 3, max: 20 }).withMessage('Custom alias must be between 3 and 20 characters'),
  body('expiryDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Expiry date must be a valid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
  validateResults
];

module.exports = {
  registerValidation,
  loginValidation,
  shortenValidation
};
