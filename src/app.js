const express = require('express');
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

require('dotenv').config(); // gunakan JWT_SECRET dari .env

const app = express();
app.use(express.json());

// --------------------------
//  CEK KONEKSI DATABASE
// --------------------------
app.get('/version', async (req, res) => {
  try {
    const result = await db.query('SELECT VERSION()');
    res.send(result.rows[0]);
  } catch (error) {
    res.status(500).send(error);
  }
});

// --------------------------
//  REGISTER
// --------------------------
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Cek email sudah ada atau belum
    const existing = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert user baru
    const result = await db.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email`,
      [username, email, hashed]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: "User registered"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --------------------------
//  LOGIN
// --------------------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cari user berdasarkan email
    const result = await db.query(
      "SELECT id, username, email, password FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const user = result.rows[0];

    // Cek password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET, // ambil dari .env
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      },
      message: "Login successful"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --------------------------

app.listen(3000, () => console.log('Server running on port 3000'));
