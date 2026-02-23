const db = require('../config/db');

// Envoyer une demande d'ami
exports.sendRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { targetUserId } = req.body;

        if (userId === parseInt(targetUserId)) {
            return res.status(400).json({ message: "Vous ne pouvez pas vous ajouter vous-même." });
        }

        // Vérifier si une demande existe déjà
        const checkSql = `SELECT * FROM friends WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)`;
        const [rows] = await db.execute(checkSql, [userId, targetUserId, targetUserId, userId]);

        if (rows.length > 0) {
            return res.status(400).json({ message: "Une relation existe déjà entre ces utilisateurs." });
        }

        const insertSql = `INSERT INTO friends (user_id_1, user_id_2, status) VALUES (?, ?, 'pending')`;
        await db.execute(insertSql, [userId, targetUserId]);

        res.status(200).json({ message: "Demande d'ami envoyée." });
    } catch (error) {
        console.error("Erreur sendRequest:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Accepter une demande d'ami
exports.acceptRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.body;

        // On vérifie que la demande est bien pour nous (user_id_2 = userId)
        const updateSql = `UPDATE friends SET status = 'accepted' WHERE id = ? AND user_id_2 = ? AND status = 'pending'`;
        const [result] = await db.execute(updateSql, [requestId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Demande introuvable ou déjà acceptée." });
        }

        res.status(200).json({ message: "Demande d'ami acceptée." });
    } catch (error) {
        console.error("Erreur acceptRequest:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Récupérer la liste des amis
exports.getFriends = async (req, res) => {
    try {
        const userId = req.user.id;
        // On récupère les profils des utilisateurs avec qui on est ami ('accepted') ou avec qui on a 'matched'
        const sql = `
            SELECT u.id, u.username, u.profile_picture, u.bio
            FROM users u
            JOIN friends f ON (u.id = f.user_id_1 OR u.id = f.user_id_2)
            WHERE (f.user_id_1 = ? OR f.user_id_2 = ?) 
            AND u.id != ? 
            AND f.status = 'accepted'

            UNION
            
            SELECT u.id, u.username, u.profile_picture, u.bio
            FROM users u
            JOIN matches m ON (u.id = m.user_id_1 OR u.id = m.user_id_2)
            WHERE (m.user_id_1 = ? OR m.user_id_2 = ?) 
            AND u.id != ? 
            AND m.status = 'matched'
        `;

        const [friends] = await db.execute(sql, [userId, userId, userId, userId, userId, userId]);
        res.status(200).json(friends);
    } catch (error) {
        console.error("Erreur getFriends:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Récupérer les requêtes en attente
exports.getPendingRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const sql = `
            SELECT f.id as request_id, u.id as user_id, u.username, u.profile_picture 
            FROM friends f
            JOIN users u ON f.user_id_1 = u.id
            WHERE f.user_id_2 = ? AND f.status = 'pending'
        `;

        const [requests] = await db.execute(sql, [userId]);
        res.status(200).json(requests);
    } catch (error) {
        console.error("Erreur getPendingRequests:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
