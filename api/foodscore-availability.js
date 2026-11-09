'use strict';
const policy = require('../lib/foodscore-preview.js');
module.exports = function availability(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.statusCode = req.method === 'GET' ? 200 : 405;
  const enabled = req.method === 'GET' && policy.enabled(process.env, req);
  res.end(`globalThis.SoulanovaFoodScoreAvailability = Object.freeze({enabled:${enabled}});`);
};
