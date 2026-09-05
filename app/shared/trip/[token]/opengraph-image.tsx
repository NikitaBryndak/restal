import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "@/lib/mongodb";
import TripModel from "@/models/trip";
import { getCountryImageName } from "@/data";

export const size = { width: 1200, height: 630 };
// Static Inter TTFs (wght 400/700), subsetted to ASCII + Cyrillic — the bundled @vercel/og font parser
// only accepts static TTF/OTF buffers (WOFF2 and variable fonts are rejected). Rebuild via scripts/build-og-fonts.py.
const fontRegular = fs.readFileSync(path.join(process.cwd(), "public/fonts/Inter-Regular.ttf"));
const fontBold = fs.readFileSync(path.join(process.cwd(), "public/fonts/Inter-Bold.ttf"));

const FONTS: { name: string; data: Buffer; weight: 400 | 700 }[] = [
    { name: "Inter", data: fontRegular, weight: 400 },
    { name: "Inter", data: fontBold, weight: 700 },
];

const FONT_STACK = "'Inter'";
function countryImageDataUrl(country: string): string | null {
    try {
        const name = getCountryImageName(country);
        for (const ext of ["jpg", "webp"]) {
            const file = path.join(process.cwd(), "public/countryImages", `${name}.${ext}`);
            if (fs.existsSync(file)) {
                const mime = ext === "jpg" ? "image/jpeg" : "image/webp";
                return `data:${mime};base64,${fs.readFileSync(file).toString("base64")}`;
            }
        }
    } catch {
        // fall through to the plain dark background
    }
    return null;
}

/**
 * Per-trip Open Graph image (1200x630) for /shared/trip/[token].
 * Rendered on demand — no storage. Unknown/invalid token → generic branded card.
 */
export default async function OpengraphImage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let trip: any = null;
    try {
        if (token && token.length >= 16) {
            await connectToDatabase();
            trip = await TripModel.findOne({ shareToken: token }).lean();
        }
    } catch {
        // unknown/invalid token → generic card below
    }

    const bg = trip?.country ? countryImageDataUrl(trip.country) : null;

    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", background: "#0a0a0a", fontFamily: FONT_STACK, color: "#ffffff" }}>
                {/* satori drops absolutely-positioned children inside React.Fragment — img/overlay must be direct root children */}
                {bg && <img src={bg} alt="" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                {bg && <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(5,8,16,0.7)" }} />}
                {/* Brand row */}
                <div style={{ position: "absolute", top: 48, left: 72, right: 72, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: 2 }}>RestAL</div>
                    <div style={{ fontSize: 30, color: "rgba(255,255,255,0.65)" }}>restal.in.ua</div>
                </div>
                {trip ? (
                    <>
                        {/* Absolute sections — satori's flex-column stacking is unreliable for tall mixed blocks */}
                        <div style={{ position: "absolute", top: 240, left: 72, fontSize: 84, fontWeight: 700 }}>{`Подорож до ${trip.country}`}</div>
                        {!!trip.region && (
                            <div style={{ position: "absolute", top: 356, left: 72, fontSize: 44, color: "rgba(255,255,255,0.8)" }}>{trip.region}</div>
                        )}
                        <div style={{ position: "absolute", top: 440, left: 72, display: "flex", gap: 72 }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ fontSize: 26, color: "rgba(255,255,255,0.55)" }}>ПОЧАТОК</div>
                                <div style={{ marginTop: 8, fontSize: 40, fontWeight: 700 }}>{trip.tripStartDate}</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <div style={{ fontSize: 26, color: "rgba(255,255,255,0.55)" }}>КІНЕЦЬ</div>
                                <div style={{ marginTop: 8, fontSize: 40, fontWeight: 700 }}>{trip.tripEndDate}</div>
                            </div>
                        </div>
                        <div style={{ position: "absolute", top: 556, left: 72, fontSize: 30, color: "rgba(255,255,255,0.6)" }}>
                            {`Тур #${trip.number}${trip.hotel?.name ? ` · ${trip.hotel.name}` : ""}`}
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ position: "absolute", top: 240, left: 72, fontSize: 84, fontWeight: 700 }}>RestAL</div>
                        <div style={{ position: "absolute", top: 356, left: 72, fontSize: 40, color: "rgba(255,255,255,0.7)" }}>Подорожі, організовані RestAL</div>
                    </>
                )}
            </div>
        ),
        { ...size, fonts: FONTS }
    );
}
