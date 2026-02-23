const db = require('../config/db');

exports.getHistory = async (req, res) => {
    try {
        const userId1 = req.user.id;
        const userId2 = req.params.otherUserId;

        const sql = `
            SELECT * FROM messages 
            WHERE (sender_id = ? AND receiver_id = ?)
               OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
        `;

        const [messages] = await db.execute(sql, [userId1, userId2, userId2, userId1]);

        // Marquer les messages comme lus (optionnel mais recommandé)
        const updateSql = `UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE`;
        await db.execute(updateSql, [userId2, userId1]);

        res.status(200).json(messages);
    } catch (error) {
        console.error("Erreur getHistory:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.toggleSave = async (req, res) => {
    try {
        const { messageId } = req.body;
        const userId = req.user.id;

        const checkSql = `SELECT is_saved FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)`;
        const [rows] = await db.execute(checkSql, [messageId, userId, userId]);
        if (rows.length === 0) return res.status(403).json({ message: "Action non autorisée." });

        const newStatus = rows[0].is_saved ? false : true;
        const updateSql = `UPDATE messages SET is_saved = ? WHERE id = ?`;
        await db.execute(updateSql, [newStatus, messageId]);

        res.status(200).json({ is_saved: newStatus });
    } catch (e) {
        console.error("Erreur toggleSave:", e);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
