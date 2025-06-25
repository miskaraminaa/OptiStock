const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: true
});

console.log('Pool created:', pool ? 'Yes' : 'No');

// Test the connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connection established successfully with pool');
        connection.release();
    } catch (err) {
        console.error('Database connection failed:', err.message, err.stack);
    }
})();

module.exports = pool;