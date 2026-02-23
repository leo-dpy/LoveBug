const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Redirection automatique si déjà connecté
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr && window.location.pathname.endsWith('index.html')) {
        window.location.href = 'home.html';
        return; // Added return to stop further execution if redirected
    }

    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Tab Switching Logic
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';

        // Reset animations
        loginForm.style.animation = 'none';
        setTimeout(() => loginForm.style.animation = '', 10);
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';

        // Reset animations
        registerForm.style.animation = 'none';
        setTimeout(() => registerForm.style.animation = '', 10);
    });

    // Handle Login API Request
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = e.target.querySelector('button');

        try {
            btn.textContent = 'Connexion en cours...';
            btn.disabled = true;

            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Sauvegarder le token JWT et les infos
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user)); // Redirection
                window.location.href = 'home.html';
            } else {
                alert(data.message || "Erreur de connexion.");
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert("Erreur de connexion au serveur.");
        } finally {
            btn.textContent = 'Se Connecter';
            btn.disabled = false;
        }
    });

    // Handle Register API Request
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const btn = e.target.querySelector('button');

        try {
            btn.textContent = 'Création en cours...';
            btn.disabled = true;

            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();

            if (res.ok) {
                tabLogin.click(); // Switch to login tab
            } else {
                alert(data.message || "Erreur lors de l'inscription.");
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert("Erreur de connexion au serveur.");
        } finally {
            btn.textContent = 'Créer mon compte';
            btn.disabled = false;
        }
    });
});
