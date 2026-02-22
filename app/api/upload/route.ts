import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// SECURITY: Allowed file types for upload
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.doc', '.docx'];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.phoneNumber) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string || "misc";
    const tripNumber = formData.get("tripNumber") as string || "";

    // SECURITY: Validate folder against an allowlist to prevent path traversal in GCS
    const ALLOWED_FOLDERS = ['documents', 'articles', 'misc'];
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { message: "Invalid upload folder" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    // SECURITY: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "File too large. Maximum size is 10MB" }, { status: 400 });
    }

    // SECURITY: Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({
        message: "Invalid file type. Allowed: PDF, JPG, PNG, WEBP, GIF, DOC, DOCX"
      }, { status: 400 });
    }

    // SECURITY: Validate file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json({
        message: "Invalid file extension"
      }, { status: 400 });
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

    const bucket = storage.bucket(bucketName);

    // Create a buffer from the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename with trip number for access control
    const timestamp = Date.now();
    // Sanitize filename to remove special chars
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    // Include trip number in filename for access control verification
    const tripPrefix = tripNumber ? `${tripNumber}_` : '';
    const destination = `${folder}/${timestamp}-${tripPrefix}${sanitizedFilename}`;

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

  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
