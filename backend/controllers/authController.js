const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const db = require('../config/db');
require('dotenv').config();

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingEmail = await User.findByEmail(email);
        const existingUser = await User.findByUsername(username);

        if (existingEmail || existingUser) {
            return res.status(409).json({ message: "Cet email ou ce pseudo est déjà utilisé." });
        }

        // Hasher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Créer l'utilisateur
        const newUserId = await User.create(username, email, passwordHash);

        res.status(201).json({ message: "Utilisateur créé avec succès !", userId: newUserId });
    } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Veuillez fournir un email et un mot de passe." });
        }

        // Trouver l'utilisateur
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }

        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }

        // Générer le token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Mettre à jour la date de dernière connexion (Désactivé temporairement pour éviter les crashs)
        // await db.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        res.status(200).json({
            message: "Connexion réussie !",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profile_picture: user.profile_picture,
                friend_id: user.friend_id,
                tokens: user.tokens
            }
        });
    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        res.status(500).json({ message: "Erreur serveur lors de la connexion." });
    }
};
