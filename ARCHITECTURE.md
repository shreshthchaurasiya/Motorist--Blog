# Motorist CMS - System Architecture & Documentation

Welcome to the technical documentation for the **Motorist Blog CMS**. This
document serves as a comprehensive guide for developers, engineers, and
maintainers to understand how the application works, its folder structure, data
flow, and core features.

---

## 🏗 High-Level Architecture

The Motorist CMS is a modern web application built using the **MERN-like stack**
(replacing MongoDB with PostgreSQL). It is decoupled into two primary parts:

1. **Frontend**: A Client-Side Rendered (CSR) React application built with
   **Vite**.
2. **Backend**: A RESTful Node.js/Express server.
3. **Database**: A relational **PostgreSQL** database, managed by the **Prisma
   ORM**.

---

## 📂 Directory Structure

The project is split into two main directories: `/frontend` and `/backend`.

### 1. Frontend (`/frontend`)

The frontend is built with React + Vite. It handles routing, UI rendering, and
interacting with backend APIs.

```text
frontend/
├── index.html              # Entry point of the Vite app
├── package.json            # Dependencies (React, Axios, React-Router, Lucide-Icons)
├── src/
│   ├── config.js           # Global config file (API_URL) - Prevents hardcoded URLs
│   ├── main.jsx            # React root injection point
│   ├── App.jsx             # React Router setup & Global Axios Interceptors
│   ├── index.css           # Global CSS, Theme variables (#1a1528 dark theme), Animations
│   ├── assets/             # Static assets (logo.png)
│   ├── components/         # Reusable UI components
│   │   ├── Navbar.jsx      # Top navigation bar with dark theme & dropdowns
│   │   └── AuthModal.jsx   # Login/Signup modal with phone & password validation
│   └── pages/              # Route-level components
│       ├── Home.jsx        # Public Feed - Displays blogs, handles likes/comments
│       └── admin/          # Protected Admin-only pages
│           ├── AdminLogin.jsx  # Secure login for administrators
│           ├── Dashboard.jsx   # Admin panel (Analytics, delete blogs, reply to comments)
│           └── CreateBlog.jsx  # WYSIWYG/Form for writing and uploading new blogs
```

### 2. Backend (`/backend`)

The backend is a lightweight Express server that exposes REST APIs and handles
image uploads securely.

```text
backend/
├── .env                    # Environment variables (Database URL, JWT Secret, Port)
├── server.js               # Main Express application, Routes, Auth Middleware, File Upload (Multer)
├── package.json            # Dependencies (Express, Prisma, bcrypt, jsonwebtoken, multer)
├── uploads/                # Local storage for uploaded blog cover images
└── prisma/
    └── schema.prisma       # Prisma ORM blueprint (Database Tables: Admin, User, Blog, Comment, Like)
```

---

## 💾 Database Schema (Prisma)

We use a relational database structure to ensure data integrity and scalable
relationships.

- **Admin**: Stores the CMS owner's credentials (username, passwordHash,
  profilePicture).
- **User**: Public readers who sign up using a Phone Number and Password
  (hashed).
- **Blog**: The actual articles. Contains `title`, `content`, `imageUrl`, and a
  relation to the `Admin` who created it.
- **Comment**: Associated with a specific `Blog` and `User`. Includes an
  `adminReply` field for threaded admin responses.
- **Like**: A join-table relationship between `User` and `Blog`. A unique
  constraint `[blogId, userId]` ensures a user can only like a post once.

---

## 🔄 Data Flow & Core Workflows

### 1. Public Authentication Flow (Readers)

1. User clicks the profile icon on the `Navbar` to open `AuthModal.jsx`.
2. They enter Phone, Name, and Password.
3. The frontend sends a `POST /api/users/register` request.
4. Backend hashes the password using `bcrypt` and stores the user.
5. Backend issues a **JSON Web Token (JWT)** valid for 1 day.
6. The token is saved in `localStorage`.
7. **Security Feature**: If a token expires, a Global Axios Interceptor in
   `App.jsx` catches the `401 Unauthorized` error, clears storage, and safely
   reloads the app to prevent "silent crashes".

### 2. Admin Authentication Flow (CMS Manager)

1. Admin navigates to `/admin`.
2. Admin logs in using secure credentials.
3. Backend issues an Admin JWT.
4. The frontend routes (`/dashboard`, `/create`) are protected in `App.jsx` by
   checking if the user `isAuthenticated`.
5. The backend routes are protected by a custom `authMiddleware` inside
   `server.js` that verifies the Admin JWT before allowing database operations.

### 3. Creating a Blog Post

1. Admin fills out the form in `CreateBlog.jsx` and selects an image.
2. The form is sent via `multipart/form-data` to `POST /api/blogs`.
3. `multer` (in `server.js`) intercepts the request, saves the image to the
   `/uploads` folder, and attaches the file path to the request.
4. The blog data is saved to PostgreSQL via Prisma.

### 4. Interactive Feed (Likes & Comments)

1. The public `Home.jsx` fetches all blogs via `GET /api/blogs`.
2. Users can Like a post: `POST /api/blogs/:id/like`. The backend toggles the
   like status (inserts or deletes the record) and returns the updated state.
3. Users can Comment: `POST /api/blogs/:id/comment`.
4. Admins can view these comments in their `Dashboard.jsx` and use
   `PUT /api/comments/:id/reply` to add an `adminReply`.
5. Replies show up inline in the public feed with smooth CSS expanding
   animations (Instagram style).

---

## 🚀 Environment Setup & Deployment Prep

To run the full stack locally:

1. Ensure PostgreSQL is running.
2. Backend: `npm install`, `npx prisma db push`, `node server.js`
3. Frontend: `npm install`, `npm run dev`

**Future Roadmap (SEO & VPS Migration)**

- The frontend is currently CSR. For optimal Google SEO, individual URLs (e.g.,
  `/post/:id`) and dynamic Meta Tags (Open Graph for sharing) will be
  implemented.
- Database migration to a VPS will require a `pg_dump` of the local schema and
  data. Image files in `/uploads` must be manually transferred.
