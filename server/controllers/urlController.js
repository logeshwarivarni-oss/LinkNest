const Url = require('../models/Url');
const Visit = require('../models/Visit');
const { generateUniqueShortCode } = require('../utils/helpers');

// @desc    Shorten a long URL
// @route   POST /api/urls/shorten
// @access  Private
const shortenUrl = async (req, res, next) => {
  try {
    const { originalUrl, customAlias, expiryDate } = req.body;
    let shortCode;

    if (customAlias) {
      // Check if alias is already used
      const existing = await Url.findOne({ shortCode: customAlias });
      if (existing) {
        return res.status(400).json({ error: 'Custom alias is already in use' });
      }
      shortCode = customAlias;
    } else {
      // Generate a unique 6-character code
      shortCode = await generateUniqueShortCode();
    }

    const newUrl = await Url.create({
      originalUrl,
      shortCode,
      customAlias: customAlias || undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      userId: req.user.id
    });

    res.status(201).json(newUrl);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all URLs for logged in user
// @route   GET /api/urls
// @access  Private
const getUserUrls = async (req, res, next) => {
  try {
    const urls = await Url.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(urls);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a shortened URL
// @route   DELETE /api/urls/:id
// @access  Private
const deleteUrl = async (req, res, next) => {
  try {
    const url = await Url.findById(req.params.id);
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Verify ownership
    if (url.userId.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized to delete this URL' });
    }

    // Cascade delete visits and then the URL itself
    await Visit.deleteMany({ urlId: url._id });
    await Url.findByIdAndDelete(req.params.id);

    res.json({ message: 'URL and its analytics deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Redirect to original URL
// @route   GET /r/:shortCode
// @access  Public
const redirectUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    // Check expiry
    if (url.expiryDate && new Date(url.expiryDate) < new Date()) {
      return res.status(410).json({ error: 'Short URL has expired' });
    }

    // Record visit details asynchronously (non-blocking for redirect)
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await Visit.create({
      urlId: url._id,
      ip,
      userAgent
    });

    // Increment click counter
    url.clicks += 1;
    await url.save();

    // Perform 302 redirect
    res.redirect(302, url.originalUrl);
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed analytics for a URL
// @route   GET /api/urls/:id/analytics
// @access  Private
const getUrlAnalytics = async (req, res, next) => {
  try {
    const url = await Url.findById(req.params.id);
    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Verify ownership
    if (url.userId.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized to view analytics' });
    }

    // Get last 10 visits
    const recentVisits = await Visit.find({ urlId: url._id })
      .sort({ timestamp: -1 })
      .limit(10);

    // Get last visited timestamp
    const lastVisit = recentVisits[0] ? recentVisits[0].timestamp : null;

    // Get trend data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    // Align to start of day
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrends = await Visit.aggregate([
      {
        $match: {
          urlId: url._id,
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp", timezone: "UTC" }
          },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format trend data to include all last 7 days (even with 0 clicks)
    const trendsMap = {};
    dailyTrends.forEach(item => {
      trendsMap[item._id] = item.clicks;
    });

    const formattedTrends = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const dateStr = targetDate.toISOString().split('T')[0];
      formattedTrends.push({
        date: dateStr,
        clicks: trendsMap[dateStr] || 0
      });
    }

    res.json({
      url,
      totalClicks: url.clicks,
      lastVisited: lastVisit,
      recentVisits,
      dailyTrends: formattedTrends
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public stats for a URL
// @route   GET /api/public/stats/:shortCode
// @access  Public
const getPublicStats = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const url = await Url.findOne({ shortCode }).select('originalUrl shortCode clicks expiryDate createdAt');
    
    if (!url) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    const isExpired = url.expiryDate && new Date(url.expiryDate) < new Date();

    res.json({
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
      expiryDate: url.expiryDate,
      isExpired
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  shortenUrl,
  getUserUrls,
  deleteUrl,
  redirectUrl,
  getUrlAnalytics,
  getPublicStats
};
