const db = require('../config/db');

class User {
    static async create(username, email, passwordHash) {
        const sql = `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`;
        const [result] = await db.execute(sql, [username, email, passwordHash]);
        return result.insertId;
    }

    static async findByEmail(email) {
        const sql = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await db.execute(sql, [email]);
        return rows[0];
    }

    static async findById(id) {
        const sql = `SELECT id, username, email, bio, profile_picture, gender, preferences, location FROM users WHERE id = ?`;
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
