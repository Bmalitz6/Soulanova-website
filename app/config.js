// This file contains PUBLIC browser connection details only.
// Never put a Supabase secret key, service_role key, or database password here.
const SOULANOVA_PRODUCTION_SUPABASE = {
  url: 'https://dscbavbnlubfmfhudqwy.supabase.co',
  publishableKey: 'sb_publishable_iQG_HTN01_N4CoRuudDh7A_WqupxNvo'
};
const SOULANOVA_PRODUCTION_DOMAINS = ['soulanova.com', 'www.soulanova.com'];
const SOULANOVA_IS_PRODUCTION_DOMAIN = SOULANOVA_PRODUCTION_DOMAINS.includes(location.hostname.toLowerCase());
if (SOULANOVA_IS_PRODUCTION_DOMAIN) window.SOULANOVA_SUPABASE = SOULANOVA_PRODUCTION_SUPABASE;
else if (!window.SOULANOVA_SUPABASE) window.SOULANOVA_SUPABASE = null;
