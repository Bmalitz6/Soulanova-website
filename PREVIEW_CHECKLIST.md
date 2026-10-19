# Soulanova free-membership preview: launch refinements

## Changes
- Homepage Join Free links navigate to `/app/?mode=signup`.
- Members still see the original sign-in screen when navigating normally to `/app/`.
- Signup form shows an “Already a Soulanova member? Sign in instead” link.
- Dashboard tabs wrap at desktop widths and use two columns on mobile rather than being clipped.
- Email confirmation and password reset redirect to the originating site’s `/app/` path.

## Required Supabase configuration for preview email confirmations
In Supabase → Authentication → URL Configuration, add the *exact current Vercel preview origin* plus `/app/` to the **Redirect URLs** allowlist. Alternatively, use a narrowly scoped appropriate preview URL pattern as documented by Supabase. Keep the production URL entries. Supabase may fall back to Site URL if the requested redirect isn't allowed. Do not place passwords or secret keys in project files. This preview change does not itself update Supabase settings.

## Manual test checklist
- On preview homepage, click Join Free; Create Account tab should be selected.
- Click “Sign in instead”; form must switch to Sign In.
- On an existing account, verify all seven tabs are visible and accessible on desktop and phone.
- Verify confirmation email from preview goes to a permitted preview URL after adding the redirect URL to Supabase. Avoid repeated test sign-ups; use an unused test address.
- Confirm password-reset redirect still works on production and preview after allowlist changes.
- Confirm marketing checkbox is optional and unchecked on new signup and persists when changed.
- Do not merge to main until verification and mobile QA pass.
