const db = require('../config/db');

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const sql = `SELECT id, username, email, bio, profile_picture, gender, preferences, location, friend_id FROM users WHERE id = ?`;
        const [rows] = await db.execute(sql, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Erreur getProfile:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, gender, preferences, location } = req.body;

        const sql = `UPDATE users SET bio = ?, gender = ?, preferences = ?, location = ? WHERE id = ?`;
        await db.execute(sql, [bio, gender, preferences, location, userId]);

        res.status(200).json({ message: "Profil mis à jour avec succès" });
    } catch (error) {
        console.error("Erreur updateProfile:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.updateAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier reçu." });
        }

        const userId = req.user.id;
        const profilePictureUrl = `http://localhost:3000/uploads/profiles/${req.file.filename}`;

        const sql = `UPDATE users SET profile_picture = ? WHERE id = ?`;
        await db.execute(sql, [profilePictureUrl, userId]);

        res.status(200).json({ message: "Avatar mis à jour", profile_picture: profilePictureUrl });
    } catch (error) {
        console.error("Erreur updateAvatar:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
