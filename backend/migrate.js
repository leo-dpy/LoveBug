const db = require('./config/db');

async function migrate() {
    try {
        console.log("Migration des colonnes dans la table 'users'...");

        // Ajouter la colonne tokens si elle n'existe pas
        try {
            await db.execute('ALTER TABLE users ADD COLUMN tokens INT DEFAULT 100');
            console.log("Colonne 'tokens' ajoutée avec succès.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("La colonne 'tokens' existe déjà.");
            } else {
                throw e;
            }
        }

        // Ajouter la colonne friend_id
        try {
            await db.execute('ALTER TABLE users ADD COLUMN friend_id VARCHAR(20) UNIQUE');
            console.log("Colonne 'friend_id' ajoutée avec succès.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("La colonne 'friend_id' existe déjà.");
            } else {
                throw e;
            }
        }

        console.log("Migration terminée avec succès !");
        process.exit(0);
    } catch (e) {
        console.error("Erreur durant la migration : ", e);
        process.exit(1);
    }
}

migrate();
