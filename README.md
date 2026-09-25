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

## Order alerts on your phone (ntfy)
Every time someone presses the order or enquiry button you get an instant push alert, even if they never tap Send in WhatsApp.
1. Install the free **ntfy** app (Play Store / App Store).
2. Tap **+**, enter the topic `chatkara-orders-eaqyevbq5w8w36` and subscribe.
3. Allow notifications for the app.

Alerts show the items, total and customer name only. The topic name is visible in the website code, so alerts never include phone numbers, addresses or locations; those arrive in the WhatsApp message. To change the topic, edit `NTFY_TOPIC` in `order.js` and re-subscribe in the app.

## Website-only orders (WhatsApp Business greeting)
Every website order has an Order ID (e.g. `CK-2509-KUA4`) that appears in both the WhatsApp message and the ntfy phone alert. Treat a WhatsApp order as genuine only if its Order ID also appeared in an ntfy alert. Direct WhatsApp messages without one are not confirmed orders.

Greeting message (WhatsApp Business > Business tools > Greeting message):

    👋 Welcome to Chatkara Family Restaurants!

    For delivery orders, please place your order through our website:
    <your website link>

    Select your food → Add to Cart → Enter your address → Verify the 3 KM delivery area → Submit your order request.

    Our team will review your request and confirm the order.
