# TREMAX Digital website

Static site (HTML, CSS, JavaScript, SVG). No build step. Works on GitHub Pages, including under a project subpath like `username.github.io/tremax-digital/`, because every path is relative.

## What's in the folder

```
index.html              the whole site
dashboard.html          full sample dashboard (linked from the See How Your Site Is Doing section)
favicon.svg
css/styles.css          layout, colors, components
css/animations.css      intro, hero entrance, section reveals, ticker/preview animations, reduced-motion rules
js/intro-animation.js   cinematic intro (canvas + GSAP, loaded from cdnjs)
js/interactions.js      hero 3D grid, mouse lighting, card spotlight, portfolio device tilt
js/sections.js          price estimator, "animation included" preview, add-on tabs, live build demo, dashboard chart,
                        off-screen pausing for looping animations
js/dashboard.js         sample data and charts for dashboard.html
css/dashboard.css       styles for dashboard.html
js/main.js              menu, scrolling, section reveals, inquiry form
assets/logos/           editable SVG logos (mark, dark/light backgrounds, profile square)
assets/portfolio/       put project screenshots here
assets/images/          put og-image.png (1200x630) here for link previews
```

## Page sections

1. **Intro** (about 6 seconds): a spark stretches into a light streak, unfolds into a 3D grid with wireframe towers, warps into the T/X monogram, TREMAX scrambles into place, the tagline types itself, and the screen folds into a line before the monogram flies to the nav logo.
2. **Hero** with the interactive 3D grid.
3. **Services ticker**: Websites, Online ordering, Animations, Online stores, Google & SEO, Care plans.
4. **Services**.
5. **Live Build**: "Watch a website build itself". Code types on the left while a sample bakery site assembles on the right. Starts when scrolled into view; "Build it again" replays it.
6. **Our Work**: Kroshaiby.Laii and TFS project cards.
7. **Process**.
8. **Pricing**: the interactive price estimator (see below).
9. **Add-Ons That Grow Your Business**: tabs with a live preview for each add-on. The Reviews & QR code kit preview shows a real QR code (`assets/images/qr-tremax.svg`) that opens https://trelawnnoel-art.github.io/tremax-digital/; regenerate it if the site moves to a new domain (any free QR generator works; save it as an SVG with the same name). The phone app preview is a clickable phone: the site in the browser, Share, "Add to Home Screen", the new icon, a launch screen, then a sample app with Home / Menu / Order / Visit tabs, a working cart and a pickup-order confirmation. "Watch the demo" plays a walkthrough with a moving finger (it also plays once, automatically, the first time the tab opens; not for visitors who turn on reduced motion). Tapping inside the phone stops the demo and hands over control.
10. **See How Your Site Is Doing**: what the Business package's Google setup and dashboard include (Google Analytics, Search Console, Business Profile, joined in one Looker Studio dashboard), with a sample dashboard for Rise Bakery: four stat tiles, a "showed up in Google searches" line chart (hover or arrow keys for monthly values, "Show the numbers" for a table), traffic sources, and top searches. All numbers are made up and labelled "Sample data"; keep that label. To change the chart, edit `data-series` on `.dash-chart` in `index.html` and the table under it.
11. **Full sample dashboard** (`dashboard.html`): opened from "Explore the full sample dashboard". A date-range switch (October / Last 3 months / Since launch) updates everything: six number tiles, a visitors chart compared with the period before, a Google-search-to-customer funnel, traffic sources, distance, devices, a table of Google searches (times shown, clicks, click rate, average position), most visited pages, a "when people visit" heatmap, monthly calls and direction requests, and example takeaways. All numbers are made up and live at the top of `js/dashboard.js`; October matches the preview on the home page. The page is marked `noindex` so Google doesn't list it as a real page.
12. **About**, **Contact**, footer (with "Replay intro").

## Prices

| Package | Price | Includes | Animation |
|---|---|---|---|
| Starter | $200–$400 | Up to 3 pages, mobile-ready, contact form, basic SEO | Light motion |
| Business | $600 | Everything in Starter, plus up to 6 pages, editable content, Google Analytics / Search Console / Business Profile set up, and a live dashboard | Signature animation |
| Custom | $800+ | Everything in Business, plus online stores, custom dashboards, custom features | Cinematic animation |

The Google setup and dashboard come with every Business and Custom order. That's promised in four places: the Business card, the "Why Business is worth it" box under the cards, the "Google setup + live dashboard: Included" line the estimator adds, and the See How Your Site Is Doing section (whose "Choose Business" button selects Business in the estimator). If you change what Business includes, update all four.

Animation is included in every package. Standard delivery is usually within a week.

| Extra | Price |
|---|---|
| Online ordering or booking | +$150–$300 |
| Reviews & QR code kit (QR code to your Google review page, print-ready table card, counter sign and sticker, "Leave a review" button, best reviews shown on your site) | +$75–$150 |
| Your own phone app (an installable version of the site: home-screen icon, opens full-screen, works on a weak signal) | +$150–$250 |
| Rush delivery in 3 days | +20% of the one-time total |
| Extra pages (slider, 0–10) | $50–$75 each |

| Monthly care plan | Price |
|---|---|
| Basic: hosting, backups, security | $49/mo |
| Plus: Basic and up to 2 hours of edits | $99/mo |

The note under the estimator says: estimates only, final quote after a free consultation; domain, paid apps, and payment-processing fees are separate.

**To change a price, edit it in two places:**
- `index.html`: the package cards and extras in the Pricing section, the tab labels and text in Add-Ons That Grow Your Business, and the "Preferred package" / "Estimated budget" dropdowns in the contact form.
- `js/sections.js`: the `PACKAGES`, `EXTRAS`, `PAGE`, `RUSH`, and `CARE` values at the top of section 2. These drive the running total. If you change the price bands a lot, also adjust `budgetFor()` so "Send me this quote" picks the right budget option.

**Send me this quote** fills the inquiry form: it sets the package and budget dropdowns and adds a summary of the selections to the project description. Clicking it again updates that summary instead of adding a second one. Nothing is sent until the visitor submits the form.

## Before launch: things only you can fill in

**Must do**
1. **Inquiry form.** Sign up free at https://formspree.io, create a form, and set it to send to your email. Copy its endpoint (looks like `https://formspree.io/f/abcdwxyz`) and paste it into `index.html` on the `<form ... data-endpoint="https://formspree.io/f/YOUR_FORM_ID">` line. Then publish the site and send yourself a test inquiry: Formspree asks you to confirm the first one. Until this is done, the form tells visitors it isn't connected and sends nothing. (Web3Forms also works: use its endpoint and add its hidden `access_key` input inside the form.)
2. **Email.** Replace `hello@tremaxdigital.com` in the Contact section of `index.html` (it appears twice on that line: the link and the text). The form's error messages read it from there. To have a `@tremaxdigital.com` address you need the domain first (step 4); then use Google Workspace or Zoho Mail for a real inbox, or ImprovMX (free) to forward it to your Gmail. Until then, use your Gmail address.
3. **Social links.** Replace the `href="#"` values on Instagram, LinkedIn, and TikTok in the Contact section, or delete the ones you don't use.
4. **Domain.** Buy `tremaxdigital.com` (or similar) from a registrar such as Cloudflare, Namecheap, or Porkbun, then connect it (see "Publish on GitHub Pages" step 5).
5. **Link preview image.** Add `assets/images/og-image.png` (1200x630). This is the picture shown when the link is shared in texts and on social media. Once you have the domain, change its path in `index.html` to the full URL (`https://tremaxdigital.com/assets/images/og-image.png`), because some apps ignore relative paths.
6. **Privacy policy.** The form collects names and emails, and if you add Google Analytics to this site it uses cookies, so add a short privacy page and link it in the footer.
7. **Test on real phones.** iPhone Safari and an Android phone: intro, menu, estimator, add-on tabs, dashboard, and the form.

**When ready**
- **Kroshaiby.Laii and TFS.** Screenshots and descriptions are in. Put each live URL on its View Project button (and the real TFS domain in its device bar). Until then the buttons go nowhere.
- **Your own Google setup.** Do for TREMAX what you'll do for Business clients: add Google Analytics, verify the site in Google Search Console, and create a Google Business Profile.

Search the project for `TODO` to find every spot that still needs your details.

## Live on GitHub Pages

The site is live at https://trelawnnoel-art.github.io/tremax-digital/ (repository: https://github.com/trelawnnoel-art/tremax-digital). To publish changes, open a terminal in this folder and run:

```
git add -A
git commit -m "Describe the change"
git push
```

GitHub rebuilds the site within a minute or two.

## Netlify (backup)

The site is live at https://tremax-digital.netlify.app (Netlify project `tremax-digital`). This folder is linked to it (the `.netlify` folder), so to publish changes, open a terminal in this folder and run:

```
netlify deploy --prod --no-build --dir .
```

Netlify shortens links like `dashboard.html` to `/dashboard`; both work. To use your own domain, go to the project in the Netlify dashboard, then Domain management, then Add a domain, and follow its DNS steps. The steps below are the alternative if you'd rather host on GitHub Pages.

## Publish on GitHub Pages

1. On GitHub, create a new repository (for example `tremax-digital`).
2. Upload the contents of this folder (not the folder itself) so `index.html` sits at the top of the repo. Use "Add file > Upload files", or push with git.
3. Go to Settings > Pages. Under "Build and deployment", choose "Deploy from a branch", pick `main` and `/ (root)`, and save.
4. Wait a minute or two, then open the link GitHub shows. Test the intro, menu, links, estimator, and form on your phone and computer.
5. Custom domain: in Settings > Pages, enter your domain. At your domain registrar, add the DNS records GitHub lists (A records for the root domain, or a CNAME to `username.github.io` for `www`). Turn on "Enforce HTTPS" once it's available.

## Updating the site

- **Text:** edit `index.html`.
- **Prices:** see "To change a price" above.
- **New portfolio project:** copy a whole `<article class="project">` block in the Our Work section, change the text, and add its screenshots to `assets/portfolio/`. The 3D tilt works on every card automatically.
- **Colors:** change the variables at the top of `css/styles.css`. The sample business in the Live Build and add-on previews (Rise Bakery) keeps its own colors on purpose, because it shows what a client's own brand looks like.
- **"Most popular" badge:** it's on the Business package (`package__badge` in `index.html`). Change the words there, or delete that one `<span>` to remove it.
- **Intro:** it plays once per browser session (stored under the `tremax-intro-seen` key). Use "Replay intro" in the footer to watch it again. To test a fresh visit, open a private window.

## Accessibility and performance notes

- Visitors with "reduce motion" turned on skip the intro, see a still version of the hero grid, a static services list instead of the scrolling ticker, a finished live build, and still previews.
- The intro has a Skip button and also skips on Escape. If GSAP fails to load, the page shows immediately instead of getting stuck. Without JavaScript the intro never appears.
- Looping animations (ticker, animation preview, add-on previews, live build typing, hero grid) pause when they're off screen or the tab is hidden.
- The add-on tabs work with the keyboard (arrow keys, Home, End). On tablets and phones the tab strip sticks under the nav, the example shows above its description, and tapping a tab scrolls the example into view.
- Keyboard focus is visible everywhere; the mobile menu closes on Escape. The menu switches to the mobile layout at 1000px wide and below.
