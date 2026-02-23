const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
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
