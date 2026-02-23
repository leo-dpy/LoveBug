const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

const db = require('./config/db'); // Test DB connection on startup
const authRoutes = require('./routes/authRoutes'); // Auth routes
const discoverRoutes = require('./routes/discoverRoutes'); // Discover routes
const friendRoutes = require('./routes/friendRoutes'); // Friend routes
const chatRoutes = require('./routes/chatRoutes'); // Chat routes
const profileRoutes = require('./routes/profileRoutes'); // Profile routes

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);

// Tâches planifiées (Cron Jobs) pour le nettoyage des données
// 1. Supprimer les messages non sauvegardés de plus d'1 mois (Exécuté tous les jours à minuit)
cron.schedule('0 0 * * *', async () => {
    try {
        const sql = `DELETE FROM messages WHERE is_saved = FALSE AND created_at < NOW() - INTERVAL 1 MONTH`;
        const [result] = await db.execute(sql);
        console.log(`🧹 Nettoyage: ${result.affectedRows} anciens messages supprimés.`);
    } catch (e) {
        console.error("Erreur Cron (messages):", e);
    }
});

// 2. Supprimer les comptes inactifs depuis 1 an (Exécuté tous les dimanches à 3h du matin)
cron.schedule('0 3 * * 0', async () => {
    try {
        const sql = `DELETE FROM users WHERE last_login < NOW() - INTERVAL 1 YEAR`;
        const [result] = await db.execute(sql);
        console.log(`🧹 Nettoyage: ${result.affectedRows} comptes inactifs supprimés.`);
    } catch (e) {
        console.error("Erreur Cron (utilisateurs):", e);
    }
});

// Sockets Setup (Messagerie en temps réel)
const io = new Server(server, {
    cors: {
        origin: "*", // A configurer en prod
        methods: ["GET", "POST"]
    }
});

// Gérer les utilisateurs connectés: Map<userId, socketId>
const connectedUsers = new Map();

io.on('connection', (socket) => {
    console.log(`🔌 Nouvel utilisateur connecté: ${socket.id}`);

    socket.on('register_user', (userId) => {
        connectedUsers.set(userId, socket.id);
        console.log(`👤 Utilisateur ${userId} enregistré avec le socket ${socket.id}`);
    });

    socket.on('send_message', async (data) => {
        const { senderId, receiverId, content } = data;

        try {
            // Sauvegarder en base de données
            const sql = `INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`;
            const [result] = await db.execute(sql, [senderId, receiverId, content]);

            const messageObj = {
                id: result.insertId,
                sender_id: senderId,
                receiver_id: receiverId,
                content: content,
                created_at: new Date()
            };

            // Envoyer au destinataire s'il est connecté
            const receiverSocket = connectedUsers.get(receiverId);
            if (receiverSocket) {
                io.to(receiverSocket).emit('receive_message', messageObj);
            }
            // Renvoyer à l'envoyeur pour confirmer
            socket.emit('message_sent', messageObj);

        } catch (error) {
            console.error('Erreur socket send_message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Socket déconnecté: ${socket.id}`);
        // Nettoyer la map
        for (let [key, value] of connectedUsers.entries()) {
            if (value === socket.id) {
                connectedUsers.delete(key);
                break;
            }
        }
    });
});

// Servir les fichiers statiques du frontend (HTML, CSS, JS) et les uploads
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rediriger la route '/' vers la page de connexion/inscription par défaut
app.get('/', (req, res) => {
    res.redirect('/pages/index.html');
});

// Port d'écoute
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
});
