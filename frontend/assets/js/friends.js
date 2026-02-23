const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Tabs
    const tabList = document.getElementById('tab-list');
    const tabRequests = document.getElementById('tab-requests');
    const secList = document.getElementById('friends-list');
    const secRequests = document.getElementById('requests-list');

    tabList.addEventListener('click', () => {
        tabList.classList.add('active');
        tabRequests.classList.remove('active');
        secList.style.display = 'flex';
        secRequests.style.display = 'none';
    });

    tabRequests.addEventListener('click', () => {
        tabRequests.classList.add('active');
        tabList.classList.remove('active');
        secRequests.style.display = 'flex';
        secList.style.display = 'none';
        fetchRequests(token); // Refresh requests when clicked
    });

    // Envoyer une demande
    document.getElementById('btn-add-friend').addEventListener('click', () => {
        const input = document.getElementById('friend-id-input');
        if (input.value) sendRequest(token, input.value);
    });

    // Chargement initial
    fetchFriends(token);
    fetchRequests(token);
});

async function fetchFriends(token) {
    try {
        const res = await fetch(`${API_URL}/friends/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const friends = await res.json();

        const container = document.getElementById('friends-container');
        container.innerHTML = '';

        if (friends.length === 0) {
            container.innerHTML = '<p class="text-muted">Vous n\'avez pas encore d\'amis ou de matchs.</p>';
            return;
        }

        friends.forEach(f => {
            const imgUrl = (f.profile_picture && f.profile_picture !== 'default.png') ? f.profile_picture : `../assets/images/default-avatar.svg`;
            container.innerHTML += `
                <div class="user-item">
                    <img src="${imgUrl}" alt="${f.username}" class="user-avatar">
                    <div class="user-info">
                        <div class="user-name">${f.username} <span class="text-muted" style="font-size:0.8rem">#${f.id}</span></div>
                        <div class="user-status">Ami / Match</div>
                    </div>
                    <button class="btn-icon chat" onclick="goToChat(${f.id}, '${f.username}')" title="Discuter">
                        <i class="fa-solid fa-comment"></i>
                    </button>
                </div>
            `;
        });
    } catch (err) {
        console.error(err);
    }
}

async function fetchRequests(token) {
    try {
        const res = await fetch(`${API_URL}/friends/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const requests = await res.json();

        const container = document.getElementById('requests-container');
        const badge = document.getElementById('req-count');
        container.innerHTML = '';

        if (requests.length > 0) {
            badge.textContent = requests.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
            container.innerHTML = '<p class="text-muted">Aucune demande en attente.</p>';
            return;
        }

        requests.forEach(req => {
            const imgUrl = (req.profile_picture && req.profile_picture !== 'default.png') ? req.profile_picture : `../assets/images/default-avatar.svg`;
            const div = document.createElement('div');
            div.className = 'user-item'; // Changed from 'friend-card' to 'user-item' to match existing styling
            div.innerHTML = `
                <img src="${imgUrl}" alt="${req.username}" class="user-avatar">
                <div class="user-info">
                    <div class="user-name">${req.username}</div>
                    <div class="user-status">Souhaite vous ajouter</div>
                </div>
                <button class="btn-icon accept" onclick="acceptRequest(${req.request_id})" title="Accepter">
                    <i class="fa-solid fa-check"></i>
                </button>
            `;
            container.appendChild(div);
        });
    } catch (err) {
        console.error(err);
    }
}

async function sendRequest(token, targetId) {
    try {
        const res = await fetch(`${API_URL}/friends/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ targetUserId: targetId })
        });

        const data = await res.json();
        alert(data.message);
        document.getElementById('friend-id-input').value = '';
    } catch (err) {
        console.error(err);
    }
}

window.acceptRequest = async function (requestId) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/friends/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ requestId })
        });
        const data = await res.json();
        if (res.ok) {
            fetchRequests(token);
            fetchFriends(token);
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
    }
}

window.goToChat = function (userId, username) {
    // Redirige vers le chat en passant l'ID et le nom dans l'URL (ou localStorage)
    localStorage.setItem('chatTargetId', userId);
    localStorage.setItem('chatTargetName', username);
    window.location.href = 'chat.html';
}
