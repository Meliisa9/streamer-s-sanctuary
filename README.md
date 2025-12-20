# StreamerX - Casino Streamer Community Platform

> A professional-grade, full-stack casino streaming community platform built with modern web technologies. Features a complete content management system, user engagement features, real-time functionality, and enterprise-level security.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Installation Guide](#-installation-guide)
- [Project Structure](#-project-structure)
- [Admin Panel](#-admin-panel)
- [Security](#-security)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

StreamerX is a complete community platform designed for casino streamers and their audiences. It provides everything needed to build an engaged community around streaming content, including video galleries, giveaway management, news publishing, event scheduling, and interactive games.

### Who is this for?

- **Casino Streamers** looking for a professional community website
- **Content Creators** who want to manage bonuses, giveaways, and events
- **Developers** who need a reference implementation of a full-stack React + Supabase application

---

## ✨ Features

### Content Management
- 🎰 **Casino Bonuses** - Display affiliate bonuses with logos, promo codes, and country targeting
- 📹 **Video Gallery** - Categorized video library with likes, views, and bookmarks
- 📰 **News System** - Rich-text blog/news with categories, comments, and likes
- 🎁 **Giveaways** - Entry tracking, countdown timers, winner selection, requirements
- 📅 **Events Calendar** - Scheduled streams, community events, reminder subscriptions
- 👤 **Streamer Profiles** - Multi-streamer support with social links

### Community Features
- 🏆 **Leaderboard** - Points-based ranking system
- 🎯 **Bonus Hunt** - Interactive slot tracking with community predictions
- 📊 **Polls** - Community voting with multiple choice support
- 💬 **Profile Comments** - Social interaction on user profiles
- 🔔 **Notifications** - Real-time user notifications
- 🏅 **Achievements** - Unlockable badges and titles

### User System
- 🔐 **Authentication** - Email/password + OAuth (Twitch, Discord, Kick)
- 👤 **User Profiles** - Customizable with avatars, covers, bios, social links
- ⭐ **Points System** - Earn points through participation
- 📱 **Push Notifications** - Browser push notification support

### Admin Panel
- 📊 **Dashboard** - Overview stats and quick actions
- 👥 **User Management** - View, edit, ban, assign roles
- 🛡️ **Role System** - Admin, Moderator, Writer, User roles
- 📝 **Audit Logging** - Track all admin actions
- ⚙️ **Site Settings** - Branding, navigation, legal pages
- 📈 **Analytics** - User activity and engagement metrics

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library with hooks and concurrent features |
| **TypeScript 5** | Type-safe JavaScript |
| **Vite** | Fast development server and build tool |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | High-quality React components |
| **Framer Motion** | Smooth animations and transitions |
| **TanStack Query** | Server state management and caching |
| **React Router** | Client-side routing |
| **React Hook Form** | Form handling with Zod validation |

### Backend (Lovable Cloud / Supabase)
| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary database |
| **Row Level Security** | Database-level access control |
| **Edge Functions** | Serverless backend logic (Deno) |
| **Auth** | User authentication with OAuth support |
| **Realtime** | WebSocket subscriptions for live updates |
| **Storage** | File uploads (avatars, images) |

---

## 🚀 Quick Start

The fastest way to get started is using Lovable Cloud:

1. **Fork/Remix** - Click "Remix" on the Lovable project
2. **Connect Cloud** - Lovable Cloud is automatically connected
3. **Publish** - Click the Publish button

Your app is now live! 🎉

---

## 📦 Installation Guide

### Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **bun** - [Install bun](https://bun.sh/)
- **Git** - [Download here](https://git-scm.com/)

### Step 1: Clone the Repository

Open your terminal and run:

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project folder
cd <YOUR_PROJECT_NAME>
```

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# OR using bun (faster)
bun install
```

This will download all required packages. It may take 1-2 minutes.

### Step 3: Environment Setup

The project uses environment variables for configuration. These are automatically provided by Lovable Cloud.

**If running locally without Lovable Cloud**, create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
```

### Step 4: Start Development Server

```bash
# Using npm
npm run dev

# OR using bun
bun dev
```

Open your browser and go to: **http://localhost:5173**

You should see the StreamerX homepage! 🎉

### Step 5: Create Your Admin Account

1. Click "Login / Signup" in the sidebar
2. Create an account using email or OAuth
3. Access your backend database (Lovable Cloud > Database)
4. Find your user ID in the `profiles` table
5. Add a row to `user_roles` table:
   - `user_id`: Your user ID
   - `role`: `admin`
6. Refresh the page - you now have admin access!

---

## 📁 Project Structure

```
streamers/
├── public/                 # Static assets (favicon, robots.txt)
├── src/
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable React components
│   │   ├── admin/         # Admin panel components
│   │   ├── bonus-hunt/    # Bonus hunt feature components
│   │   ├── layout/        # MainLayout, Sidebar, Footer
│   │   ├── profile/       # Profile-related components
│   │   └── ui/            # shadcn/ui components
│   ├── contexts/          # React contexts (Auth, OnlinePresence)
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # External service integrations
│   │   └── supabase/      # Supabase client & types
│   ├── lib/               # Utility functions
│   ├── pages/             # Page components
│   │   └── admin/         # Admin panel pages
│   ├── App.tsx            # Main app with routing
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles & design tokens
├── supabase/
│   ├── functions/         # Edge functions (Deno)
│   └── config.toml        # Supabase configuration
├── scripts/               # Database setup scripts
└── package.json           # Dependencies and scripts
```

---

## 🔧 Admin Panel

Access the admin panel at `/admin` (requires admin or moderator role).

### Admin Sections

| Section | Description | Required Role |
|---------|-------------|---------------|
| Dashboard | Overview stats, quick actions | Admin, Moderator |
| Videos | Manage video content | Admin, Moderator |
| News | Publish articles | Admin, Moderator, Writer |
| Bonuses | Manage casino bonuses | Admin, Moderator |
| Giveaways | Create/manage giveaways | Admin, Moderator |
| Events | Schedule events | Admin, Moderator |
| Users | User management | Admin only |
| Roles | Permission management | Admin only |
| Settings | Site configuration | Admin only |
| Audit Log | View admin actions | Admin only |

### Admin Access Code

Each admin must set a personal access code on first login. This provides an additional layer of security beyond role-based access.

---

## 🔒 Security

### Security Features Implemented

| Feature | Description |
|---------|-------------|
| **Row Level Security (RLS)** | All database tables have RLS policies |
| **Role-Based Access Control** | Admin, Moderator, Writer, User roles |
| **Secure Authentication** | JWT-based with OAuth support |
| **Input Validation** | Zod schemas for all forms |
| **XSS Protection** | DOMPurify for HTML sanitization |
| **Audit Logging** | All admin actions are logged |
| **Admin Access Codes** | Hashed server-side with salt |
| **CORS Configuration** | Headers on all Edge Functions |

### Security Best Practices

1. **Never store roles client-side** - Roles are always checked via database
2. **Use RLS policies** - Database enforces access rules
3. **Sanitize user input** - All HTML content is sanitized
4. **Hash sensitive data** - Access codes are hashed with salt
5. **Validate on client AND server** - Double validation for all inputs

---

## 🚢 Deployment

### Deploy with Lovable (Recommended)

1. Open your project in Lovable
2. Click the "Publish" button (top right)
3. Your app is deployed! Get a `.lovable.app` URL

### Custom Domain

1. Go to Project Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

### Self-Hosting

See our [self-hosting guide](https://docs.lovable.dev/tips-tricks/self-hosting) for detailed instructions on deploying to your own infrastructure.

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - feel free to use it for your own projects!

---

## 📞 Support

- **GitHub Issues** - Report bugs or request features
- **Discord** - Join the community for help
- **Documentation** - Visit [docs.lovable.dev](https://docs.lovable.dev)

---

Built with ❤️ using [Lovable](https://lovable.dev)
