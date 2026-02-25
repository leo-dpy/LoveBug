const db = require('../config/db');

class User {
    static async create(username, email, passwordHash) {
        // Generate a random 8-character string for friend ID
        const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
        const friendId = `${username.substring(0, 3).toUpperCase()}-${randomString}`;

        const sql = `INSERT INTO users (username, email, password_hash, friend_id) VALUES (?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [username, email, passwordHash, friendId]);
        return result.insertId;
    }

    static async findByEmail(email) {
        const sql = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await db.execute(sql, [email]);
        return rows[0];
    }

    static async findById(id) {
        const sql = `SELECT id, username, email, bio, profile_picture, gender, preferences, location, friend_id, tokens FROM users WHERE id = ?`;
        const [rows] = await db.execute(sql, [id]);
        return rows[0];
    }

    static async findByUsername(username) {
        const sql = `SELECT * FROM users WHERE username = ?`;
        const [rows] = await db.execute(sql, [username]);
        return rows[0];
    }
}

module.exports = User;
