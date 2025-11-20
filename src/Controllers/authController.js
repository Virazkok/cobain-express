const authService = require('../services/authService');


async function register(req, res) {
try {
const { username, email, password } = req.body;
if (!username || !email || !password) {
return res.status(400).json({ success: false, message: 'username, email and password are required' });
}


const user = await authService.register({ username, email, password });
return res.status(201).json({ success: true, data: user, message: 'User registered' });
} catch (err) {
if (err.code === 'EMAIL_EXISTS') {
return res.status(409).json({ success: false, message: err.message });
}
console.error(err);
return res.status(500).json({ success: false, message: 'Internal server error' });
}
}


async function login(req, res) {
try {
const { email, password } = req.body;
if (!email || !password) {
return res.status(400).json({ success: false, message: 'email and password are required' });
}


const result = await authService.login({ email, password });
return res.json({ success: true, data: result, message: 'Login successful' });
} catch (err) {
if (err.code === 'INVALID_CREDENTIALS') {
return res.status(401).json({ success: false, message: 'Invalid credentials' });
}
console.error(err);
return res.status(500).json({ success: false, message: 'Internal server error' });
}
}


module.exports = { register, login };