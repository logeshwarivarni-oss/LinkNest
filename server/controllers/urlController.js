const Url = require('../models/Url');
const Visit = require('../models/Visit');
const { generateUniqueShortCode, parseUserAgent, getLocationFromIp } = require('../utils/helpers');

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

    // Record visit details asynchronously (non-blocking for redirect speed)
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const { browser, os, device } = parseUserAgent(userAgent);

    getLocationFromIp(ip)
      .then(async (location) => {
        await Visit.create({
          urlId: url._id,
          ip,
          userAgent,
          browser,
          os,
          device,
          country: location.country,
          city: location.city
        });
      })
      .catch(async () => {
        await Visit.create({
          urlId: url._id,
          ip,
          userAgent,
          browser,
          os,
          device,
          country: 'Unknown',
          city: 'Unknown'
        });
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

    // Browser breakdown
    const browserStats = await Visit.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // OS breakdown
    const osStats = await Visit.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Device breakdown
    const deviceStats = await Visit.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Country breakdown
    const countryStats = await Visit.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // City breakdown
    const cityStats = await Visit.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      url,
      totalClicks: url.clicks,
      lastVisited: lastVisit,
      recentVisits,
      dailyTrends: formattedTrends,
      browserStats,
      osStats,
      deviceStats,
      countryStats,
      cityStats
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

    // Compile analytics for public view
    const browserStats = await Visit.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const osStats = await Visit.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const deviceStats = await Visit.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const countryStats = await Visit.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const cityStats = await Visit.aggregate([
      { $match: { urlId: url._id } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clicks: url.clicks,
      createdAt: url.createdAt,
      expiryDate: url.expiryDate,
      isExpired,
      browserStats,
      osStats,
      deviceStats,
      countryStats,
      cityStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk shorten URLs via CSV parsed rows
// @route   POST /api/urls/bulk
// @access  Private
const bulkShortenUrls = async (req, res, next) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls)) {
      return res.status(400).json({ error: 'Payload must be an array under the "urls" key' });
    }
    
    if (urls.length === 0) {
      return res.status(400).json({ error: 'URLs array cannot be empty' });
    }
    
    if (urls.length > 100) {
      return res.status(400).json({ error: 'Bulk shortening limit is 100 URLs at a time' });
    }
    
    const results = [];
    
    for (let i = 0; i < urls.length; i++) {
      let { originalUrl, customAlias, expiryDate } = urls[i];
      originalUrl = (originalUrl || '').trim();
      customAlias = (customAlias || '').trim();
      
      let error = null;
      if (!originalUrl) {
        error = 'URL is required';
      } else {
        // Quick regex check for valid URL schema
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i;
        if (!urlRegex.test(originalUrl)) {
          error = 'Invalid URL format';
        }
      }
      
      if (!error && customAlias) {
        const aliasRegex = /^[a-zA-Z0-9_-]{3,20}$/; // Alphanumeric with dashes/underscores allowed
        if (!aliasRegex.test(customAlias)) {
          error = 'Custom alias must be alphanumeric, 3-20 chars';
        } else {
          const existing = await Url.findOne({ shortCode: customAlias });
          if (existing) {
            error = 'Custom alias is already in use';
          }
        }
      }
      
      if (!error && expiryDate) {
        const parsedDate = new Date(expiryDate);
        if (isNaN(parsedDate.getTime())) {
          error = 'Invalid expiry date format';
        } else if (parsedDate <= new Date()) {
          error = 'Expiry date must be in the future';
        }
      }
      
      if (error) {
        results.push({
          row: i + 1,
          originalUrl,
          customAlias,
          status: 'failed',
          error
        });
        continue;
      }
      
      let shortCode;
      if (customAlias) {
        shortCode = customAlias;
      } else {
        shortCode = await generateUniqueShortCode();
      }
      
      try {
        const newUrl = await Url.create({
          originalUrl,
          shortCode,
          customAlias: customAlias || undefined,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          userId: req.user.id
        });
        
        results.push({
          row: i + 1,
          originalUrl,
          customAlias,
          shortCode,
          shortUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/r/${shortCode}`,
          status: 'success',
          id: newUrl._id
        });
      } catch (err) {
        results.push({
          row: i + 1,
          originalUrl,
          customAlias,
          status: 'failed',
          error: err.message || 'Server error'
        });
      }
    }
    
    res.status(200).json({ results });
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
  getPublicStats,
  bulkShortenUrls
};

