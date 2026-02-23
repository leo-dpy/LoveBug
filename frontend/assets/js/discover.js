const API_URL = 'http://localhost:3000/api';
let potentials = [];
let currentCardIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    fetchPotentials(token);

    document.getElementById('btn-like').addEventListener('click', () => swipeAction('liked'));
    document.getElementById('btn-reject').addEventListener('click', () => swipeAction('rejected'));
    document.getElementById('close-match').addEventListener('click', closeMatchModal);
});

async function fetchPotentials(token) {
    try {
        const res = await fetch(`${API_URL}/discover/potentials`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return;
        }

        potentials = await res.json();
        renderStack();
    } catch (err) {
        console.error('Failed to load potentials', err);
        document.getElementById('card-stack').innerHTML = "<p>Erreur lors du chargement des profils.</p>";
    }
}

function renderStack() {
    const stack = document.getElementById('card-stack');
    stack.innerHTML = '';
    currentCardIndex = 0;

    if (potentials.length === 0) {
        stack.innerHTML = `<div class="loading-cards">
            <i class="fa-solid fa-ghost"></i>
            <p>Plus personne autour de vous.</p>
        </div>`;
        return;
    }

    // Afficher les cartes en sens inverse pour que le premier soit au-dessus
    for (let i = potentials.length - 1; i >= 0; i--) {
        const user = potentials[i];
        const card = document.createElement('div');
        card.className = 'swipe-card';
        card.id = `card-${i}`;
        card.style.zIndex = potentials.length - i;

        // Simuler une image de profil
        const imgUrl = user.profile_picture !== 'default.png' ? user.profile_picture : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

        card.innerHTML = `
            <div class="card-stamp stamp-like" id="stamp-like-${i}">LIKE</div>
            <div class="card-stamp stamp-nope" id="stamp-nope-${i}">NOPE</div>
            <div class="card-image" style="background-image: url('${imgUrl}')"></div>
            <div class="card-info">
                <div class="card-name">${user.username}</div>
                <div class="card-bio">${user.bio || "Aucune description... Mystérieux !"}</div>
            </div>
        `;
        stack.appendChild(card);
    }
}

async function swipeAction(action) {
    if (currentCardIndex >= potentials.length) return;

    const targetUser = potentials[currentCardIndex];
    const card = document.getElementById(`card-${currentCardIndex}`);
    const token = localStorage.getItem('token');

    // Animation de la carte
    const direction = action === 'liked' ? 1000 : -1000;
    const rotate = action === 'liked' ? 30 : -30;
    const stamp = document.getElementById(`stamp-${action === 'liked' ? 'like' : 'nope'}-${currentCardIndex}`);

    stamp.style.opacity = '1';
    card.style.transform = `translate(${direction}px, -100px) rotate(${rotate}deg)`;
    card.style.opacity = '0';

    setTimeout(() => {
        card.remove();
    }, 300);

    // Requête Backend
    try {
        const res = await fetch(`${API_URL}/discover/swipe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ targetUserId: targetUser.id, action })
        });
        const data = await res.json();

        if (data.match) {
            showMatchModal();
        }
    } catch (err) {
        console.error("Erreur swipe API", err);
    }

    currentCardIndex++;
    if (currentCardIndex >= potentials.length) {
        fetchPotentials(token); // Recharger d'autres profils
    }
}

function showMatchModal() {
    document.getElementById('match-modal').classList.remove('hidden');
}

function closeMatchModal() {
    document.getElementById('match-modal').classList.add('hidden');
}
