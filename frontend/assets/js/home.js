document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userStr);

    // Update welcome message
    const welcomeSpan = document.querySelector('#welcome-message span');
    if (welcomeSpan) {
        welcomeSpan.textContent = user.username;
    }
});
