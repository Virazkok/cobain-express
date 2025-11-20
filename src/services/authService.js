const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepo');


const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';


if (!JWT_SECRET) {
throw new Error('JWT_SECRET is not set in environment variables');
}


async function register({ username, email, password }) {
const existing = await userRepo.findUserByEmail(email);
if (existing) {
const err = new Error('Email already registered');
err.code = 'EMAIL_EXISTS';
throw err;
}


const hashed = await bcrypt.hash(password, 10);
const user = await userRepo.createUser({ username, email, password: hashed });
return user;
}


async function login({ email, password }) {
const user = await userRepo.findUserByEmail(email);
if (!user) {
const err = new Error('Invalid credentials');
err.code = 'INVALID_CREDENTIALS';
throw err;
}


const match = await bcrypt.compare(password, user.password);
if (!match) {
const err = new Error('Invalid credentials');
err.code = 'INVALID_CREDENTIALS';
throw err;
}


const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });


// Return minimal user info (avoid sending password)
return { token, user: { id: user.id, email: user.email, username: user.username } };
}


module.exports = { register, login };