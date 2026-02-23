const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

promisePool.getConnection()
    .then(connection => {
        console.log('✅ Base de données LoveBug connectée via WampServer');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Erreur de connexion à la base de données:', err.message);
    });

module.exports = promisePool;
