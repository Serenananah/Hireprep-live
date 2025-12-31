// backend/server.js
const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// === 1. Initialize App ===
const app = express();
app.use(express.json());
app.use(cors());

// === 2. Initialize SQLite (better-sqlite3) ===
const db = new Database("./db.sqlite");

// Create users table (sync + safer)
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT
  )
`).run();

console.log("SQLite database connected (better-sqlite3).");

// === 3. Register API ===
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(name, email, hashed);

    return res.json({
      id: result.lastInsertRowid,
      name,
      email
    });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "Email already exists." });
    }
    return res.status(500).json({ error: "Server error." });
  }
});

// === 4. Login API ===
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user) {
    return res.status(400).json({ error: "User not found." });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ error: "Invalid password." });
  }

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email
  });
});

// === 5. Start server ===
// Cloud platforms set PORT automatically
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
