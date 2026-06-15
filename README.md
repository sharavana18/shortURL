# 🔗 ZibLink – URL Shortener with Analytics

## Overview

ZibLink is a full-stack URL shortening platform that allows users to generate short URLs, manage their links, and track analytics such as click counts, recent visits, and link performance.

The application provides a secure authentication system, a responsive dashboard, and real-time analytics for every shortened URL.

---

## Features

### Authentication

* User Registration (Signup)
* User Login
* Password Hashing using bcrypt
* JWT-based Authentication
* Protected Routes
* User-specific URL management

### URL Shortening

* Create short URLs from long URLs
* Unique short code generation
* URL validation before shortening
* Server-side redirection
* Copy short URL with one click

### Dashboard

* View all created URLs
* Display:

  * Original URL
  * Short URL
  * Creation Date
  * Total Click Count
* Delete URLs
* Responsive and user-friendly interface

### Analytics

* Track clicks for each URL
* Store visit timestamps
* View:

  * Total Click Count
  * Last Visited Time
  * Recent Visit History
* Analytics dashboard for each URL

### Bonus Features Implemented

* QR Code Generation
* Daily Click Trend Charts
* Custom URL Alias
* Responsive UI Design

---

# Tech Stack

## Frontend

* React.js
* React Router
* Axios
* Chart.js
* Tailwind CSS / CSS Modules

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose ODM

## Authentication

* JWT (JSON Web Token)
* bcrypt.js

---

# System Architecture

```text
User
  │
  ▼
React Frontend
  │
  ▼
REST APIs
  │
  ▼
Express Backend
  │
  ├── Authentication Module
  ├── URL Shortener Module
  ├── Analytics Module
  │
  ▼
MongoDB Database
```

---

# Database Design

## User Collection

```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "hashed_password",
  "createdAt": "timestamp"
}
```

## URL Collection

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "originalUrl": "https://example.com",
  "shortCode": "abc123",
  "clicks": 10,
  "createdAt": "timestamp"
}
```

## Analytics Collection

```json
{
  "_id": "ObjectId",
  "urlId": "ObjectId",
  "visitedAt": "timestamp",
  "device": "Chrome",
  "browser": "Chrome"
}
```

---

# AI Planning Document

## Planning Phase

The application was divided into the following modules:

### Phase 1 – Authentication

* User Signup
* User Login
* JWT Authentication
* Route Protection

### Phase 2 – URL Management

* URL Validation
* Short URL Generation
* URL Storage
* Redirect Handling

### Phase 3 – Analytics

* Click Tracking
* Visit Logging
* Analytics Dashboard
* Trend Visualization

### Phase 4 – UI Development

* Responsive Layout
* Dashboard Design
* Error Handling
* Loading States

### Phase 5 – Testing & Deployment

* API Testing
* Authentication Testing
* Analytics Validation
* Deployment

---

# API Endpoints

## Authentication

### Register User

```http
POST /api/auth/register
```

### Login User

```http
POST /api/auth/login
```

---

## URL Management

### Create Short URL

```http
POST /api/urls
```

### Get User URLs

```http
GET /api/urls
```

### Delete URL

```http
DELETE /api/urls/:id
```

### Redirect URL

```http
GET /:shortCode
```

---

## Analytics

### Get URL Analytics

```http
GET /api/analytics/:id
```

---

# Setup Instructions

## Prerequisites

* Node.js v18+
* MongoDB
* Git

---

## Clone Repository

```bash
git clone YOUR_REPO_LINK
cd url-shortener
```

---

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
BASE_URL=http://localhost:5000
```

Start Backend:

```bash
npm start
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

# Screenshots

## Login Page

![Uploading Screenshot 2026-06-15 163019.png…]()


## Dashboard

![Uploading WhatsApp Image 2026-06-15 at 4.32.48 PM.jpeg…]()


## Analytics Page

![Uploading Screenshot 2026-06-15 163444.png…]()

---

# Sample Database Entries

## User

```json
{
  "name": "Sharavanakumar S",
  "email": "user@example.com"
}
```

## URL

```json
{
  "originalUrl": "https://google.com",
  "shortCode": "g7Hd9A",
  "clicks": 15
}
```

---

# Testing

### Functional Testing

* Signup
* Login
* URL Creation
* URL Deletion
* URL Redirection
* Analytics Tracking

### Validation Testing

* Invalid URLs
* Duplicate URLs
* Unauthorized Access

---

# Assumptions

* Every shortened URL belongs to a single user.
* MongoDB is available and accessible.
* JWT tokens are stored securely.
* Analytics are recorded on every redirect.

---

# Deployment

Frontend Deployment:

* Vercel

Backend Deployment:

* Render

Database:

* MongoDB Atlas

---

# Demo Video

YouTube / Loom Video:

[YOUR_VIDEO_LINK](https://youtu.be/WbxqXKCx8c8?si=T8EKAbsJvhrvw_RF)

---

# Future Improvements

* Link Expiry
* Geolocation Analytics
* Device Analytics
* Bulk URL Shortening
* Team Workspaces
* Advanced Reporting

---

# Author

Sharavanakumar S


---

## Hackathon Submission Note

This project is a part of a hackathon run by https://katomaran.com
