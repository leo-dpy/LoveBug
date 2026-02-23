const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Load Data
    await loadProfile(token);

    // Événements
    document.getElementById('profile-form').addEventListener('submit', (e) => saveProfile(e, token));

    // Upload Avatar Logic
    const btnEditAvatar = document.getElementById('btn-edit-avatar');
    const avatarUpload = document.getElementById('avatar-upload');

    if (btnEditAvatar && avatarUpload) {
        btnEditAvatar.addEventListener('click', (e) => {
            e.preventDefault(); // éviter un submit de form invisible
            avatarUpload.click();
        });

        avatarUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const btnIcon = btnEditAvatar.innerHTML;
                btnEditAvatar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                const res = await fetch(`${API_URL}/profile/upload-avatar`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                const data = await res.json();
                btnEditAvatar.innerHTML = btnIcon; // remettre l'icone caméra

                if (res.ok) {
                    document.getElementById('profile-picture').src = data.profile_picture;

                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        user.profile_picture = data.profile_picture;
                        localStorage.setItem('user', JSON.stringify(user));
                    }
                } else {
                    alert(data.message || 'Erreur lors de l\'upload');
                }
            } catch (err) {
                console.error('Erreur upload avatar', err);
                alert('Erreur réseau');
                btnEditAvatar.innerHTML = '<i class="fa-solid fa-camera"></i>';
            }
        });
    }

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
});

async function loadProfile(token) {
    try {
        const res = await fetch(`${API_URL}/profile/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return;
        }

        const data = await res.json();

        // Mise à jour de l'UI
        document.getElementById('profile-username').textContent = data.username;
        document.getElementById('profile-email').textContent = data.email;

        const avatarUrl = (data.profile_picture && data.profile_picture !== 'default.png') ? data.profile_picture : `../assets/images/default-avatar.svg`;
        document.getElementById('profile-picture').src = avatarUrl;

        // Remplir le formulaire
        document.getElementById('bio').value = data.bio || '';
        document.getElementById('location').value = data.location || '';

        if (data.gender) document.getElementById('gender').value = data.gender;
        if (data.preferences) document.getElementById('preferences').value = data.preferences;

    } catch (err) {
        console.error("Erreur chargement profil", err);
    }
}

async function saveProfile(e, token) {
    e.preventDefault();

    const bio = document.getElementById('bio').value;
    const gender = document.getElementById('gender').value;
    const location = document.getElementById('location').value;
    const preferences = document.getElementById('preferences').value;
    const btn = document.getElementById('btn-save');

    try {
        btn.textContent = "Sauvegarde en cours...";
        btn.disabled = true;

        const res = await fetch(`${API_URL}/profile/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bio, gender, location, preferences })
        });

        const data = await res.json();

        if (res.ok) {
            btn.textContent = "Modifications enregistrées !";
            btn.style.background = "#4cd964"; // Succès

            setTimeout(() => {
                btn.textContent = "Enregistrer les modifications";
                btn.style.background = ""; // Retour gradient
                btn.disabled = false;
            }, 3000);
        } else {
            alert(data.message || "Erreur de sauvegarde");
            btn.textContent = "Enregistrer les modifications";
            btn.disabled = false;
        }

    } catch (err) {
        console.error("Erreur update profil", err);
        btn.textContent = "Enregistrer les modifications";
        btn.disabled = false;
    }
}
