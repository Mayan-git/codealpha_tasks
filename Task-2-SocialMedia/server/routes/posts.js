const express = require("express");
const db = require("../db");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

const POST_SELECT = `
  SELECT p.id, p.content, p.image_url AS imageUrl, p.created_at AS createdAt,
         u.username AS authorUsername, u.avatar_url AS authorAvatarUrl,
         (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likeCount,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS commentCount
  FROM posts p JOIN users u ON u.id = p.user_id
`;

function attachLikedByMe(posts, viewerId) {
  if (!viewerId || posts.length === 0) {
    return posts.map((p) => ({ ...p, likedByMe: false }));
  }
  const ids = posts.map((p) => p.id);
  const placeholders = ids.map(() => "?").join(",");
  const liked = new Set(
    db
      .prepare(`SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (${placeholders})`)
      .all(viewerId, ...ids)
      .map((r) => r.post_id)
  );
  return posts.map((p) => ({ ...p, likedByMe: liked.has(p.id) }));
}

// GET /api/posts?scope=following  (default: all posts, newest first)
router.get("/", optionalAuth, (req, res) => {
  const scope = req.query.scope;

  let posts;
  if (scope === "following") {
    if (!req.user) return res.status(401).json({ error: "Login required for following feed" });
    posts = db
      .prepare(
        `${POST_SELECT}
         WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
            OR p.user_id = ?
         ORDER BY p.created_at DESC LIMIT 100`
      )
      .all(req.user.id, req.user.id);
  } else {
    posts = db.prepare(`${POST_SELECT} ORDER BY p.created_at DESC LIMIT 100`).all();
  }

  res.json(attachLikedByMe(posts, req.user && req.user.id));
});

// GET /api/posts/user/:username
router.get("/user/:username", optionalAuth, (req, res) => {
  const user = db.prepare("SELECT id FROM users WHERE username = ?").get(req.params.username);
  if (!user) return res.status(404).json({ error: "User not found" });

  const posts = db
    .prepare(`${POST_SELECT} WHERE p.user_id = ? ORDER BY p.created_at DESC`)
    .all(user.id);
  res.json(attachLikedByMe(posts, req.user && req.user.id));
});

// GET /api/posts/:id
router.get("/:id", optionalAuth, (req, res) => {
  const post = db.prepare(`${POST_SELECT} WHERE p.id = ?`).get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const comments = db
    .prepare(
      `SELECT c.id, c.content, c.created_at AS createdAt,
              u.username AS authorUsername, u.avatar_url AS authorAvatarUrl
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ? ORDER BY c.created_at ASC`
    )
    .all(post.id);

  const [withLiked] = attachLikedByMe([post], req.user && req.user.id);
  res.json({ ...withLiked, comments });
});

// POST /api/posts
router.post("/", requireAuth, (req, res) => {
  const { content, imageUrl } = req.body || {};
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Post content is required" });
  }
  if (content.length > 2000) {
    return res.status(400).json({ error: "Post content must be 2000 characters or fewer" });
  }

  const info = db
    .prepare("INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)")
    .run(req.user.id, content.trim(), imageUrl || "");

  const post = db.prepare(`${POST_SELECT} WHERE p.id = ?`).get(info.lastInsertRowid);
  res.status(201).json({ ...post, likedByMe: false });
});

// DELETE /api/posts/:id
router.delete("/:id", requireAuth, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.user_id !== req.user.id) return res.status(403).json({ error: "Not your post" });

  db.prepare("DELETE FROM posts WHERE id = ?").run(post.id);
  res.status(204).end();
});

// POST /api/posts/:id/like  (toggle)
router.post("/:id/like", requireAuth, (req, res) => {
  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const existing = db
    .prepare("SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?")
    .get(post.id, req.user.id);

  if (existing) {
    db.prepare("DELETE FROM likes WHERE post_id = ? AND user_id = ?").run(post.id, req.user.id);
  } else {
    db.prepare("INSERT INTO likes (post_id, user_id) VALUES (?, ?)").run(post.id, req.user.id);
  }

  const likeCount = db.prepare("SELECT COUNT(*) AS n FROM likes WHERE post_id = ?").get(post.id).n;
  res.json({ liked: !existing, likeCount });
});

// POST /api/posts/:id/comments
router.post("/:id/comments", requireAuth, (req, res) => {
  const post = db.prepare("SELECT id FROM posts WHERE id = ?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const { content } = req.body || {};
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Comment content is required" });
  }
  if (content.length > 500) {
    return res.status(400).json({ error: "Comment must be 500 characters or fewer" });
  }

  const info = db
    .prepare("INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)")
    .run(post.id, req.user.id, content.trim());

  const comment = db
    .prepare(
      `SELECT c.id, c.content, c.created_at AS createdAt,
              u.username AS authorUsername, u.avatar_url AS authorAvatarUrl
       FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?`
    )
    .get(info.lastInsertRowid);
  res.status(201).json(comment);
});

// DELETE /api/posts/:postId/comments/:commentId
router.delete("/:postId/comments/:commentId", requireAuth, (req, res) => {
  const comment = db.prepare("SELECT * FROM comments WHERE id = ?").get(req.params.commentId);
  if (!comment || comment.post_id !== Number(req.params.postId)) {
    return res.status(404).json({ error: "Comment not found" });
  }
  if (comment.user_id !== req.user.id) {
    return res.status(403).json({ error: "Not your comment" });
  }
  db.prepare("DELETE FROM comments WHERE id = ?").run(comment.id);
  res.status(204).end();
});

module.exports = router;
