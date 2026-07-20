const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const db = require("../db");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "public", "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.user.id}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.mimetype);
    cb(ok ? null : new Error("Only image uploads are allowed"), ok);
  },
});

function getCounts(userId) {
  const followers = db
    .prepare("SELECT COUNT(*) AS n FROM follows WHERE following_id = ?")
    .get(userId).n;
  const following = db
    .prepare("SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?")
    .get(userId).n;
  const posts = db.prepare("SELECT COUNT(*) AS n FROM posts WHERE user_id = ?").get(userId).n;
  return { followers, following, posts };
}

function profileFor(username, viewerId) {
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) return null;

  const counts = getCounts(user.id);
  const isFollowing = viewerId
    ? !!db
        .prepare("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?")
        .get(viewerId, user.id)
    : false;

  return {
    id: user.id,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    ...counts,
    isFollowing,
    isSelf: viewerId === user.id,
  };
}

router.get("/:username", optionalAuth, (req, res) => {
  const profile = profileFor(req.params.username, req.user && req.user.id);
  if (!profile) return res.status(404).json({ error: "User not found" });
  res.json(profile);
});

router.put("/me", requireAuth, (req, res) => {
  const { bio } = req.body || {};
  if (typeof bio !== "string") {
    return res.status(400).json({ error: "bio must be a string" });
  }
  if (bio.length > 280) {
    return res.status(400).json({ error: "bio must be 280 characters or fewer" });
  }
  db.prepare("UPDATE users SET bio = ? WHERE id = ?").run(bio, req.user.id);
  const profile = profileFor(req.user.username, req.user.id);
  res.json(profile);
});

router.post("/me/avatar", requireAuth, (req, res) => {
  upload.single("avatar")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const avatarUrl = `/uploads/${req.file.filename}`;
    db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(avatarUrl, req.user.id);
    res.json({ avatarUrl });
  });
});

router.post("/:username/follow", requireAuth, (req, res) => {
  const target = db.prepare("SELECT * FROM users WHERE username = ?").get(req.params.username);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === req.user.id) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }

  const existing = db
    .prepare("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?")
    .get(req.user.id, target.id);

  if (existing) {
    db.prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?").run(
      req.user.id,
      target.id
    );
  } else {
    db.prepare("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)").run(
      req.user.id,
      target.id
    );
  }

  const counts = getCounts(target.id);
  res.json({ following: !existing, followers: counts.followers });
});

router.get("/:username/followers", (req, res) => {
  const target = db.prepare("SELECT id FROM users WHERE username = ?").get(req.params.username);
  if (!target) return res.status(404).json({ error: "User not found" });

  const rows = db
    .prepare(
      `SELECT u.username, u.avatar_url AS avatarUrl, u.bio
       FROM follows f JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = ? ORDER BY f.created_at DESC`
    )
    .all(target.id);
  res.json(rows);
});

router.get("/:username/following", (req, res) => {
  const target = db.prepare("SELECT id FROM users WHERE username = ?").get(req.params.username);
  if (!target) return res.status(404).json({ error: "User not found" });

  const rows = db
    .prepare(
      `SELECT u.username, u.avatar_url AS avatarUrl, u.bio
       FROM follows f JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = ? ORDER BY f.created_at DESC`
    )
    .all(target.id);
  res.json(rows);
});

module.exports = router;
