function switchGame(gameId) {
    // Masquer tous les jeux
    document.querySelectorAll('.game-section').forEach(section => {
        section.classList.add('hidden-game');
    });

    // Désélectionner les onglets
    document.querySelectorAll('.casino-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Afficher le bon jeu et activer l'onglet correspondant
    document.getElementById(`section-${gameId}`).classList.remove('hidden-game');
    document.getElementById(`btn-tab-${gameId}`).classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    // Éléments
    const balanceDisplay = document.getElementById('user-balance');

    // Roulette Casino Elements
    const wheelBetInput = document.getElementById('wheel-bet');
    const spinBtn = document.getElementById('spin-btn');
    const wheelElement = document.getElementById('wheel-element');
    const wheelResult = document.getElementById('wheel-result');

    const colorBetRadios = document.querySelectorAll('input[name="bet-color"]');
    let currentRotation = 0;

    // Visual Roulette sequence (8 large slices: 1 Green, 4 Red, 3 Black)
    const visualSequence = [
        { type: 'green' },
        { type: 'red' },
        { type: 'black' },
        { type: 'red' },
        { type: 'black' },
        { type: 'red' },
        { type: 'black' },
        { type: 'red' }
    ];

    // Build the wheel slices
    function buildRouletteWheel() {
        wheelElement.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const item = visualSequence[i];
            let colorClass = 'bg-black';
            if (item.type === 'green') colorClass = 'bg-green';
            else if (item.type === 'red') colorClass = 'bg-red';

            const slice = document.createElement('div');
            slice.className = `slice ${colorClass}`;
            slice.style.setProperty('--i', i);
            // No text label inside
            wheelElement.appendChild(slice);
        }
    }
    buildRouletteWheel();

    // Roulette
    const rouletteBetInput = document.getElementById('roulette-bet');
    const triggerBtn = document.getElementById('trigger-btn');
    const cylinderElement = document.getElementById('cylinder-element');
    const rouletteResult = document.getElementById('roulette-result');
    const flashOverlay = document.getElementById('flash-overlay');

    let rouletteRotation = 0;

    // Generate chambers
    function buildCylinder(chambersCount) {
        cylinderElement.innerHTML = '';
        const radius = 60; // Distance from center
        for (let i = 0; i < chambersCount; i++) {
            const angle = (i * (360 / chambersCount)) * (Math.PI / 180);
            const x = Math.round(Math.cos(angle) * radius);
            const y = Math.round(Math.sin(angle) * radius);

            const chamber = document.createElement('div');
            chamber.className = 'chamber';
            chamber.style.transform = `translate(${x}px, ${y}px)`;
            chamber.id = `chamber-${i}`;
            cylinderElement.appendChild(chamber);
        }
    }

    // Default 6 chambers
    buildCylinder(6);

    // Token
    const token = localStorage.getItem('token');

    // Auth Check
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // --- Fonctions globales ---
    async function fetchBalance() {
        try {
            const response = await fetch('/api/casino/balance', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                balanceDisplay.textContent = data.tokens;
            } else {
                console.error("Erreur gét balance:", data.message);
                if (response.status === 401) {
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            console.error("Erreur réseau:", error);
        }
    }

    async function fetchRouletteState() {
        try {
            const response = await fetch('/api/casino/roulette-state', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                updateRouletteUI(data.bullets, data.chambers, data.isLocked, data.lockoutRemainingMs);
                if (data.chambers && data.chambers !== 6) {
                    buildCylinder(data.chambers);
                }
            }
        } catch (error) {
            console.error("Erreur gét roulette state:", error);
        }
    }

    // Interval reference for lockout
    let lockoutInterval = null;

    function updateRouletteUI(bullets, chambers, isLocked, remainingMs) {
        const descEl = document.getElementById('roulette-desc');

        // Clear loaded bullets visually
        document.querySelectorAll('.chamber').forEach(c => {
            c.classList.remove('has-bullet', 'show-bullet');
        });

        if (lockoutInterval) {
            clearInterval(lockoutInterval);
            lockoutInterval = null;
        }

        if (isLocked) {
            triggerBtn.disabled = true;
            triggerBtn.style.opacity = '0.5';
            triggerBtn.textContent = 'Arme enrayée (Vous êtes mort)';

            // Start countdown
            let timeLeff = remainingMs;

            const updateTimer = () => {
                if (timeLeff <= 0) {
                    clearInterval(lockoutInterval);
                    fetchRouletteState(); // Refresh state
                    return;
                }
                const hours = Math.floor(timeLeff / (1000 * 60 * 60));
                const mins = Math.floor((timeLeff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((timeLeff % (1000 * 60)) / 1000);
                descEl.innerHTML = `<span style="color:#f44336; font-weight:bold;">Vous êtes mort. L'arme sera de nouveau disponible dans ${hours}h ${mins}m ${secs}s.</span>`;
                timeLeff -= 1000;
            };

            updateTimer();
            lockoutInterval = setInterval(updateTimer, 1000);

        } else {
            triggerBtn.disabled = false;
            triggerBtn.style.opacity = '1';
            triggerBtn.textContent = 'Presser la Détente';

            const chance = ((chambers - bullets) / chambers * 100).toFixed(1);
            const multiplier = (chambers / (chambers - bullets)).toFixed(2);
            descEl.innerHTML = `Un barillet, ${chambers} chambres, <span style="color:var(--primary-color); font-weight:bold;">${bullets} Balle(s)</span>.<br>Chance de survie : ${chance}%. Gain : ${multiplier}x la mise.`;
        }
    }

    // Charger le solde initial et state initial
    fetchBalance();
    fetchRouletteState();

    // --- Casino Roulette ---
    spinBtn.addEventListener('click', async () => {
        const betAmount = parseInt(wheelBetInput.value);
        if (isNaN(betAmount) || betAmount <= 0) {
            alert("Veuillez entrer une mise valide.");
            return;
        }

        const selectedBetValue = document.querySelector('input[name="bet-color"]:checked').value; // 'red', 'black', 'green'

        // Désactiver le bouton
        spinBtn.disabled = true;
        spinBtn.style.opacity = '0.5';
        const originalBtnText = spinBtn.textContent;
        spinBtn.textContent = 'Lancement...';
        wheelResult.textContent = "";

        try {
            const response = await fetch('/api/casino/spin-wheel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ betAmount, betType: 'color', betValue: selectedBetValue })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Une erreur est survenue");
                spinBtn.disabled = false;
                spinBtn.style.opacity = '1';
                return;
            }

            // --- Animation de la roulette ---
            // On cherche un index visuel qui correspond à la couleur gagnante
            let availableIndexes = [];
            visualSequence.forEach((item, index) => {
                if (item.type === data.winningColor) {
                    availableIndexes.push(index);
                }
            });
            // Choisir une case au hasard parmi celles de la bonne couleur
            const winningIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
            const sliceAngle = 360 / 8; // 8 slices this time

            // La slice 'winningIndex' est générée centrée en haut.
            // L'angle pour l'amener en haut est juste l'inverse de sa position visuelle = 360 - (winningIndex * sliceAngle)
            const targetAngle = 360 - (winningIndex * sliceAngle);

            // 10 tours supplémentaires
            const extraSpins = 10 * 360;

            // Calculer la rotation finale
            const remainder = currentRotation % 360;
            const toAdd = targetAngle - remainder;

            const finalRotation = currentRotation + toAdd + extraSpins + (toAdd <= 0 ? 360 : 0);

            spinBtn.textContent = 'En cours...';
            wheelElement.style.transform = `rotate(${finalRotation}deg)`;

            // Attendre 7 secondes, durée de l'animation CSS
            setTimeout(() => {
                currentRotation = finalRotation;
                balanceDisplay.textContent = data.newBalance;

                if (data.isWin) {
                    wheelResult.innerHTML = `<span class="win-text">+${data.winAmount} jetons !</span>`;
                } else {
                    wheelResult.innerHTML = ``; // Pas de texte si on perd, la roue parle d'elle-même
                }

                spinBtn.disabled = false;
                spinBtn.style.opacity = '1';
                spinBtn.textContent = originalBtnText;
            }, 7000);

        } catch (error) {
            console.error("Erreur Wheel:", error);
            alert("Erreur de connexion serveur.");
            spinBtn.disabled = false;
            spinBtn.style.opacity = '1';
            spinBtn.textContent = originalBtnText;
        }
    });

    // --- Russian Roulette ---
    triggerBtn.addEventListener('click', async () => {
        const betAmount = parseInt(rouletteBetInput.value);
        if (isNaN(betAmount) || betAmount <= 0) {
            alert("Veuillez entrer une mise valide.");
            return;
        }

        // Désactiver le bouton
        triggerBtn.disabled = true;
        triggerBtn.style.opacity = '0.5';
        rouletteResult.textContent = "";

        // Spin cylinder fast before shot
        rouletteRotation += (360 * 3) + Math.floor(Math.random() * 360);
        cylinderElement.style.transition = 'transform 2s cubic-bezier(0.1, 0.7, 0.1, 1)';
        cylinderElement.style.transform = `rotate(${rouletteRotation}deg)`;

        try {
            const response = await fetch('/api/casino/russian-roulette', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ betAmount }) // We no longer send chamberCount/bulletCount, server handles state
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Une erreur est survenue");
                triggerBtn.disabled = false;
                triggerBtn.style.opacity = '1';
                return;
            }

            // Wait for cylinder to finish spinning before firing
            setTimeout(() => {
                // Apply slight recoil animation
                cylinderElement.style.setProperty('--current-rot', `${rouletteRotation}deg`);
                cylinderElement.classList.add('firing');

                // Which chamber are we looking at? The top one.
                // It's mostly visual smoke and mirrors, we just use chamber-0
                const activeChamber = document.getElementById('chamber-0');

                setTimeout(() => cylinderElement.classList.remove('firing'), 100);

                if (!data.survived) {
                    // Pan!
                    if (flashOverlay) {
                        flashOverlay.classList.remove('active');
                        void flashOverlay.offsetWidth; // trigger reflow
                        flashOverlay.classList.add('active');
                    }

                    if (activeChamber) {
                        activeChamber.classList.add('has-bullet', 'show-bullet');
                    }

                    rouletteResult.innerHTML = `<span class="lose-text"><i class="fa-solid fa-skull"></i> BANG ! Vous êtes mort... Vous perdez ${betAmount} jetons.</span>`;
                } else {
                    // Clic!
                    rouletteResult.innerHTML = `<span class="win-text"><i class="fa-solid fa-shield-halved"></i> CLIC ! Vous survivez et gagnez ${data.winAmount} jetons (${data.multiplier}x) !</span>`;
                }

                balanceDisplay.textContent = data.newBalance;

                // Mettre à jour l'UI avec le nouvel état et réactiver
                setTimeout(() => {
                    updateRouletteUI(data.newState.bullets, data.newState.chambers, data.newState.isLocked, 24 * 60 * 60 * 1000); // Send 24h ms approximate, will resync on refresh
                }, 2000);
            }, 2000); // Wait 2s for cylinder spin

        } catch (error) {
            console.error("Erreur Roulette:", error);
            alert("Erreur de connexion serveur.");
            triggerBtn.disabled = false;
            triggerBtn.style.opacity = '1';
        }
    });
});
