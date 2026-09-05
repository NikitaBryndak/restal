/**
 * One-off migration: privilege levels -> dynamic roles.
 *
 * 1. Seeds the four system roles (client/editor/manager/admin) from
 *    SYSTEM_ROLE_SEEDS if they don't exist yet.
 * 2. Maps every user's legacy `privilegeLevel` to a role slug and writes it
 *    to `user.role`. Users without a level default to "client".
 * 3. Prints a summary. Safe to re-run (idempotent): existing roles are left
 *    untouched, users that already have a valid role slug keep it.
 *
 * Usage: MONGODB_URI="mongodb+srv://.../dev_restal" node scripts/migrate-roles.mjs
 */
import mongoose from "mongoose";

const SEEDS = {
    client: { name: "Клієнт", groups: ["client"] },
    editor: { name: "Редактор", groups: ["client", "articles"] },
    manager: { name: "Менеджер", groups: ["client", "tours"] },
    admin: { name: "Адмін", groups: ["client", "articles", "tours", "admin"] },
};

// privilegeLevel (1..4) -> role slug; unknown levels fall back to client.
const LEVEL_TO_ROLE = { 1: "client", 2: "editor", 3: "manager", 4: "admin" };

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI env var is required");
        process.exit(1);
    }

    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const rolesCol = db.collection("roles");
    const usersCol = db.collection("users");

    // 1. Seed system roles (upsert by slug, never overwrite existing docs).
    for (const [slug, seed] of Object.entries(SEEDS)) {
        await rolesCol.updateOne(
            { slug },
            { $setOnInsert: { slug, name: seed.name, isSystem: true, groups: seed.groups, pageOverrides: {}, description: "" } },
            { upsert: true }
        );
    }
    console.log("System roles seeded:", (await rolesCol.find({ isSystem: true }).toArray()).map((r) => r.slug).join(", "));

    // 2. Map users by legacy privilegeLevel.
    const existingSlugs = new Set((await rolesCol.find({}, { slug: 1 }).toArray()).map((r) => r.slug));
    let migrated = 0;
    let skipped = 0;
    for (const level of Object.keys(LEVEL_TO_ROLE).map(Number)) {
        const res = await usersCol.updateMany(
            { privilegeLevel: level, role: { $exists: false } },
            { $set: { role: LEVEL_TO_ROLE[level] } }
        );
        migrated += res.modifiedCount;
    }
    // Users with no level at all -> client.
    const noLevel = await usersCol.updateMany(
        { privilegeLevel: { $exists: false }, role: { $exists: false } },
        { $set: { role: "client" } }
    );
    migrated += noLevel.modifiedCount;

    // Users whose role is not a known slug (shouldn't happen) -> client.
    const invalid = await usersCol.updateMany(
        { role: { $nin: [...existingSlugs] } },
        { $set: { role: "client" } }
    );
    migrated += invalid.modifiedCount;

    // 3. Summary.
    const totalUsers = await usersCol.countDocuments();
    const byRole = {};
    for (const doc of await usersCol.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]).toArray()) {
        byRole[doc._id ?? "client"] = doc.count;
    }
    console.log(`Users migrated: ${migrated}, total users: ${totalUsers}`);
    console.log("By role:", JSON.stringify(byRole));
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
