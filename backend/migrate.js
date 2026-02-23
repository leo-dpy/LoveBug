const db = require('./config/db');

async function migrate() {
    try {
        console.log("🚀 Lancement de la migration...");

        try {
            await db.execute("ALTER TABLE users ADD COLUMN last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
            console.log("✅ Colonne last_login ajoutée à users");
        } catch (e) {
            console.log("⚠️ last_login existe peut-être déjà :", e.message);
        }

        try {
            await db.execute("ALTER TABLE messages ADD COLUMN is_saved BOOLEAN DEFAULT FALSE");
            console.log("✅ Colonne is_saved ajoutée à messages");
        } catch (e) {
            console.log("⚠️ is_saved existe peut-être déjà :", e.message);
        }

        console.log("🎉 Migration terminée");
        process.exit(0);
    } catch (error) {
        console.error("❌ Erreur globale:", error);
        process.exit(1);
    }
}

migrate();
