# Pandora Thumbs Up Exporter (Markdown Edition)

This is a fork of [jeffsikes/pandora_export](https://github.com/jeffsikes/pandora_export), a browser console script that pulls your "Thumbed Up" songs off Pandora and saves them to a file on your computer, grouped by station.

**What's different in this fork:** the original script saves your liked songs as a `.json` file. This version instead saves them as a `.md` (Markdown) file, formatted so you can drop it straight into an app like [Obsidian](https://obsidian.md) as a ready-to-read note — no conversion step needed.

Credit and thanks to the original author, [jeffsikes](https://github.com/jeffsikes), for figuring out how to scrape Pandora's page in the first place. This fork only changes the output format; the scrolling/collection logic is otherwise the same.

## What you get

A file named `pandora_thumbs_up_by_station.md` that looks like this:

```md
# Pandora Thumbs Up — By Station

## Stick Figure Radio
- The Movement - Through The Heart
- Stylie - Just Chillin'

## Dead Man's Party Radio
- The Fixx - Red Skies (Re-recorded / Remastered)
- Oingo Boingo - Gratitude
```

Each station you've thumbed-up songs on becomes its own heading, with your liked songs listed underneath as bullet points in "Artist - Song Title" format.

## Who this is for

You don't need to know how to code to use this. You just need to be able to:
- open a webpage
- open your browser's built-in developer console
- copy and paste some text into it

If you've never done that before, don't worry — it's explained step by step below.

## How to use it

### Step 1 — Go to your Pandora Thumbs Up page

While logged into Pandora on a **desktop web browser** (this doesn't work on mobile), go to:

```
https://www.pandora.com/profile/thumbs/{yourUsername}
```

Replace `{yourUsername}` with your actual Pandora username. You can also get here by clicking your profile icon (top right) → **My Profile** → **Thumbs Up** in the left-hand menu.

Make sure the page is scrolled all the way to the top before continuing.

### Step 2 — Open the browser console

- **Chrome/Edge:** Press `F12`, or right-click anywhere on the page and choose **Inspect**, then click the **Console** tab.
- **Firefox:** Press `F12`, or right-click and choose **Inspect**, then click the **Console** tab.

This opens a panel where you can run small bits of code on the page you're viewing. It only affects your own browser tab — it's not installing anything or changing your account.

### Step 3 — Paste in the script

Copy the entire contents of `pandora_like_exports.js` from this repo, click inside the Console panel, paste it in, and press **Enter**.

### Step 4 — Follow the two prompts

1. A popup will ask you to confirm you're at the top of the page. Click **OK**.
2. A second popup will ask for a scroll speed: type `SLOW`, `NORMAL`, or `FAST` (or just press Enter to accept `NORMAL`).
   - If the script seems to stop early or miss songs, try running it again with `SLOW`.

### Step 5 — Let it run

The console will show a running progress count as it scrolls down the page and collects your liked songs. This can take a few minutes depending on how many songs you've thumbed up and the scroll speed you picked.

### Step 6 — Find your file

When it finishes, the console will say the Markdown file has been saved, and a file named `pandora_thumbs_up_by_station.md` will appear in your **Downloads** folder. Move or copy that file into your Obsidian vault (or anywhere else you keep notes) whenever you're ready.

## Notes

- The script only reads what's already visible on the Pandora page you're logged into. It doesn't send any data anywhere else, and doesn't touch your account, password, or payment info.
- If Pandora changes their website's layout, this script may stop working, the same as the original — that's a normal risk with any browser scraping script.
- If you want the raw JSON version instead (with links to each track and artist page, and album art URLs), see the original repo this was forked from.
