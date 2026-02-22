import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import { SUPER_ADMIN_PRIVILEGE_LEVEL } from "@/config/constants";

export const dynamic = 'force-dynamic';

// Helper to extract trip number from file path (format: documents/{timestamp}-{tripNumber}_...)
function extractTripNumberFromPath(filePath: string): string | null {
    // File paths look like: documents/1234567890-5468189_contract.pdf
    const match = filePath.match(/documents\/\d+-(\d+)_/);
    return match ? match[1] : null;
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.phoneNumber) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get('file');

        if (!filePath) {
            return NextResponse.json({ message: "File path required" }, { status: 400 });
        }

        // SECURITY: Prevent path traversal attacks
        if (filePath.includes('..') || filePath.startsWith('/') || filePath.includes('\\')) {
            return NextResponse.json({ message: "Invalid file path" }, { status: 400 });
        }

        // SECURITY: Only allow access to known folder prefixes
        const ALLOWED_PREFIXES = ['documents/', 'articles/'];
        const hasAllowedPrefix = ALLOWED_PREFIXES.some(prefix => filePath.startsWith(prefix));
        if (!hasAllowedPrefix) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // SECURITY: Verify user has access to this document
        // Documents are stored in 'documents/' folder with trip number in filename
        if (filePath.startsWith('documents/')) {
            await connectToDatabase();

            const tripNumber = extractTripNumberFromPath(filePath);
            if (!tripNumber) {
                // SECURITY: If we can't determine the trip number, deny access
                return NextResponse.json({ message: "Forbidden" }, { status: 403 });
            }

            const trip = await Trip.findOne({ number: tripNumber }).lean() as any;

                if (!trip) {
                    return NextResponse.json({ message: "Document not found" }, { status: 404 });
                }

                const userPhone = session.user.phoneNumber;
                const userPrivilegeLevel = session.user.privilegeLevel ?? 1;
                const isSuperAdmin = userPrivilegeLevel >= SUPER_ADMIN_PRIVILEGE_LEVEL;
                const isOwnerOrManager = trip.ownerPhone === userPhone || trip.managerPhone === userPhone;

                // Only allow access if user is owner, manager, or super admin
                if (!isSuperAdmin && !isOwnerOrManager) {
                    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
                }
        }

        // SECURITY: Articles require at least manager-level access (privilegeLevel >= 2)
        if (filePath.startsWith('articles/')) {
            const userPrivilegeLevel = session.user.privilegeLevel ?? 1;
            if (userPrivilegeLevel < 2) {
                return NextResponse.json({ message: "Forbidden" }, { status: 403 });
            }
        }

        const storage = new Storage({
            projectId: process.env.GCP_PROJECT_ID,
            credentials: {
                client_email: process.env.GCP_CLIENT_EMAIL,
                private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
        });

        const bucketName = process.env.GCP_BUCKET_NAME;
        if (!bucketName) {
             return NextResponse.json({ message: "Configuration error" }, { status: 500 });
        }

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(filePath);

        const [exists] = await file.exists();
        if (!exists) {
            return NextResponse.json({ message: "File not found" }, { status: 404 });
        }

        const [metadata] = await file.getMetadata();
        const contentType = metadata.contentType || 'application/octet-stream';
        // SECURITY: Sanitize filename to prevent header injection
        const rawFileName = metadata.name?.split('/').pop() || 'document';
        const fileName = rawFileName.replace(/[^\w.-]/g, '_');

        const [buffer] = await file.download();

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${fileName}"`,
                'Cache-Control': 'private, no-store',
                'X-Content-Type-Options': 'nosniff',
            }
        });

    } catch (error) {
        console.error("Document view error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
