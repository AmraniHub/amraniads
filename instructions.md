# AmraniAds — Client Landing Page Platform

## What This Is

A mini landing-page system built inside the AmraniAds website.
Each client gets a dedicated URL, their own Meta Pixel, their own WhatsApp CTA, and isolated tracking.

---

## URL Structure

| URL | What it is |
|-----|-----------|
| `amraniads.com/c/fatima-beauty` | Client landing page |
| `amraniads.com/c/sara-coaching` | Another client page |
| `amraniads.com/admin` | Admin dashboard |
| `amraniads.com/clients.json` | Client data (auto-loaded) |

---

## File Structure

```
/
├── index.html          — Main AmraniAds site (unchanged)
├── styles.css          — Main site styles (unchanged)
├── main.js             — Main site JS (unchanged)
├── vercel.json         — Routing + security headers (updated)
├── clients.json        — ALL client data (source of truth)
├── client.html         — Client page template (rendered by JS)
├── client.css          — Client page styles
├── client.js           — Client page logic (pixel, events, rendering)
├── admin.html          — Admin dashboard
├── admin.css           — Admin styles
├── admin.js            — Admin logic
└── instructions.md     — This file
```

---

## How to Add a New Client

### Step 1 — Open Admin
Go to: `amraniads.com/admin`
Password: `AmraniAds2026` (change in `admin.js` line 1)

### Step 2 — Create Client
Click "+ New Client" and fill in:
- **Business Name** — e.g. "Fatima Beauty"
- **Slug** — URL-friendly ID, auto-generated from name (e.g. `fatima-beauty`)
- **Headline** — Main offer text, big and bold
- **Subheadline** — Supporting line (urgency, date, etc.)
- **Bullet Points** — 2–4 selling points (one per line)
- **Urgency Text** — Optional: "Only 15 pieces left"
- **WhatsApp Number** — Full number with country code: `+212600000000`
- **WhatsApp Pre-filled Message** — What the customer sends first
- **WhatsApp Button Text** — Default: "Order via WhatsApp"
- **Meta Pixel ID** — The 15-16 digit number from Meta Business Suite
- **Price** — Optional, used in Purchase event value (in MAD)
- **Primary Color** — Accent color for the page (default: #E87722)

### Step 3 — Export & Deploy
1. Click **"Export clients.json"** button in admin
2. Move the downloaded file to your project root (replace existing)
3. Commit and push to deploy:
   ```
   git add clients.json
   git commit -m "Add client: Fatima Beauty"
   git push
   ```
4. Vercel auto-deploys in ~30 seconds
5. Test the page: `amraniads.com/c/fatima-beauty`

---

## Meta Pixel — How It Works

### Setup per client
1. Go to Meta Business Suite → Events Manager
2. Create a new Pixel for the client (or use their existing one)
3. Copy the Pixel ID (15–16 digit number)
4. Paste it in the admin form

### Events fired automatically
| Event | When it fires |
|-------|--------------|
| `PageView` | When user accepts cookie consent |
| `ViewContent` | Right after PageView, with offer details |
| `Lead` | When user clicks the WhatsApp button |
| `Purchase` | When you open the ?purchase=1 URL after a sale |

### UTM Parameters (how to track ad campaigns)
Add these to your ad destination URL:

```
amraniads.com/c/fatima-beauty?utm_source=meta&utm_medium=cpc&utm_campaign=fatima-beauty-leads&utm_content=video-1
```

These UTM values are included in every pixel event automatically.

### Tracking a Sale (Purchase Event)
After a customer confirms their order via WhatsApp:
1. Open admin → find the client
2. Click **"Track Sale"** button
3. This opens a URL like: `amraniads.com/c/fatima-beauty?purchase=1`
4. The Purchase event fires immediately (you close the tab after 2 seconds)

Or you can build a "confirm" link into your post-sale WhatsApp message to the customer:
```
To confirm your order please click: amraniads.com/c/fatima-beauty?purchase=1
```
This fires Purchase when the customer clicks it.

---

## Admin Password

Default: `AmraniAds2026`

To change it: open `admin.js`, change line 1:
```javascript
const ADMIN_PASSWORD = 'YourNewPassword';
```
Then redeploy.

Admin sessions last 8 hours. After that, you need to log in again.

---

## Campaign Setup Checklist (per client)

- [ ] Create pixel in Meta Business Suite under client's account
- [ ] Add client in admin with correct pixel ID
- [ ] Export + deploy clients.json
- [ ] Test page at `/c/client-slug`
- [ ] Verify pixel fires in Meta Pixel Helper Chrome extension
- [ ] Set up Meta Ads campaign with destination URL:
      `amraniads.com/c/client-slug?utm_source=meta&utm_medium=cpc&utm_campaign=CAMPAIGN_NAME`
- [ ] Optimize campaign for "Lead" event (WhatsApp click)
- [ ] After 50+ leads, switch to cost-per-lead optimization

---

## Privacy & Consent

Each client page shows a cookie consent banner.
- User clicks **Accept** → Pixel loads and events fire
- User clicks **Decline** → Pixel never loads
- Consent is remembered per client page in the browser

This is required for Meta Pixel compliance and protects you legally.

---

## Deployment

Hosted on Vercel. Auto-deploys on every `git push` to master.

To deploy:
```bash
git add .
git commit -m "Update clients"
git push
```

---

## Returning to This Project

This file (`instructions.md`) has everything needed to continue work.
The client data is in `clients.json`.
The admin is at `/admin`.
Client pages are rendered by `client.html` + `client.js`.
