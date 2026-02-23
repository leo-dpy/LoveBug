const API_URL = 'http://localhost:3000/api';
let socket;
let currentUser;
let currentChatTarget = null; // { id, username, profile_picture }

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = JSON.parse(userStr);

    // Initialiser Socket.io
    socket = io('http://localhost:3000');
    socket.on('connect', () => {
        console.log('Connecté au WebSocket');
        socket.emit('register_user', currentUser.id);
    });

    // Écouter les nouveaux messages entrants
    socket.on('receive_message', (msg) => {
        if (currentChatTarget && msg.sender_id === currentChatTarget.id) {
            appendMessage(msg, 'received');
        } else {
            // TODO: Afficher une notification globale ou un badge sur le contact
            console.log("Nouveau message de:", msg.sender_id);
        }
    });

    // Le message vient d'être sauvegardé et envoyé avec succès (par nous-même)
    socket.on('message_sent', (msg) => {
        if (msg.sender_id === currentUser.id) {
            appendMessage(msg, 'sent');
        }
    });

    // Événements UI
    document.getElementById('chat-form').addEventListener('submit', sendMessage);
    document.getElementById('btn-back-sidebar').addEventListener('click', showSidebar);

    // Charger les contacts
    await loadContacts(token);

    // Regarder si on a été redirigé avec l'intention de parler à quelqu'un
    const targetId = localStorage.getItem('chatTargetId');
    const targetName = localStorage.getItem('chatTargetName');
    if (targetId && targetName) {
        localStorage.removeItem('chatTargetId'); // Clear
        localStorage.removeItem('chatTargetName');
        openChat({ id: parseInt(targetId), username: targetName, profile_picture: 'default.png' });
    }
});

async function loadContacts(token) {
    try {
        // Obtenir la liste des amis
        const res = await fetch(`${API_URL}/friends/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const contacts = await res.json();
        const list = document.getElementById('contact-list');
        list.innerHTML = '';

        if (contacts.length === 0) {
            list.innerHTML = `<p class="text-muted" style="padding: 1rem; text-align: center;">Aucun contact disponible pour discuter.</p>`;
            return;
        }

        contacts.forEach(c => {
            const imgUrl = c.profile_picture !== 'default.png' ? c.profile_picture : `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`;
            const item = document.createElement('div');
            item.className = 'contact-item';
            item.innerHTML = `
                <img src="${imgUrl}" alt="${c.username}" class="contact-avatar">
                <div class="contact-name">${c.username}</div>
            `;
            item.addEventListener('click', () => {
                // Remove active class from others
                document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                openChat({ id: c.id, username: c.username, profile_picture: imgUrl });
            });
            list.appendChild(item);
        });
    } catch (err) {
        console.error("Erreur charagement contacts", err);
    }
}

async function openChat(contact) {
    currentChatTarget = contact;

    // UI Updates
    document.getElementById('empty-chat').classList.add('hidden');
    document.getElementById('active-chat').classList.remove('hidden');
    document.getElementById('chat-username').textContent = contact.username;

    const avatarUrl = contact.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.username}`;
    document.getElementById('chat-avatar').src = avatarUrl;

    // Mobile: hide sidebar
    if (window.innerWidth <= 768) {
        document.getElementById('chat-sidebar').classList.add('hidden-mobile');
    }

    // Load History
    const token = localStorage.getItem('token');
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '<p class="text-muted text-center" style="text-align:center;">Chargement de l\'historique...</p>';

    try {
        const res = await fetch(`${API_URL}/chat/history/${contact.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const history = await res.json();

        messagesContainer.innerHTML = '';
        if (history.length === 0) {
            messagesContainer.innerHTML = '<p class="text-muted text-center" style="text-align:center; flex:1; display:flex; align-items:center; justify-content:center;">Début de la conversation 👋</p>';
        } else {
            history.forEach(msg => {
                const type = msg.sender_id === currentUser.id ? 'sent' : 'received';
                appendMessage(msg, type);
            });
        }
    } catch (err) {
        console.error("Erreur historique", err);
        messagesContainer.innerHTML = '<p class="text-muted">Erreur de chargement.</p>';
    }
}

function sendMessage(e) {
    e.preventDefault();
    if (!currentChatTarget) return;

    const input = document.getElementById('message-input');
    const content = input.value.trim();

    if (content) {
        // Envoyer data au serveur Socket.io
        socket.emit('send_message', {
            senderId: currentUser.id,
            receiverId: currentChatTarget.id,
            content: content
        });

        input.value = '';
    }
}

function appendMessage(msg, type) {
    const messagesContainer = document.getElementById('chat-messages');

    // Enlever le message placeholder s'il existe
    const placeholder = messagesContainer.querySelector('.text-center');
    if (placeholder) {
        placeholder.remove();
    }

    const div = document.createElement('div');
    div.className = `message ${type}`;
    if (msg.is_saved) {
        div.classList.add('saved-message');
    }
    div.textContent = msg.content;

    // Ajout titre indicateur
    div.title = "Double-cliquez pour conserver ce message dans le temps.";

    // Action de sauvegarde (double click)
    div.addEventListener('dblclick', async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/chat/toggle-save`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ messageId: msg.id })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.is_saved) {
                    div.classList.add('saved-message');
                } else {
                    div.classList.remove('saved-message');
                }
            } else {
                console.warn("Impossible de changer l'état de sauvegarde du message.");
            }
        } catch (err) {
            console.error("Erreur save chat", err);
        }
    });

    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showSidebar() {
    document.getElementById('chat-sidebar').classList.remove('hidden-mobile');
}
