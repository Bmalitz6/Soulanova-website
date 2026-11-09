'use strict';
// Server-only deployment identity. Request headers can only restrict access;
// they never supply approval, environment, project, branch, commit or hostname.
const PROJECT_ID = 'prj_dMMzPIdHf9o5dXuGu8qL3db0fu2I';
const DEPLOYMENT_HOST = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.vercel\.app$/;
function enabled(env, req) {
  const branch = env.FOODSCORE_PREVIEW_APPROVED_BRANCH;
  const commit = env.FOODSCORE_PREVIEW_APPROVED_COMMIT;
  // Check native platform identity before switches, including conflicting envs.
  if (env.VERCEL !== '1' || env.VERCEL_ENV !== 'preview' ||
      env.VERCEL_TARGET_ENV !== 'preview' || env.VERCEL_PROJECT_ID !== PROJECT_ID ||
      env.FOODSCORE_PREVIEW_ENABLED !== 'true' ||
      env.FOODSCORE_PREVIEW_APPROVED !== 'true' ||
      env.FOODSCORE_PREVIEW_PROTECTION_CONFIRMED !== 'true' ||
      typeof branch !== 'string' || !branch || branch.trim() !== branch ||
      !/^[a-f0-9]{40}$/.test(commit || '') ||
      env.VERCEL_GIT_COMMIT_REF !== branch || env.VERCEL_GIT_COMMIT_SHA !== commit) return false;

  // A new generated hostname is safe for the same approved project/branch/SHA.
  // Aliases, custom domains and forwarded headers cannot broaden this policy.
  const host = env.VERCEL_URL;
  const headers = req && req.headers;
  return typeof host === 'string' && DEPLOYMENT_HOST.test(host) &&
    !!headers && headers.host === host &&
    (headers.origin === undefined || headers.origin === `https://${host}`);
}
module.exports = { enabled };
