import express from 'express';
import protect from '../middleware/auth.js';
import Url from '../models/Url.js';
import crypto from 'crypto';

const router = express.Router();

// Helper to validate proper URL format
const isValidUrl = (urlString) => {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

// Helper to generate a random 6-character short code
const generateShortCode = () => {
  return crypto.randomBytes(4).toString('base64url').substring(0, 6);
};

// Helper to retrieve the title of a webpage
const fetchTitle = async (url) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    
    const html = await response.text();
    const match = html.match(/<title>([^<]*)<\/title>/i);
    return match && match[1] ? match[1].trim() : null;
  } catch (error) {
    console.log(`Failed to fetch title for URL ${url}: ${error.message}`);
    return null;
  }
};

// @desc    Create a short URL
// @route   POST /api/urls/shorten
// @access  Private
router.post('/shorten', protect, async (req, res) => {
  const { originalUrl, customAlias, expiresAt } = req.body;
  const userId = req.user.id;

  try {
    if (!originalUrl) {
      return res.status(400).json({ message: 'Original URL is required' });
    }

    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({ message: 'Please provide a valid HTTP/HTTPS URL' });
    }

    let code;

    if (customAlias) {
      // Clean custom alias (remove spaces and special chars, keep alphanumeric, dashes, underscores)
      const cleanAlias = customAlias.trim().replace(/[^a-zA-Z0-9-_]/g, '');
      if (cleanAlias.length < 3) {
        return res.status(400).json({ message: 'Custom alias must be at least 3 characters long' });
      }

      // Check if alias is already taken
      const existing = await Url.findOne({ shortCode: cleanAlias });
      if (existing) {
        return res.status(400).json({ message: 'Custom alias is already taken' });
      }
      code = cleanAlias;
    } else {
      // Generate unique random code
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        code = generateShortCode();
        const existing = await Url.findOne({ shortCode: code });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      if (!isUnique) {
        return res.status(500).json({ message: 'Could not generate unique short code. Please try again.' });
      }
    }

    // Try to retrieve webpage title
    const urlTitle = await fetchTitle(originalUrl) || new URL(originalUrl).hostname;

    // Build URL object
    const urlData = {
      originalUrl,
      shortCode: code,
      title: urlTitle,
      userId,
      customAlias: customAlias ? code : undefined,
    };

    if (expiresAt) {
      const expirationDate = new Date(expiresAt);
      if (expirationDate <= new Date()) {
        return res.status(400).json({ message: 'Expiration date must be in the future' });
      }
      urlData.expiresAt = expirationDate;
    }

    const url = await Url.create(urlData);
    res.status(201).json(url);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all URLs created by current user
// @route   GET /api/urls
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(urls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update destination URL (Edit URL)
// @route   PUT /api/urls/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { originalUrl } = req.body;

  try {
    if (!originalUrl) {
      return res.status(400).json({ message: 'Original URL is required' });
    }

    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({ message: 'Please provide a valid HTTP/HTTPS URL' });
    }

    const url = await Url.findOne({ _id: req.id || req.params.id, userId: req.user.id });

    if (!url) {
      return res.status(404).json({ message: 'URL not found or unauthorized' });
    }

    // Attempt to update title as well
    const newTitle = await fetchTitle(originalUrl) || new URL(originalUrl).hostname;

    url.originalUrl = originalUrl;
    url.title = newTitle;
    await url.save();

    res.json(url);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a shortened URL
// @route   DELETE /api/urls/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const url = await Url.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!url) {
      return res.status(404).json({ message: 'URL not found or unauthorized' });
    }

    res.json({ message: 'Short URL deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
