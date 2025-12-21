# StreamerX - Casino Streamer Community Platform

> A professional-grade, full-stack casino streaming community platform built with modern web technologies. Features a complete content management system, user engagement features, real-time functionality, and enterprise-level security.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

---

## 📋 Table of Contents

- [What is StreamerX?](#-what-is-streamerx)
- [Features](#-features)
- [Requirements](#-requirements)
- [Installation Guide (No GitHub)](#-installation-guide-without-github)
- [Installation Guide (With GitHub)](#-installation-guide-with-github)
- [Local Development Setup](#-local-development-setup)
- [Public Server Deployment](#-public-server-deployment)
- [Setting Up Your Admin Account](#-setting-up-your-admin-account)
- [Project Structure](#-project-structure)
- [Admin Panel Guide](#-admin-panel-guide)
- [Security Features](#-security-features)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-frequently-asked-questions)
- [License](#-license)

---

## 🎯 What is StreamerX?

**StreamerX** is a complete website platform designed for casino streamers and their communities. Think of it as your own professional website where you can:

- Show your streaming content and videos
- Run giveaways for your community
- Post news and updates
- Schedule events and streams
- Build a leaderboard for your most active fans
- Manage casino bonus promotions

**Who is this for?**

- 🎰 **Casino Streamers** who want a professional community website
- 🎮 **Content Creators** who want to engage their audience
- 💼 **Businesses** looking for a complete community platform
- 👨‍💻 **Developers** who want to learn from a production-ready application

---

## ✨ Features

### For Your Community
| Feature | What it does |
|---------|--------------|
| **Video Gallery** | Show your best clips and VODs with likes and views |
| **Giveaways** | Run giveaways with entry requirements and winner picking |
| **News & Blog** | Post updates and articles for your community |
| **Events Calendar** | Schedule streams and events with reminders |
| **Leaderboard** | Reward active users with points and rankings |
| **Polls** | Get community feedback with voting |
| **Achievements** | Unlock badges and titles for participation |

### For Streamers
| Feature | What it does |
|---------|--------------|
| **Casino Bonuses** | Display affiliate links with promo codes |
| **Bonus Hunt Tracker** | Interactive slot tracking for streams |
| **Multi-Streamer Support** | Add multiple streamers with profiles |
| **Live Stream Detection** | Auto-detect when you go live |

### For Admins
| Feature | What it does |
|---------|--------------|
| **Full Dashboard** | See all stats at a glance |
| **User Management** | View, edit, ban users easily |
| **Role System** | Admin, Moderator, Writer roles |
| **Audit Logging** | Track who changed what |
| **Site Settings** | Customize branding, colors, content |

---

## 📋 Requirements

Before you start, you need a few things on your computer. Don't worry - we'll walk you through each one!

### For Your Computer (Local Development)

| What You Need | What It Is | How to Get It |
|---------------|------------|---------------|
| **Node.js 18+** | Runs JavaScript on your computer | [Download from nodejs.org](https://nodejs.org/) - click the "LTS" button |
| **A Code Editor** | Where you edit files | [Download VS Code](https://code.visualstudio.com/) (free) |
| **A Web Browser** | To view your website | Chrome, Firefox, Edge, or Safari |
| **A Supabase Account** | Your database and backend | [Sign up at supabase.com](https://supabase.com/) (free tier available) |

### For a Public Server

Everything above, plus:
| What You Need | What It Is | Options |
|---------------|------------|---------|
| **A Hosting Service** | Where your website lives online | Vercel, Netlify, Railway, or any VPS |
| **A Domain Name** (optional) | Your website address (like mysite.com) | Namecheap, GoDaddy, Google Domains |

---

## 📦 Installation Guide (Without GitHub)

This guide is for people who want to install the project **without using GitHub or Git commands**.

### Step 1: Download the Project

1. Download the project as a ZIP file
2. Find the downloaded ZIP file (usually in your Downloads folder)
3. **Right-click** the ZIP file and select "Extract All" (Windows) or double-click (Mac)
4. Choose where to save the folder (like your Desktop or Documents)
5. You now have a folder called `streamers` (or similar) with all the files

### Step 2: Install Node.js

1. Go to [nodejs.org](https://nodejs.org/)
2. Click the big green button that says **"LTS"** (Long Term Support)
3. Open the downloaded file and follow the installation wizard
4. Click "Next" on all screens and "Install" at the end
5. **Restart your computer** after installation

### Step 3: Open Terminal/Command Prompt

**On Windows:**
1. Press the **Windows key** on your keyboard
2. Type `cmd` and press Enter
3. A black window will open - this is Command Prompt

**On Mac:**
1. Press **Cmd + Space** to open Spotlight
2. Type `terminal` and press Enter
3. A white/black window will open - this is Terminal

### Step 4: Navigate to Project Folder

In your terminal, you need to go to the project folder. Type these commands:

**On Windows:**
```bash
cd Desktop\streamers
```
(Replace `Desktop\streamers` with wherever you extracted the folder)

**On Mac:**
```bash
cd ~/Desktop/streamers
```

**Tip:** You can also type `cd ` (with a space) and then drag the folder into the terminal window!

### Step 5: Install Dependencies

Now we install all the required packages. Type this command and press Enter:

```bash
npm install
```

**What's happening?** This downloads all the code libraries the project needs. It might take 2-5 minutes. You'll see lots of text scrolling - that's normal!

**If you see errors:** Make sure you installed Node.js correctly and restarted your computer.

### Step 6: Set Up Supabase (Your Database)

1. Go to [supabase.com](https://supabase.com/) and create a free account
2. Click "New Project" and give it a name (like "streamerx")
3. Choose a strong password and save it somewhere safe
4. Select the region closest to you
5. Click "Create new project" and wait 2-3 minutes

### Step 7: Get Your Supabase Keys

1. In your Supabase project, click "Settings" (gear icon) in the left sidebar
2. Click "API" under Configuration
3. You'll see two important values:
   - **Project URL** - looks like `https://xxxxx.supabase.co`
   - **anon public** key - a long string of letters and numbers

### Step 8: Create Environment File

1. In your project folder, find the file called `.env.example` (or create a new file called `.env`)
2. Open it with a text editor (like Notepad or VS Code)
3. Add these lines (replace with YOUR values from Step 7):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

4. Save the file as `.env` (just `.env`, no other name)

### Step 9: Set Up Database Tables

1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Open the file `scripts/database/00-run-all.sql` from your project
3. Copy ALL the content
4. Paste it into the SQL Editor
5. Click "Run" (or press Ctrl/Cmd + Enter)

This creates all the database tables your website needs.

### Step 10: Start the Website

Go back to your terminal and type:

```bash
npm run dev
```

You should see something like:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

### Step 11: View Your Website

1. Open your web browser (Chrome, Firefox, etc.)
2. Go to: **http://localhost:5173**
3. 🎉 **You should see your StreamerX website!**

---

## 📦 Installation Guide (With GitHub)

If you're comfortable with GitHub, this method is faster.

### Step 1: Clone the Repository

```bash
# Open terminal and run:
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Go into the folder
cd YOUR-REPO-NAME
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the root folder:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Step 4: Start Development Server

```bash
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 🖥️ Local Development Setup

When you run the project on your own computer, it's called "local development." Here's what you need to know:

### Starting the Website

```bash
npm run dev
```

This starts a "development server" on your computer. The website will be available at **http://localhost:5173**.

### Stopping the Website

In your terminal, press **Ctrl + C** (Windows/Mac) to stop the server.

### Making Changes

1. Open any file in your code editor
2. Make your changes
3. Save the file
4. The website will automatically refresh with your changes!

### Building for Production

When you're ready to put your website online:

```bash
npm run build
```

This creates optimized files in a folder called `dist/`.

---

## 🌐 Public Server Deployment

Here's how to put your website online for everyone to see.

### Option 1: Vercel (Easiest - Recommended for Beginners)

1. Go to [vercel.com](https://vercel.com/) and sign up (free)
2. Connect your GitHub account
3. Click "Import Project" and select your repository
4. Add your environment variables:
   - Click "Environment Variables"
   - Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
5. Click "Deploy"
6. 🎉 Your website is live! You'll get a URL like `your-project.vercel.app`

### Option 2: Netlify

1. Go to [netlify.com](https://netlify.com/) and sign up
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub and select your repo
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add environment variables in Site Settings → Environment variables
7. Deploy!

### Option 3: Railway

1. Go to [railway.app](https://railway.app/) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables
5. Railway automatically deploys!

### Option 4: Traditional VPS (Advanced)

If you have a VPS (like DigitalOcean, Linode, or AWS):

1. SSH into your server
2. Install Node.js 18+
3. Clone your repository
4. Run `npm install`
5. Run `npm run build`
6. Serve the `dist/` folder with Nginx or Apache
7. Set up SSL with Let's Encrypt

---

## 👑 Setting Up Your Admin Account

After your website is running, you need to create an admin account.

### Step 1: Create a Regular Account

1. Go to your website
2. Click "Login / Signup" in the sidebar
3. Create an account using email or social login

### Step 2: Find Your User ID

1. Log into your Supabase dashboard
2. Click "Table Editor" in the left sidebar
3. Click on the "profiles" table
4. Find your account (look for your email or username)
5. Copy the value in the `user_id` column (it looks like: `a1b2c3d4-e5f6-7890-abcd-1234567890ab`)

### Step 3: Assign Admin Role

1. In Supabase Table Editor, click on the "user_roles" table
2. Click "Insert row" (+ button)
3. Fill in:
   - `user_id`: Paste your user ID from Step 2
   - `role`: Type exactly `admin`
4. Click "Save"

### Step 4: Verify Admin Access

1. Go back to your website
2. Refresh the page
3. You should now see "Admin" in the sidebar!
4. Click it to access the admin panel

---

## 📁 Project Structure

Here's what all the folders mean:

```
streamers/
├── 📁 public/              → Static files (favicon, robots.txt)
├── 📁 src/                 → All the website code
│   ├── 📁 assets/          → Images and fonts
│   ├── 📁 components/      → Reusable pieces of the website
│   │   ├── 📁 admin/       → Admin panel pieces
│   │   ├── 📁 bonus-hunt/  → Bonus hunt feature
│   │   ├── 📁 layout/      → Header, footer, sidebar
│   │   └── 📁 ui/          → Buttons, cards, forms, etc.
│   ├── 📁 contexts/        → Shared data (like who's logged in)
│   ├── 📁 hooks/           → Reusable logic
│   ├── 📁 integrations/    → Database connections
│   ├── 📁 lib/             → Helper functions
│   ├── 📁 pages/           → Each page of the website
│   │   └── 📁 admin/       → Admin panel pages
│   ├── App.tsx             → Main app file
│   └── index.css           → Styles and colors
├── 📁 supabase/
│   └── 📁 functions/       → Backend code
├── 📁 scripts/             → Database setup files
├── 📁 docs/                → Documentation
└── package.json            → Project info and dependencies
```

---

## 🔧 Admin Panel Guide

Once you have admin access, here's what you can do:

| Section | What You Can Do |
|---------|-----------------|
| **Dashboard** | See stats, quick actions, stream status |
| **Videos** | Add, edit, delete videos |
| **News** | Write and publish articles |
| **Bonuses** | Manage casino bonus listings |
| **Giveaways** | Create giveaways, pick winners |
| **Events** | Schedule events and streams |
| **Polls** | Create community polls |
| **Bonus Hunt** | Manage bonus hunt sessions |
| **Streamers** | Add streamer profiles |
| **Users** | View and manage users |
| **Settings** | Branding, navigation, site options |

### Admin Access Code

When you first access the admin panel, you'll set a personal access code. This is an extra layer of security - you'll need to enter this code each time you access admin features.

**Important Security Notes:**
- Access codes are securely hashed using SHA-256 with unique salts
- Nobody can see your code, not even in the database
- If you forget your code, an administrator must delete it from the database for you to create a new one

---

## 🔒 Security Features

StreamerX includes enterprise-level security:

| Feature | What It Does |
|---------|--------------|
| **Row Level Security** | Database rules that protect data - users can only access what they're allowed to |
| **Role-Based Access** | Different permissions for admin, moderator, writer, and user roles |
| **Secure Authentication** | Industry-standard JWT authentication with Supabase Auth |
| **Input Validation** | Zod schemas validate all user inputs before processing |
| **XSS Protection** | DOMPurify sanitizes all HTML content with additional hooks for iframe/link security |
| **CSRF Protection** | SameSite cookies and origin verification |
| **Audit Logging** | All admin actions are tracked in audit logs |
| **Admin Access Codes** | SHA-256 hashed codes add extra admin panel security |
| **Rate Limiting** | Edge functions include rate limiting to prevent abuse |
| **Secure Error Handling** | Error messages are sanitized to prevent information disclosure |

### Security Utilities (v1.1+)

The project now includes dedicated security utilities in `src/lib/`:

- **`validation.ts`** - Comprehensive input validation schemas for emails, passwords, usernames, URLs, and more
- **`security.ts`** - Security helpers including nonce generation, safe JSON parsing, sensitive data masking, and timing-safe comparisons
- **`sanitize.ts`** - Enhanced HTML sanitization with iframe source validation and link safety hooks

---

## 🔧 Troubleshooting

### "npm: command not found"
- Node.js isn't installed correctly
- Reinstall Node.js from [nodejs.org](https://nodejs.org/) and restart your computer

### "Cannot find module" errors
- Run `npm install` again
- Make sure you're in the right folder

### Website shows blank page
- Check the browser console (F12 → Console tab) for errors
- Make sure your `.env` file has the correct Supabase values

### "Supabase connection failed"
- Double-check your `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Make sure your Supabase project is running

### Admin panel not showing
- Make sure you added your user to the `user_roles` table
- Make sure the `role` value is exactly `admin` (lowercase)
- Refresh the page or log out and back in

### Port 5173 already in use
- Another program is using that port
- Close other terminal windows running `npm run dev`
- Or use a different port: `npm run dev -- --port 3000`

### Edge function errors (non-2xx status)
- Check that your backend is running (if local development)
- Verify environment variables are set correctly
- Check the function logs for specific error messages

### "Backend is missing required environment variables"
- For local development, ensure Supabase CLI is running with `supabase start`
- Check that `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are available
- For cloud deployment, verify secrets are configured in your hosting provider

---

## ❓ Frequently Asked Questions

**Q: Is this free to use?**
A: Yes! The project is MIT licensed. You can use it for personal or commercial projects.

**Q: Do I need to know how to code?**
A: For basic setup and customization, no. For major changes, basic React knowledge helps.

**Q: How much does hosting cost?**
A: Vercel and Netlify have free tiers. Supabase has a generous free tier. You can run a small community for free!

**Q: Can I use my own domain?**
A: Yes! All hosting providers let you connect custom domains.

**Q: Is my data secure?**
A: Yes! All data is protected with Row Level Security, and we use industry-standard security practices including input validation, XSS protection, and secure authentication.

**Q: Can I add my own features?**
A: Absolutely! The codebase is well-organized with TypeScript and documented for customization.

---

## 📄 License

This project is licensed under the **MIT License** - you can use it for anything, modify it, and even sell it. Just keep the license file included.

---

## 📞 Need Help?

- 📖 Check the [API Documentation](docs/API_DOCUMENTATION.md) for backend details
- 📚 Read the [Project Documentation](docs/PROJECT_DOCUMENTATION.md) for technical details
- 🐛 Found a bug? Open an issue on GitHub
- 💬 Have questions? Start a discussion

---

## 📝 Changelog

### v2.0.0 (December 2024)

- **Quick Setup Wizard:**
  - New 6-step interactive wizard for first-time setup
  - Guides through branding, social links, features, and security configuration
  - Auto-detects setup completion status
  - Beautiful step-by-step UI with validation

- **Admin Panel Improvements:**
  - Merged Language settings into Branding page for simplified navigation
  - Enhanced cover photo/banner components across Store, Profile, and UserProfile pages
  - Fixed visual bugs with gradient overlays and image scaling

- **UI/UX Enhancements:**
  - Improved hero sections with proper layered gradients
  - Better cover photo handling with proper object-fit
  - Added decorative blur elements for visual depth
  - Responsive design improvements across all pages

- **Code Quality:**
  - Comprehensive security audit completed
  - Enhanced error handling throughout
  - Improved code organization and component structure
  - Added additional security utilities

### v1.1.0 (December 2024)
- **Security Improvements:**
  - Added comprehensive input validation library (`src/lib/validation.ts`)
  - Added security utilities library (`src/lib/security.ts`)
  - Enhanced HTML sanitization with iframe source validation
  - Added rate limiting to edge functions
  - Improved error handling and sanitization
  - Added CSS injection protection in white-label settings
  
- **Edge Function Improvements:**
  - All edge functions now validate environment variables on startup
  - Better error messages for configuration issues
  - Rate limiting to prevent abuse
  
- **Error Boundary Improvements:**
  - Enhanced error recovery with Try Again, Reload, and Go Home options
  - Unique error IDs for support reference
  - Improved development error details

- **Documentation Updates:**
  - Updated README with security details
  - Updated API documentation with white-label endpoint
  - Comprehensive PROJECT_DOCUMENTATION for value assessment

---

## 🚀 Quick Setup After Installation

After completing the installation steps above, follow this quick setup guide:

### Step 1: Run the Setup Wizard

1. Log in to your website
2. Navigate to the Admin panel (`/admin`)
3. If this is your first time, the **Setup Wizard** will appear automatically
4. Follow the 6-step wizard:
   - **Step 1**: Welcome & Introduction
   - **Step 2**: Configure site name, logo, colors
   - **Step 3**: Add your social media links
   - **Step 4**: Enable/disable platform features
   - **Step 5**: Review security settings
   - **Step 6**: Complete setup!

### Step 2: Configure Essential Settings

After the wizard, customize these settings in the Admin panel:

| Setting Area | What to Configure |
|--------------|-------------------|
| **Branding** | Logo URL, site name, primary colors, typography |
| **Navigation** | Show/hide menu items for your needs |
| **Stream** | Twitch/Kick channel URLs, auto-detect settings |
| **Statistics** | Homepage stat values and labels |

### Step 3: Add Your Content

1. **Add Casino Bonuses** - Go to Admin → Bonuses
2. **Create Your First Giveaway** - Admin → Giveaways
3. **Upload Videos** - Admin → Videos
4. **Post News** - Admin → News
5. **Add Streamers** - Admin → Streamers

---

## 📋 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Yes | Your Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | ✅ Yes | Your Supabase project ID |
| `KICK_CLIENT_ID` | ❌ Optional | For Kick OAuth integration |
| `KICK_CLIENT_SECRET` | ❌ Optional | For Kick OAuth integration |

---

## 🔧 Database Scripts Reference

Located in `scripts/database/`:

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `00-run-all.sql` | Runs all setup scripts in order | Initial setup |
| `01-extensions.sql` | Enables PostgreSQL extensions | Initial setup |
| `02-storage-buckets.sql` | Creates storage buckets | Initial setup |
| `03-site-settings.sql` | Default site configuration | Initial setup |
| `04-role-permissions.sql` | Permission matrix setup | Initial setup |
| `05-video-categories.sql` | Default video categories | Initial setup |
| `06-cron-jobs.sql` | Scheduled automation tasks | After updating URLs |
| `07-admin-setup.sql` | Grant admin access | After first user signup |

---

**Happy streaming! 🎰🎬**
