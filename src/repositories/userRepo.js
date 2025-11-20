// const db = require('../db');


// async function findUserByEmail(email) {
// const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
// return res.rows[0];
// }


// async function findUserById(id) {
// const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
// return res.rows[0];
// }


// async function createUser({ username, email, password }) {
// const res = await db.query(
// `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email`,
// [username, email, password]
// );
// return res.rows[0];
// }


// module.exports = { findUserByEmail, findUserById, createUser };