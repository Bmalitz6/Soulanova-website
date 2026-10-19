# Soulanova password-reset preview checklist

1. Upload the extracted repository **contents** to the existing `free-membership-preview` GitHub branch. Do not merge to main.
2. In Supabase Authentication > URL Configuration, add the **new** preview origin with `/app/**` (or at minimum `https://YOUR-NEW-PREVIEW.vercel.app/app/?mode=recover`) to Redirect URLs. Keep the live Site URL and production redirect unchanged. Vercel deployment URLs change between uploads.
3. In a private browser window, open the preview website and request a password-reset email for a test account.
4. Use the newest email link only. It should open `/app/?mode=recover` and display **New password** and **Confirm new password**, not the dashboard.
5. Enter matching passwords (at least 12 characters), save, and verify the app asks you to sign in with the new password.
6. Verify a password mismatch is rejected and a stale or expired link cannot reset the password.
7. Also test while another tab is signed in, then normal sign-in and member content.

Do not submit reset-link URLs, tokens, passwords or screenshots containing them.

**Review only:** JavaScript syntax checks are not a replacement for interactive Supabase testing.
