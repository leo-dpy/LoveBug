const db = require('../config/db');

exports.getPotentials = async (req, res) => {
    try {
        const userId = req.user.id; // Injecté par le middleware d'auth

        // Logique de base : récupérer des utilisateurs qui ne sont pas nous,
        // et qu'on n'a pas encore swipé (status = liked, matched, rejected).
        // Plus tard, on filtrera par préférences de genre.

        const sql = `
            SELECT id, username, bio, profile_picture, gender, location 
            FROM users 
            WHERE id != ? 
            AND id NOT IN (
                SELECT user_id_2 FROM matches WHERE user_id_1 = ?
            )
            LIMIT 10
        `;

        const [users] = await db.execute(sql, [userId, userId]);

        res.status(200).json(users);
    } catch (error) {
        console.error("Erreur discover :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.swipe = async (req, res) => {
    try {
        const userId1 = req.user.id;
        const { targetUserId, action } = req.body; // action = 'liked' ou 'rejected'

        if (!targetUserId || !['liked', 'rejected'].includes(action)) {
            return res.status(400).json({ message: "Action invalide." });
        }

        // Insérer le swipe dans la BDD
        const insertSql = `INSERT INTO matches (user_id_1, user_id_2, status) VALUES (?, ?, ?)`;
        await db.execute(insertSql, [userId1, targetUserId, action]);

        // Si on a liké, il faut vérifier si l'autre nous a aussi liké
        if (action === 'liked') {
            const checkMatchSql = `
                SELECT status FROM matches 
                WHERE user_id_1 = ? AND user_id_2 = ? AND status IN ('liked', 'matched')
            `;
            const [rows] = await db.execute(checkMatchSql, [targetUserId, userId1]);

            if (rows.length > 0) {
                // IT'S A MATCH!
                // Mettre à jour les deux côtés pour 'matched' au lieu de 'liked'
                const updateMatchSql = `
                    UPDATE matches SET status = 'matched' 
                    WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)
                `;
                await db.execute(updateMatchSql, [userId1, targetUserId, targetUserId, userId1]);

                return res.status(200).json({ message: "It's a Match!", match: true });
            }
        }

        res.status(200).json({ message: "Swipe pris en compte.", match: false });
    } catch (error) {
        console.error("Erreur swipe :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
