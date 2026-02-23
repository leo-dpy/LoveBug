document.addEventListener('DOMContentLoaded', () => {
    // Only connect if user is authenticated (token exists)
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) return;
    const user = JSON.parse(userStr);

    // Initialiser Socket global s'il n'existe pas
    if (!window.socket) {
        window.socket = io('http://localhost:3000');
        window.socket.emit('register_user', user.id);
    }

    // Configurer le container des notifications (Toast)
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        Object.assign(toastContainer.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        });
        document.body.appendChild(toastContainer);
    }

    // Fonction globale pour afficher un Toast
    window.showToast = function (title, message, iconType = 'info') {
        const toast = document.createElement('div');
        toast.className = 'glass-toast';
        toast.style.cssText = `
            background: rgba(255, 51, 102, 0.9);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 15px;
            min-width: 250px;
            animation: slideInRight 0.3s ease-out forwards;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        let iconHtml = '<i class="fa-solid fa-bell"></i>';
        if (iconType === 'match') iconHtml = '<i class="fa-solid fa-heart" style="color: #fff;"></i>';
        if (iconType === 'friend') iconHtml = '<i class="fa-solid fa-user-plus" style="color: #fff;"></i>';
        if (iconType === 'message') iconHtml = '<i class="fa-solid fa-comment" style="color: #fff;"></i>';

        toast.innerHTML = `
            <div style="font-size: 1.5rem;">${iconHtml}</div>
            <div>
                <strong style="display: block; font-size: 1.1rem; margin-bottom: 2px;">${title}</strong>
                <span style="font-size: 0.9rem;">${message}</span>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOutRight 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    };

    // Add keyframes for toast (only once)
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.innerHTML = `
            @keyframes slideInRight {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(120%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Gestion Events Socket
    window.socket.on('new_match', (data) => {
        window.showToast("Nouveau Match !", data.message, 'match');
        // Vibrate if supported
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    });

    window.socket.on('new_friend_request', (data) => {
        window.showToast("Demande d'ami", data.message, 'friend');
        if (navigator.vibrate) navigator.vibrate(200);
    });

    window.socket.on('new_message_notification', (data) => {
        // Bloquer la notif si on est sur la page de chat (le chat gère sa propre UI)
        if (!window.location.pathname.includes('chat.html')) {
            window.showToast("Nouveau Message", data.message, 'message');
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
    });
});
