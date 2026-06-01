# Homebrew Sheet — Setup Guide
## For the DM (you)

---

## Overview of what you're setting up

- **Supabase** — free cloud database that stores all character data
- **GitHub Pages** — free website hosting for the character sheet app
- **Browser extension** — connects the sheet to DnDBeyond

Total setup time: about 30–45 minutes, most of which is waiting for things to load.

---

## STEP 1 — Set up Supabase (the database)

1. Go to **https://supabase.com** and click **Start your project** (sign up free, no credit card)
2. Click **New project**
   - Name it anything (e.g. `dnd-homebrew`)
   - Set a database password — save it somewhere safe, you won't need it often
   - Choose any region
   - Click **Create new project** and wait ~2 minutes for it to provision
3. Once it loads, click **SQL Editor** in the left sidebar
4. Click **New query**
5. Open the file `supabase-schema.sql` from this project, copy the entire contents, paste it into the SQL editor, and click **Run**
   - You should see "Success. No rows returned"
6. Go to **Authentication → Providers → Google** and toggle it **ON**
   - You'll need to follow the Google OAuth setup link — it walks you through creating credentials in Google Cloud Console (free, takes about 5 minutes)
   - Copy the Client ID and Client Secret back into Supabase
7. Go to **Project Settings → API** (in the left sidebar)
8. Copy two things and save them:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`

---

## STEP 2 — Set up GitHub (the website)

1. Go to **https://github.com** and sign up for a free account if you don't have one
2. Click the **+** button (top right) → **New repository**
   - Name it `dnd-homebrew-sheet`
   - Set it to **Public**
   - Leave everything else default
   - Click **Create repository**
3. You now have an empty repository. Copy the repository URL (looks like `https://github.com/YOURNAME/dnd-homebrew-sheet`)

---

## STEP 3 — Fill in your credentials

1. Open the file `src/config.js` from this project in any text editor (Notepad is fine)
2. Replace `YOUR_SUPABASE_PROJECT_URL` with your Supabase Project URL
3. Replace `YOUR_SUPABASE_ANON_KEY` with your Supabase anon public key
4. Save the file

---

## STEP 4 — Upload files to GitHub

1. Go to your GitHub repository page
2. Click **uploading an existing file** (or drag files onto the page)
3. Upload **all files and folders** from this project:
   - `index.html`
   - `styles/` folder
   - `src/` folder
4. Click **Commit changes**
5. Now go to your repository **Settings** → **Pages** (in the left sidebar)
6. Under **Source**, select **Deploy from a branch**
7. Under **Branch**, select `main` and click **Save**
8. Wait about 2 minutes, then your site will be live at:
   `https://YOURNAME.github.io/dnd-homebrew-sheet`

---

## STEP 5 — Make yourself DM

1. Go to your live site and sign in with your Google account
2. Go back to **Supabase → SQL Editor → New query**
3. Run this query (replace the email with yours):
   ```sql
   insert into dm_users (user_id)
   select id from auth.users where email = 'YOUR_EMAIL@gmail.com';
   ```
4. Refresh the sheet — you should now see the **DM View** and **Homebrew Editor** buttons in the top nav

---

## STEP 6 — Set up the browser extension

Before distributing to players you need to fill in your site URL:

1. Open `extension/manifest.json` and replace `YOUR_GITHUB_PAGES_URL` with your actual URL
   (e.g. `https://yourname.github.io`)
2. Open `extension/popup.js` and replace `YOUR_GITHUB_PAGES_URL` with the same URL
3. Zip the entire `extension/` folder into a file called `homebrew-sheet-extension.zip`

**To install in Chrome/Edge (for you and each player):**
1. Open Chrome and go to `chrome://extensions`
2. Toggle **Developer mode** ON (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder (not the zip — the actual folder)

**To share with players:**
- Send them the `extension/` folder (zipped)
- Tell them to unzip it and follow the Load unpacked steps above

---

## STEP 7 — Test the full flow

1. Open DnDBeyond and your sheet in separate tabs
2. On your sheet, roll anything (click a skill, save, or attack)
3. A result should appear as a toast on your sheet AND be sent to DnDBeyond

If DnDBeyond doesn't receive the roll, it will still show in the sheet's own roll toast. The game log injection depends on which page of DnDBeyond you have open — the campaign page with active chat works best.

---

## For players

Send each player these instructions:

1. Go to **YOUR_SITE_URL** and sign in with Google
2. Click **New Character** and follow the creation wizard
3. Install the browser extension (see zip file)
4. Open your character sheet in one tab and DnDBeyond in another
5. Roll from your character sheet — it sends to DnDBeyond automatically

---

## Adding new classes later

When the Mutator or Shaman are ready:
1. Add their class data file to `src/lib/classes/`
2. Register them in `src/pages/characterCreation.js` in the `CLASSES` array
3. Re-upload the changed files to GitHub

GitHub Pages will update automatically within a minute or two.

---

## Adding homebrew content

Log in as DM → click **Homebrew Editor** → add feats, species, backgrounds, or items. Players will see them immediately when creating or editing characters. No file uploads needed.

---

## Troubleshooting

**"Error loading characters"** — Check that your Supabase URL and anon key are correct in `config.js` and that the schema SQL ran without errors.

**Rolls not appearing in DnDBeyond** — Make sure the extension is installed and enabled, that DnDBeyond is open in a tab, and that you're on a campaign page with active chat. The roll will always appear in the sheet's own toast regardless.

**Google sign-in fails** — Make sure Google OAuth is enabled in Supabase and that the redirect URL (`https://YOURNAME.github.io/dnd-homebrew-sheet`) is added to the allowed redirect URLs in your Google Cloud Console OAuth credentials.

**Players can't see the sheet** — The GitHub repository must be set to **Public** and GitHub Pages must be enabled in Settings → Pages.
