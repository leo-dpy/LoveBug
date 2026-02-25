const db = require('../config/db');

// Helper to get user balance
exports.getBalance = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.execute('SELECT tokens FROM users WHERE id = ?', [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.json({ tokens: rows[0].tokens });
    } catch (error) {
        console.error("Erreur gét balance:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Casino Roulette logic (0 to 36)
exports.spinWheel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { betAmount, betType, betValue } = req.body; // betType: 'color', betValue: 'red' | 'black' | 'green'

        if (!betAmount || betAmount <= 0) {
            return res.status(400).json({ message: "Mise invalide" });
        }

        if (betType !== 'color' || !['red', 'black', 'green'].includes(betValue)) {
            return res.status(400).json({ message: "Type de pari invalide" });
        }

        // Check if user has enough tokens
        const [rows] = await db.execute('SELECT tokens FROM users WHERE id = ?', [userId]);
        const currentTokens = rows[0].tokens;

        if (currentTokens < betAmount) {
            return res.status(400).json({ message: "Fonds insuffisants" });
        }

        // Draw a random number between 0 and 36
        const winningNumber = Math.floor(Math.random() * 37); // 0 to 36

        // Determine the color of the winning number
        const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        let winningColor = 'green'; // 0 is green
        if (winningNumber !== 0) {
            winningColor = redNumbers.includes(winningNumber) ? 'red' : 'black';
        }

        // Check win
        let winAmount = 0;
        let isWin = false;

        if (betValue === winningColor) {
            isWin = true;
            if (winningColor === 'green') {
                winAmount = betAmount * 36; // True life payout for single number hit (0)
            } else {
                winAmount = betAmount * 2; // True life payout for colors
            }
        }

        const newBalance = currentTokens - betAmount + winAmount;

        // Update database
        await db.execute('UPDATE users SET tokens = ? WHERE id = ?', [newBalance, userId]);

        res.json({
            winningNumber: winningNumber,
            winningColor: winningColor,
            isWin: isWin,
            winAmount: winAmount,
            newBalance: newBalance
        });

    } catch (error) {
        console.error("Erreur spinRoulette:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// --- Russian Roulette New Logic ---

exports.getRouletteState = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.execute(
            'SELECT roulette_bullets, roulette_lockout_until FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) return res.status(404).json({ message: "Utilisateur non trouvé" });

        const state = rows[0];
        const now = new Date();
        const lockoutDate = state.roulette_lockout_until ? new Date(state.roulette_lockout_until) : null;

        // If the lockout has expired, we reset the state automatically
        let bullets = state.roulette_bullets || 1;
        let isLocked = false;
        let lockoutRemainingMs = 0;

        if (lockoutDate && lockoutDate > now) {
            isLocked = true;
            lockoutRemainingMs = lockoutDate.getTime() - now.getTime();
        } else if (lockoutDate && lockoutDate <= now) {
            // Lockout done, reset bullets to 1 secretly
            bullets = 1;
            await db.execute('UPDATE users SET roulette_bullets = 1, roulette_lockout_until = NULL WHERE id = ?', [userId]);
        }

        res.json({
            bullets,
            chambers: 6,
            isLocked,
            lockoutRemainingMs
        });
    } catch (error) {
        console.error("Erreur gét roulette state:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.playRoulette = async (req, res) => {
    try {
        const userId = req.user.id;
        const { betAmount } = req.body;

        if (!betAmount || betAmount <= 0) {
            return res.status(400).json({ message: "Mise invalide" });
        }

        // Récupérer l'utilisateur courant, ses jetons, balles et statut lockout
        const [rows] = await db.execute(
            'SELECT tokens, roulette_bullets, roulette_lockout_until FROM users WHERE id = ?',
            [userId]
        );
        const user = rows[0];

        if (user.tokens < betAmount) {
            return res.status(400).json({ message: "Fonds insuffisants" });
        }

        // Vérification Lockout
        const now = new Date();
        const lockoutDate = user.roulette_lockout_until ? new Date(user.roulette_lockout_until) : null;
        if (lockoutDate && lockoutDate > now) {
            return res.status(403).json({ message: "Vous êtes mort. Vous devez attendre pour rejouer." });
        }

        // Nettoyage Lockout expiré ou Bullets
        let bullets = user.roulette_bullets || 1;
        if (lockoutDate && lockoutDate <= now) {
            bullets = 1; // It reset
        }

        const chambers = 6;
        if (bullets >= chambers) {
            return res.status(400).json({ message: "Tricheur... Le canon est plein !" });
        }

        // Multiplicateur : si 1/6 balle => 1.2x. Si 2/6 => 1.5x. Si 3/6 => 2x. Si 4/6 => 3x. Si 5/6 => 6x.
        const multiplier = chambers / (chambers - bullets);

        // Tirage
        const bulletFired = Math.random() < (bullets / chambers);

        let newBalance = user.tokens - betAmount;
        let winAmount = 0;

        if (!bulletFired) {
            // Survived !
            winAmount = Math.floor(betAmount * multiplier);
            newBalance += winAmount;

            // Increment danger
            await db.execute(
                'UPDATE users SET tokens = ?, roulette_bullets = roulette_bullets + 1, roulette_lockout_until = NULL WHERE id = ?',
                [newBalance, userId]
            );
        } else {
            // Died !
            await db.execute(
                'UPDATE users SET tokens = ?, roulette_bullets = 1, roulette_lockout_until = DATE_ADD(NOW(), INTERVAL 1 DAY) WHERE id = ?',
                [newBalance, userId]
            );
        }

        // Retrieve fresh state to send back
        const [freshRows] = await db.execute('SELECT roulette_bullets, roulette_lockout_until FROM users WHERE id = ?', [userId]);

        res.json({
            survived: !bulletFired,
            winAmount: winAmount,
            newBalance: newBalance,
            multiplier: parseFloat(multiplier.toFixed(2)),
            newState: {
                bullets: freshRows[0].roulette_bullets,
                chambers: chambers,
                isLocked: !(!bulletFired)
            }
        });

    } catch (error) {
        console.error("Erreur playRoulette:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
