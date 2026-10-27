# Hosting Kian Korean (HTTPS required for mic)

This box could not open a lasting public HTTPS tunnel (Cloudflare quick tunnels blocked on port 7844; localtunnel timed out). No GitHub / Netlify / Vercel login is present.

## Fastest path
1. Unzip `kian-korean-app.zip` (also in Drive).
2. Open https://app.netlify.com/drop in a browser (no account needed for a temporary site).
3. Drag the unzipped `korean-app` folder onto the page.
4. Use the HTTPS URL Netlify gives you on your phone. Add to Home Screen for PWA.

## Or GitHub Pages
```bash
gh auth login
cd korean-app
git init && git add . && git commit -m "Kian Korean"
gh repo create kian-korean --public --source=. --push
# Settings → Pages → Deploy from branch main / root
```

## Local (mic works on localhost)
```bash
cd korean-app
python3 -m http.server 8765
# phone on same Wi-Fi cannot use localhost; use a tunnel or Netlify Drop
```
