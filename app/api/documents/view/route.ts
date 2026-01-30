import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Prevent this route from being cached statically
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get('file');

        if (!filePath) {
            return NextResponse.json({ message: "File path required" }, { status: 400 });
        }

         // Initialize Google Cloud Storage
        const storage = new Storage({
            projectId: process.env.GCP_PROJECT_ID,
            credentials: {
                client_email: process.env.GCP_CLIENT_EMAIL,
                private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
        });

        const bucketName = process.env.GCP_BUCKET_NAME;
        if (!bucketName) {
             console.error("GCP_BUCKET_NAME not defined");
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
        const fileName = metadata.name?.split('/').pop() || 'document';

        // Download file contents into memory (buffers are acceptable for typical documents)
        const [buffer] = await file.download();

        // Return as a proper response
        return new NextResponse(buffer as any, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${fileName}"`,
                'Cache-Control': 'private, max-age=3600'
            }
        });

    } catch (error: any) {
        console.error("View document error:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}
