import type { NextRequest } from "next/server";

export interface UtmData {
    source?: string;
    medium?: string;
    campaign?: string;
}

const UTM_PARAMS = ["source", "medium", "campaign"] as const;
const MAX_UTM_VALUE_LENGTH = 100;

function cleanValue(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim().slice(0, MAX_UTM_VALUE_LENGTH);
    return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Captures UTM attribution for a request.
 * Primary source: query string on the request URL (utm_source/utm_medium/utm_campaign).
 * Fallback: same-named fields in the JSON body (for clients that forward them explicitly).
 * Returns only non-empty values — an empty object means "no attribution".
 */
export function extractUtm(request: NextRequest, body?: Record<string, unknown>): UtmData {
    const params = request.nextUrl.searchParams;
    const utm: UtmData = {};

    for (const key of UTM_PARAMS) {
        const value = cleanValue(params.get(`utm_${key}`)) ?? cleanValue(body?.[`utm_${key}`]);
        if (value !== undefined) {
            utm[key] = value;
        }
    }

    return utm;
}
