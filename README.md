# LinkNest 🌐 - Premium URL Shortener & Analytics

**OVERVIEW**
A full-stack URL Shortener application built with React, Node.js (Express), and MongoDB, where authenticated users can shorten long URLs, manage their links from a personal dashboard, and track performance analytics. Each shortened URL records click counts, visit timestamps, and supports features like custom aliases, QR code generation, and expiry dates. The backend handles server-side redirects, JWT-based authentication, and stores all analytics data in the database with proper validation. The frontend provides a responsive, clean dashboard with real-time feedback, copy-to-clipboard functionality, and visual charts for daily click trends.

---

## 🛠️ Tech Stack

- **Frontend**: React (Vite, Tailwind CSS, Lucide icons, Recharts)
- **Backend**: Node.js & Express.js (express-validator)
- **Database**: MongoDB & Mongoose
- **Auth**: JWT (JSON Web Tokens stored in localStorage)

---

## 🎯 Features

1. **JWT Authentication**: Secure register and login system with hashed passwords using `bcrypt`.
2. **URL Shortening**: Generates unique, 6-character alphanumeric slugs with automatic collision safety checks.
3. **Custom Aliases**: Allow users to customize shortened links with specific slugs (e.g. `/r/portfolio`).
4. **Link Expiration**: Enable users to specify future expiry dates. Expired links automatically render a `410 Gone` code.
5. **Interactive Dashboard**:
   - Live metrics panels showing Total Links, Total Redirects, and Active Links.
   - Clean, searchable tables displaying shortened links.
   - Click-to-copy convenience and instant QR Code rendering with PNG downloading capabilities.
6. **Granular Analytics**:
   - Total hits and last visited timestamp counters.
   - Visual trend line graphs displaying daily traffic count over the last 7 days.
   - Access Logs detailing IP and browser metadata for the last 10 visits.
7. **Public Stats**: Public statistics dashboard accessible at `/stats/:shortCode` for monitoring link clicks without account requirements.

---

## 🏗️ Architecture

```text
               +-------------------------------------------+
               |                CLIENT (React)             |
               |                                           |
               |  +------------+   +--------------------+  |
               |  | Auth Pages |   | Link Dashboard/    |  |
               |  |  (Sign-in) |   | Analytics / Stats  |  |
               |  +-----+------+   +---------+----------+  |
               +--------|--------------------|-------------+
                        | HTTP Request       | HTTP (Bearer Token)
                        v                    v
               +--------+--------------------+-------------+
               |               SERVER (Express)            |
               |                                           |
               |  +--------------------+                     |
               |  |  Auth Middleware   |                     |
               |  +---------+----------+                     |
               |            |                                |
               |            v                                |
               |  +---------+----------+                     |
               |  | Routes & Controllers                     |
               |  +---------+----------+                     |
               +------------|------------------------------+
                             | Mongoose Query
                             v
               +------------+------------------------------+
               |               DATABASE (MongoDB)          |
               |                                           |
               |  [User]    [Url]    [Visit (Analytics)]   |
               +-------------------------------------------+
```

---

## ⚙️ Setup Instructions

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16+) and [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally.

### 1. Server Setup
1. Open a terminal and navigate to the `/server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Customize environment variables in `.env` if needed:
   - `PORT`: Port on which the API runs (default: `5000`)
   - `MONGO_URI`: MongoDB connection string (default: `mongodb://127.0.0.1:27017/linknest`)
   - `JWT_SECRET`: Random secret used for authentication tokens
   - `BASE_URL`: Root address of shortened link redirection service (default: `http://localhost:5000`)
5. Start the backend:
   ```bash
   npm start
   ```

### 2. Client Setup
1. Open a new terminal and navigate to the `/client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the displayed host (usually `http://localhost:5173`).

---

## 🤖 AI Planning & Design

During design, the application structure was built using a clean, layered architectural pattern:
- **Separation of Concerns**: Controllers deal only with business logic, routes mapping handles parameters validation, and middleware intercepts unauthorized tokens.
- **Cascading Integrity**: Deleting a short link executes a cascading Mongo query that removes related analytics logs so storage requirements are optimized.
- **Aggregated Date Matching**: To render charts using Recharts, the analytics pipeline runs aggregation groupings and fills missing intervals with zeroes to ensure dashboard components always render smoothly.

---

## 🎬 Demo Walkthrough
- [Video Demo Placeholder (Loom/YouTube)](https://youtube.com)

---
This project is a part of a hackathon run by https://katomaran.com
