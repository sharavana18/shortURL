import express from 'express';
import mongoose from 'mongoose';
import protect from '../middleware/auth.js';
import Url from '../models/Url.js';
import Visit from '../models/Visit.js';

const router = express.Router();

// @desc    Get detailed analytics for a short URL
// @route   GET /api/analytics/:urlId
// @access  Private
router.get('/:urlId', protect, async (req, res) => {
  const { urlId } = req.params;

  try {
    // Verify that the URL exists and belongs to the authenticated user
    const url = await Url.findOne({ _id: urlId, userId: req.user.id });
    if (!url) {
      return res.status(404).json({ message: 'URL not found or unauthorized' });
    }

    const oid = new mongoose.Types.ObjectId(urlId);

    // 1. Fetch total click count and last visit timestamp
    const lastVisit = await Visit.findOne({ urlId: oid }).sort({ timestamp: -1 });

    // 2. Fetch device distributions
    const deviceStats = await Visit.aggregate([
      { $match: { urlId: oid } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 3. Fetch browser distributions
    const browserStats = await Visit.aggregate([
      { $match: { urlId: oid } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 4. Fetch OS distributions
    const osStats = await Visit.aggregate([
      { $match: { urlId: oid } },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 5. Fetch daily click trends for the last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const dailyTrends = await Visit.aggregate([
      { 
        $match: { 
          urlId: oid,
          timestamp: { $gte: fourteenDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 6. Fetch recent visit log details
    const recentVisits = await Visit.find({ urlId: oid })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({
      urlInfo: {
        title: url.title,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        clicksCount: url.clicksCount,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
      },
      summary: {
        totalClicks: url.clicksCount,
        lastVisited: lastVisit ? lastVisit.timestamp : null,
      },
      deviceStats: deviceStats.map(s => ({ name: s._id, value: s.count })),
      browserStats: browserStats.map(s => ({ name: s._id, value: s.count })),
      osStats: osStats.map(s => ({ name: s._id, value: s.count })),
      dailyTrends: dailyTrends.map(t => ({ date: t._id, clicks: t.clicks })),
      recentVisits,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
