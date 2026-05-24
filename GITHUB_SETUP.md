# 🚀 Complete GitHub Codespaces Setup Guide
### (Written for beginners — every step explained)

---

## What is GitHub Codespaces?

Think of it like a computer that lives on the internet. You open it in your browser, write code, and run your app — all online. No installs needed on your own PC.

---

## PART 1 — Upload Your Code to GitHub

### Step 1: Create a GitHub account
1. Go to **github.com**
2. Click **Sign up**
3. Create your account (it's free)

### Step 2: Create a new repository (a folder on GitHub)
1. After logging in, click the **+** button in the top-right corner
2. Click **New repository**
3. Name it: `ai-pdf-reader`
4. Make sure it's set to **Public** (free accounts can run Codespaces on public repos)
5. Check the box: **"Add a README file"**
6. Click **Create repository**

### Step 3: Upload your project files
You have two options:

**Option A: Drag and Drop (easiest)**
1. On your new repository page, click **Add file → Upload files**
2. Unzip the `ai-pdf-reader-v2.zip` file on your computer
3. Drag the entire folder contents into the GitHub upload area
4. Scroll down and click **Commit changes**

**Option B: Using Git on your computer**
```bash
# Open Terminal (Mac/Linux) or Command Prompt (Windows)
cd path/to/ai-pdf-reader   # go to the unzipped folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-pdf-reader.git
git push -u origin main
```
Replace `YOUR_USERNAME` with your GitHub username.

---

## PART 2 — Open in GitHub Codespaces

### Step 4: Start a Codespace
1. On your repository page, click the green **Code** button
2. Click the **Codespaces** tab
3. Click **Create codespace on main**
4. Wait 1–2 minutes for it to load (it's setting up your online computer)

You now have VS Code running in your browser! It looks exactly like the desktop VS Code.

### Step 5: Open the Terminal inside Codespaces
1. In the menu bar, click **Terminal → New Terminal**
2. A black panel opens at the bottom — this is where you type commands

---

## PART 3 — Set Up the Backend (Python)

Type these commands one by one in the terminal. Press Enter after each one.

```bash
# Move into the backend folder
cd backend

# Install all Python packages (this takes 1-2 minutes)
pip install -r requirements.txt

# Create your environment file
cp .env.example .env
```

### Step 6: Add your Gemini API key
1. Go to **https://aistudio.google.com/app/apikey**
2. Click **Create API key**
3. Copy the key (it looks like: `AIzaSy...`)
4. Back in Codespaces, in the file explorer on the left, click on `backend/.env`
5. Replace `your_gemini_api_key_here` with your actual key
6. Save the file (Ctrl+S)

---

## PART 4 — Start the Backend Server

In the terminal:
```bash
# Make sure you're in the backend folder
cd /workspaces/ai-pdf-reader/backend

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You'll see something like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**That's your backend running!** ✅

### Step 7: Make the backend port public
1. Look at the bottom of VS Code — click the **PORTS** tab
2. Find port **8000** in the list
3. Right-click on it → **Port Visibility** → **Public**
4. Now copy the forwarded URL — it looks like:
   `https://YOURNAME-8000.preview.app.github.dev`
5. **Save this URL — you'll need it!**

---

## PART 5 — Set Up the Frontend (React)

Open a **second terminal** (click the + button next to the terminal):

```bash
# Move into the frontend folder
cd /workspaces/ai-pdf-reader/frontend

# Install all JavaScript packages (takes 2-3 minutes)
npm install
```

### Step 8: Tell the frontend where the backend is
1. In the frontend folder, create a file called `.env`
2. Add this line (replace with YOUR backend URL from Step 7):
   ```
   REACT_APP_API_URL=https://YOURNAME-8000.preview.app.github.dev
   ```

---

## PART 6 — Start the Frontend

In the second terminal:
```bash
# Make sure you're in the frontend folder
cd /workspaces/ai-pdf-reader/frontend

# Start the React app
npm start
```

After 30 seconds you'll see:
```
Compiled successfully!
Local: http://localhost:3000
```

### Step 9: Open your app
1. A popup may appear saying "Open in Browser" — click it
2. Or go to the **PORTS** tab at the bottom → find port 3000 → click the 🌐 globe icon
3. **Your app is running!** 🎉

---

## PART 7 — Using the App

### Basic Flow
1. **Upload a PDF** — drag and drop, or click to browse
2. Wait for it to process (5-30 seconds depending on size)
3. **Press Play** on the audio bar at the bottom to hear it read aloud
4. **Click 💬 Ask AI** to open the chat panel and ask questions

### All Features
| Feature | How to Use |
|---------|------------|
| **Read aloud** | Press ▶ on the bottom bar |
| **Speed control** | Click the `1×` button on the bottom bar |
| **Change voice** | Dropdown on the bottom bar |
| **Seek forward/back** | ⏪ ⏩ buttons |
| **Explain a sentence** | Select/highlight any text → click "💡 Explain This" |
| **Bookmark a sentence** | Hover over any sentence → click 🏷️ |
| **View bookmarks** | Click 🔖 in the top-right header |
| **Jump to a bookmark** | In Bookmarks panel → click "Jump →" |
| **Smart chapters** | Click "📚 Contents" button (bottom-left) |
| **Jump to chapter** | Click any chapter in the Contents panel |
| **AI chat** | Click "💬 Ask AI" in the header |
| **Paste text to PDF** | Click "📝 Paste Text" tab on the home screen |

---

## PART 8 — Keeping it Running

### ⚠️ Important: Codespaces stops after 30 min of inactivity
When you come back:
1. Go to **github.com/codespaces**
2. Click on your stopped codespace to resume it
3. Start the backend again:
   ```bash
   cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
4. Start the frontend again:
   ```bash
   cd frontend && npm start
   ```

---

## PART 9 — Deploy to the Internet (Make it Permanent)

For a permanent URL that doesn't stop, use **Railway** (free tier):

### Deploy Backend to Railway
1. Go to **railway.app** and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your `ai-pdf-reader` repository
4. Click **Add service → select the backend folder**
5. In the Variables tab, add:
   - `GEMINI_API_KEY` = your key
6. Railway will give you a URL like `https://ai-pdf-reader-backend.up.railway.app`

### Deploy Frontend to Vercel (free)
1. Go to **vercel.com** and sign in with GitHub
2. Click **New Project → Import your repo**
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `REACT_APP_API_URL` = your Railway backend URL
5. Click Deploy
6. Vercel gives you a URL like `https://ai-pdf-reader.vercel.app`

**That's your permanent public URL!** Share it with anyone. 🌐

---

## Troubleshooting

### "Module not found" error in frontend
```bash
cd frontend && npm install
```

### "GEMINI_API_KEY not set" error
- Check that `backend/.env` file exists and has your key

### Can't connect frontend to backend
- Make sure port 8000 is set to **Public** in the Ports tab
- Make sure the URL in `frontend/.env` matches exactly

### "PDF is image-based" error
- Your PDF is a scanned document (just pictures of text)
- These cannot be read — use a PDF that has real selectable text

### App is slow to respond
- The free Gemini tier has rate limits
- Wait 30 seconds and try again

---

## File Structure (for reference)

```
ai-pdf-reader/
├── backend/
│   ├── main.py          ← All API endpoints
│   ├── requirements.txt ← Python packages
│   └── .env             ← Your API key (create this)
└── frontend/
    ├── package.json
    ├── .env             ← Backend URL (create this)
    └── src/
        ├── App.jsx      ← Main app
        └── components/
            ├── TextViewer.jsx     ← Reading + highlighting
            ├── AudioPlayer.jsx    ← TTS controls
            ├── ChatPanel.jsx      ← AI chat
            ├── SmartChapters.jsx  ← Table of contents
            ├── BookmarksPanel.jsx ← Saved bookmarks
            ├── PDFUploader.jsx    ← File upload
            └── PasteConverter.jsx ← Paste text
```

---

**You're all set! If you get stuck, everything is explained above.**
