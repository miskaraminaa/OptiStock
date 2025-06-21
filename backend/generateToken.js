const jwt = require('jsonwebtoken');

const payload = {
    id: 'test_user_123', // Simulate a user ID
    email: 'test@example.com' // Simulate a user email
};
const secret = '6eb4167e20180c770475898607aa43fe8e2aec3fc157337c0b15fa39e4f728dd'; // Replace with your JWT_SECRET from .env
const options = { expiresIn: '1h' }; // Token valid for 1 hour

const token = jwt.sign(payload, secret, options);
console.log('Generated Token:', token);