'use strict';
(function (root) {
  function isSoulanovaVercelHost(hostname) {
    const host = String(hostname || '').toLowerCase();
    return host === 'soulanova-website.vercel.app'
      || (host.startsWith('soulanova-website-') && host.endsWith('-soulanova.vercel.app'));
  }

  function resolve({ hostname, config, developmentConfig, isExpectedProductionProject }) {
    const host = String(hostname || '').toLowerCase();
    const productionDomain = host === 'soulanova.com' || host === 'www.soulanova.com' || host === 'soulanova-website.vercel.app';
    if (!config?.url || !config?.publishableKey) throw Error('A verified Supabase configuration is required for SoulStrength accounts.');
    if (productionDomain) {
      if (!isExpectedProductionProject) throw Error('SoulStrength Production must use the approved Production Supabase project.');
      return Object.freeze({ mode: 'production', canRead: true, canWrite: true });
    }
    if (developmentConfig === config) return Object.freeze({ mode: 'development', canRead: true, canWrite: true });
    if (isSoulanovaVercelHost(host) && isExpectedProductionProject) {
      return Object.freeze({ mode: 'vercel-preview', canRead: true, canWrite: false });
    }
    throw Error('A verified Development Supabase configuration is required for non-production SoulStrength accounts.');
  }

  const api = Object.freeze({ isSoulanovaVercelHost, resolve });
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SoulanovaStrengthEnvironment = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
