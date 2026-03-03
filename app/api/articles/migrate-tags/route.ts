import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Article from "@/models/article";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MANAGER_PRIVILEGE_LEVEL } from "@/config/constants";

/**
 * One-time migration endpoint to:
 * 1. Move articles tagged "Популярні країни" → "Шпаргалки мандрівникам"
 * 2. Rename articles tagged "Послуги" → "Каталог Послуг"
 *
 * DELETE this route after running the migration.
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user?.privilegeLevel ?? 1) < MANAGER_PRIVILEGE_LEVEL) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // 1. Move "Популярні країни" → "Шпаргалки мандрівникам"
        const moveResult = await Article.updateMany(
            { tag: "Популярні країни" },
            { $set: { tag: "Шпаргалки мандрівникам" } }
        );

        // 2. Rename "Послуги" → "Каталог Послуг"
        const renameResult = await Article.updateMany(
            { tag: "Послуги" },
            { $set: { tag: "Каталог Послуг" } }
        );

        return NextResponse.json({
            success: true,
            moved: moveResult.modifiedCount,
            renamed: renameResult.modifiedCount,
            message: `Moved ${moveResult.modifiedCount} articles from "Популярні країни" → "Шпаргалки мандрівникам", renamed ${renameResult.modifiedCount} articles from "Послуги" → "Каталог Послуг"`,
        });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({ error: "Migration failed" }, { status: 500 });
    }
}
