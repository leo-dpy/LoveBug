require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lovebug',
    port: process.env.DB_PORT || 3306
};

async function migrate() {
    console.log("Démarrage de la migration de la base de données (Roulette Russe)...");
    try {
        const pool = mysql.createPool(dbConfig);

        // Add roulette_bullets
        try {
            await pool.execute('ALTER TABLE users ADD COLUMN roulette_bullets INT DEFAULT 1');
            console.log("Colonne 'roulette_bullets' ajoutée.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("La colonne 'roulette_bullets' existe déjà.");
            else throw e;
        }

        // Add roulette_lockout_until
        try {
            await pool.execute('ALTER TABLE users ADD COLUMN roulette_lockout_until TIMESTAMP NULL DEFAULT NULL');
            console.log("Colonne 'roulette_lockout_until' ajoutée.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log("La colonne 'roulette_lockout_until' existe déjà.");
            else throw e;
        }

        console.log("Migration terminée avec succès.");
        process.exit(0);
    } catch (err) {
        console.error("Erreur fatale lors de la migration :", err);
        process.exit(1);
    }
}

migrate();
