const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Accès refusé. Aucun token fourni." });
    }

    const token = authHeader.split(' ')[1]; // Format: Bearer <token>

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // On ajoute les infos de l'utilisateur à req
        next();
    } catch (error) {
        res.status(401).json({ message: "Token invalide." });
    }
};
