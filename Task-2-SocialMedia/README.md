# Mini Social Media Platform

A mini social media web app with user profiles, posts, comments, likes, and a follow system.

## Features

- User registration & login (JWT-based auth)
- User profiles with bio and avatar
- Create, view, and delete posts
- Comment on posts
- Like / unlike posts
- Follow / unfollow other users
- "For You" (all posts) and "Following" feeds

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite (via Node's built-in `node:sqlite` module)
- **Auth:** JWT (jsonwebtoken) + bcrypt password hashing
- **Frontend:** Plain HTML, CSS, JavaScript (no framework, no build step)

## Project Structure

```
server/
  index.js           Express app entrypoint
  db.js              SQLite schema & connection
  middleware/auth.js  JWT auth middleware
  routes/
    auth.js          Register / login
    users.js         Profiles, avatar upload, follow/unfollow
    posts.js         Posts, likes, comments
public/
  index.html         Feed page
  login.html         Login page
  register.html      Registration page
  profile.html        User profile page
  post.html          Single post + comments
  css/style.css
  js/                Frontend logic (api.js, feed.js, profile.js, post.js, ...)
```

## Setup

```bash
npm install
cp .env.example .env   # then edit JWT_SECRET
npm start
```

The app runs at `http://localhost:3000`.

## Requirements

- Node.js 22.5+ (uses the built-in `node:sqlite` module, so no native build tools are required)

## API Overview

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in, returns a JWT |
| GET | `/api/users/:username` | Get a user's profile |
| PUT | `/api/users/me` | Update your bio |
| POST | `/api/users/me/avatar` | Upload an avatar image |
| POST | `/api/users/:username/follow` | Toggle follow |
| GET | `/api/posts` | Feed (`?scope=following` for following-only) |
| POST | `/api/posts` | Create a post |
| GET | `/api/posts/:id` | Post detail with comments |
| DELETE | `/api/posts/:id` | Delete your post |
| POST | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/comments` | Add a comment |
| DELETE | `/api/posts/:postId/comments/:commentId` | Delete your comment |
