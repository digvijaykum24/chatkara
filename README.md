# Chatkara Family Restaurant Website

A premium responsive restaurant landing page built with HTML, CSS, JavaScript and Tailwind CSS CDN.

## Run
Open `index.html` in a browser.

## Customize
- Restaurant content: `index.html`
- Colors/layout: `style.css`
- Menu items/categories: `script.js`
- Replace Unsplash image URLs with the restaurant's own photos.
- Replace the demo enquiry handler in `script.js` with Formspree, EmailJS or Firebase when ready.

## Deploy
Upload all files to the public_html folder on Hostinger or any static hosting service.


## Logo
The supplied Chatkara logo is included as `chatkara-logo.png` and is displayed in the navbar.


## Navbar fix
Removed the CSS rule that was overriding Tailwind's responsive `lg:flex` class. Desktop section links are now explicitly visible.


## WhatsApp ordering
Settings are at the top of `order.js`: WhatsApp number, restaurant coordinates (`RESTAURANT`), delivery radius (3 km) and minimum delivery subtotal (must be MORE THAN Rs 300). Pickup has no minimum and no distance limit.
GPS location needs HTTPS on the live site (Hostinger SSL). To test locally, run `python -m http.server` rather than opening the file directly.

## Updating the live site
After editing `style.css`, `script.js` or `order.js`, increase the `?v=` number on their links at the top/bottom of `index.html` (e.g. `?v=6` -> `?v=7`) so visitors' browsers load the new version.
