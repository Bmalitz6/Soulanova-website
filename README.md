# Soulanova Website — First Release

A responsive, static coming-soon website. No build tools, database, or paid hosting package required.

## Preview locally
Open `index.html` in a browser. For a more accurate local preview, serve the folder with a local static server (e.g. `python3 -m http.server 8000` from inside the folder) and open http://localhost:8000.

## Deploy to Vercel
1. Unzip `Soulanova_Website_V1.zip`.
2. Create a **new GitHub repository** named `soulanova-website` and upload the **contents** of `soulanova-site` to the repository root (including `index.html`, `styles.css`, `script.js`, `vercel.json`, and the `assets` folder).
3. In Vercel, choose **Add New → Project → Import Git Repository** and select that repository.
4. Framework Preset: **Other**. Leave Build Command blank and set Output Directory to `.` if asked.
5. Click Deploy and check the `*.vercel.app` preview URL.
6. In Vercel **Project → Settings → Domains**, add `soulanova.com` and `www.soulanova.com`.
7. In Namecheap **Domain List → Manage → Advanced DNS**, add the **exact DNS records Vercel displays** for each hostname. Remove conflicting records only after confirming them. DNS changes can take time.

## Important before public launch
- The `hello@soulanova.com` footer link is a placeholder until you create that mailbox or alias. Change or remove it before launch.
- This website does **not** include accounts, paid subscriptions, workout playback, or an email signup form. These are future features.
- Complete a similar-name trademark review and any required business filings before using the brand commercially.
- Fonts are loaded from Google Fonts. If you need an entirely self-hosted privacy-conscious deployment, replace them with system fonts or locally licensed fonts.
- The logo is an image. A separate simplified favicon/app icon would be useful later.
