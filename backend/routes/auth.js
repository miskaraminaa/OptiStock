const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('../config/db');
const router = express.Router();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Test email route
router.get('/test-email', async (req, res) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'Test Email',
            text: 'This is a test email from Gestion de Stock OCP.'
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        res.json({ message: 'Test email sent', info });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ message: 'Failed to send test email', error: error.message });
    }
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        await db.query(sql, [name, email, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Register error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    console.log('Login request body:', req.body);
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (!results || results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const user = results[0];
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('Generated token:', token);
        res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Verify Token
router.get('/verify-token', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('Verify token received:', token);
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error('Token verification failed:', err.message);
                return res.status(401).json({ message: 'Invalid or expired token' });
            }
            console.log('Token decoded:', decoded);
            res.json({ message: 'Token valid', user: { id: decoded.id, email: decoded.email } });
        });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (!results || results.length === 0) {
            return res.status(400).json({ message: 'Email not found' });
        }
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000);
        const insertSql = 'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)';
        await db.query(insertSql, [email, token, expiresAt]);
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `<p>You requested a password reset for Gestion de Stock OCP.</p>
                   <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
                   <p>This link expires in 1 hour.</p>`
        };
        await transporter.sendMail(mailOptions);
        console.log('Reset link sent:', resetLink);
        res.json({ message: 'Password reset link sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;
        console.log('Reset request:', { email, token });
        if (!email || !token || !newPassword) {
            return res.status(400).json({ message: 'Email, token, and new password are required' });
        }
        const [results] = await db.query('SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()', [email, token]);
        console.log('Token query results:', results);
        if (!results || results.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateSql = 'UPDATE users SET password = ? WHERE email = ?';
        await db.query(updateSql, [hashedPassword, email]);
        const deleteSql = 'DELETE FROM password_resets WHERE email = ?';
        await db.query(deleteSql, [email]);
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;