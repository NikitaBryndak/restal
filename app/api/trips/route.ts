import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import crypto from 'crypto';

export async function GET(request: Request) {
    try {
        const session = (await getServerSession(authOptions as any)) as any;

        if (!session?.user?.email) {
            return NextResponse.json({ message: "Not authenticated", trips: [] }, { status: 401 });
        }

        await connectToDatabase();

        const trips = await Trip.find({ ownerEmail: session.user.email }).sort({ createdAt: -1 }).lean();

        return NextResponse.json({ trips }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching trips:", error);
        return NextResponse.json({ message: "Error fetching trips", error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = (await getServerSession(authOptions as any)) as any;

        if (!session?.user?.email) {
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json();

        await connectToDatabase();

        // Build base content string from trip info to derive deterministic number
        const ownerEmail = session.user.email;

        const makeContentString = (payload: any, salt: string | number = '') => {
            // Select deterministic fields to describe a trip
            const parts = [
                payload.country || '',
                payload.tripStartDate || '',
                payload.tripEndDate || '',
                (payload.flightInfo?.departure?.flightNumber) || '',
                (payload.flightInfo?.arrival?.flightNumber) || '',
                payload.hotel?.name || payload.hotelName || ''
            ];
            if (salt) parts.push(String(salt));
            return parts.join('|');
        };

        const hashToNumber = (str: string) => {
            // Use SHA256, take first 8 bytes -> 16 hex chars => 64-bit-ish number, then mod a large range
            const hash = crypto.createHash('sha256').update(str).digest('hex');
            const prefix = hash.slice(0, 15); // 60 bits
            // Convert hex prefix to integer (may exceed JS safe int for 60 bits, so use BigInt)
            const num = BigInt('0x' + prefix);
            // Map into a smaller positive integer range, e.g., 1..99999999
            const mapped = Number(num % BigInt(100_000_000)) + 1;
            return mapped;
        };

        // Attempt to compute a deterministic number and insert, retrying with salt if collision occurs
        const basePayload = { ...body };
        let created: any = null;
        const maxAttempts = 6;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const salt = attempt === 0 ? '' : attempt; // 1,2,3...
            const content = makeContentString(basePayload, salt);
            const computedNumber = hashToNumber(content);

            const toCreate = {
                ...basePayload,
                number: computedNumber,
                ownerEmail
            };

            try {
                created = await Trip.create(toCreate);
                break;
            } catch (err: any) {
                const isDupKey = err && (err.code === 11000 || err.code === '11000' || (err.name === 'MongoServerError' && err.code === 11000));
                if (isDupKey) {
                    // collision - try next salt
                    continue;
                }
                throw err;
            }
        }

        if (!created) {
            return NextResponse.json({ message: 'Failed to create trip after multiple attempts' }, { status: 500 });
        }

        return NextResponse.json({ trip: created }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating trip:", error);
        return NextResponse.json({ message: "Error creating trip", error: error.message }, { status: 500 });
    }
}
