# Soulanova free member expansion

This update preserves the existing Supabase login and workout tracking. Changes are primarily static HTML/CSS/JS.

- The member-only Free Library includes approved Marching Step video, 6 original starter recipes, and 3 editorial wellness articles. Workouts 002 and 003 remain labeled coming soon.
- Marketing consent is optional and defaults off. The preference is stored in the authenticated user’s Supabase Auth user_metadata and can be changed in My Account. DO NOT send promotional emails until a compliant consent export / server-side subscriber management, privacy policy and unsubscribe handling are configured. User-editable metadata is not a substitute for a verified marketing audit log.
- No passwords or Supabase service_role credentials were introduced. Existing publishable key is retained as-is.
- Video is included in this zip for preview. Verify licensing/ownership and storage/bandwidth implications before production deployment.
- Confirm Supabase authorized redirect URLs include https://www.soulanova.com/app/ and the actual deployment domain.
- Test registration, email confirmation, password reset, member tabs, preference persistence, playback, and mobile layout before deploying.
- Review all nutrition information for suitability before publishing. Recipes intentionally omit unverified nutrition-calorie estimates.
- Premium subscriptions are NOT enabled by this package.
