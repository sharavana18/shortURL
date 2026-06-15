import express from 'express';
import useragent from 'useragent';
import Url from '../models/Url.js';
import Visit from '../models/Visit.js';

const router = express.Router();

// Helper to determine device type from User-Agent
const getDeviceType = (uaString, agent) => {
  const ua = (uaString || '').toLowerCase();
  if (agent.device.family && agent.device.family !== 'Other') {
    return agent.device.family;
  }
  if (ua.includes('ipad') || ua.includes('tablet')) {
    return 'Tablet';
  }
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    return 'Mobile';
  }
  return 'Desktop';
};

// @desc    Redirect short code to original URL & log analytics
// @route   GET /r/:shortCode
// @access  Public
router.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).send(`
        <html>
          <head>
            <title>Link Not Found</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #0b0f19; color: #f3f4f6; text-align: center; }
              .card { background: rgba(255, 255, 255, 0.05); padding: 2.5rem; border-radius: 1rem; border: 1px solid rgba(255, 255, 255, 0.1); max-width: 400px; }
              h1 { color: #f87171; margin-top: 0; }
              a { color: #60a5fa; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Link Not Found</h1>
              <p>The shortened URL you are trying to access does not exist or has expired.</p>
              <p><a href="/">Go to Home</a></p>
            </div>
          </body>
        </html>
      `);
    }

    // Check expiration
    if (url.expiresAt && new Date(url.expiresAt) <= new Date()) {
      return res.status(410).send(`
        <html>
          <head>
            <title>Link Expired</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #0b0f19; color: #f3f4f6; text-align: center; }
              .card { background: rgba(255, 255, 255, 0.05); padding: 2.5rem; border-radius: 1rem; border: 1px solid rgba(255, 255, 255, 0.1); max-width: 400px; }
              h1 { color: #facc15; margin-top: 0; }
              a { color: #60a5fa; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Link Expired</h1>
              <p>This shortened URL has expired and is no longer active.</p>
              <p><a href="/">Go to Home</a></p>
            </div>
          </body>
        </html>
      `);
    }

    // Increment click count (Atomic increment)
    url.clicksCount += 1;
    await url.save();

    // Parse User-Agent
    const uaString = req.headers['user-agent'];
    const agent = useragent.parse(uaString);
    
    const browser = agent.family || 'Unknown';
    const os = agent.os.family || 'Unknown';
    const device = getDeviceType(uaString, agent);

    // Get visitor IP
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    // Clean up local IPv6 loopback representation
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }

    // Asynchronously log visit to avoid blocking redirect response
    Visit.create({
      urlId: url._id,
      ip,
      browser,
      os,
      device,
    }).catch(err => console.error('Failed to log visit:', err));

    // Send 302 redirect
    res.redirect(302, url.originalUrl);
  } catch (error) {
    console.error('Redirect error:', error.message);
    res.status(500).send('Server Error');
  }
});

export default router;
