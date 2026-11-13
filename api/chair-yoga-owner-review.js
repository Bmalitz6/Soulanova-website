'use strict';

// Pending Chair Yoga audio is exposed only through the SSO-protected Preview
// deployment for this review branch. Production always receives enabled:false.
module.exports = function chairYogaOwnerReview(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ enabled: false }));
    return;
  }
  const env = process.env;
  const enabled = env.VERCEL_ENV === 'preview'
    && env.VERCEL_GIT_COMMIT_REF === 'preview/chair-yoga-website-2026-11-12';
  res.statusCode = 200;
  res.end(JSON.stringify({ enabled }));
};
