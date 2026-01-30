import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string || "misc";

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
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
        throw new Error("GCP_BUCKET_NAME is not defined");
    }

    // console.log(`Uploading file ${file.name} to bucket ${bucketName}`);

    const bucket = storage.bucket(bucketName);

    // Create a buffer from the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename
    const timestamp = Date.now();
    // Sanitize filename to remove special chars
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const destination = `${folder}/${timestamp}-${sanitizedFilename}`;

    const blob = bucket.file(destination);

    await blob.save(buffer, {
        contentType: file.type,
        resumable: false // suitable for smaller files like documents
    });

    // Instead of relying on public access (which fails if bucket is private),
    // we return a proxy URL that routes through our API to check authentication.
    const publicUrl = `/api/documents/view?file=${encodeURIComponent(destination)}`;

    return NextResponse.json({
        url: publicUrl,
        filename: destination
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: "Upload failed", error: error.message },
      { status: 500 }
    );
  }
}
