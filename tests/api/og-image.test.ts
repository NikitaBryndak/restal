import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';

// The suite runs against mongodb-memory-server (see tests/setup.ts) — seed the demo trip here.
import OpengraphImage from '@/app/shared/trip/[token]/opengraph-image';
import { connectToDatabase } from '@/lib/mongodb';

const DEMO_TOKEN = 'NIKITA-REVIEW-DEMO';

async function seedDemoTrip() {
  await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error('no test DB connection');
  // Raw insert: the route only reads shareToken + display fields, no schema validation needed.
  await db.collection('trips').insertOne({
    number: 'TEST-REVIEW-DEMO',
    shareToken: DEMO_TOKEN,
    // "Греція" is in countriesAssociations → Greece.jpg exists, so the card renders WITH a
    // country-photo background (exercises the img + overlay branch of the layout).
    country: 'Греція',
    region: 'Санторіні',
    tripStartDate: '10/08/2026',
    tripEndDate: '17/08/2026',
  });
}

const call = (token: string) =>
  OpengraphImage({ params: Promise.resolve({ token }) });

describe('GET /shared/trip/[token]/opengraph-image', () => {
  it('renders a per-trip PNG card for a known share token', async () => {
    await seedDemoTrip();

    const res = await call(DEMO_TOKEN);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/png');

    const demoBuf = Buffer.from(await res.arrayBuffer());
    // A real rendered 1200x630 card is tens of KB — guards against an empty/stub response.
    expect(demoBuf.length).toBeGreaterThan(10_000);

    // The generic fallback must render DIFFERENTLY — proves the trip branch (destination,
    // dates, tour number) was actually exercised, not just a silent DB-lookup failure.
    const genericRes = await call('DOES-NOT-EXIST-000000');
    const genericBuf = Buffer.from(await genericRes.arrayBuffer());
    expect(demoBuf.equals(genericBuf)).toBe(false);
  }, 60_000);

  it('renders a generic branded PNG for unknown tokens (no 404, no crash)', async () => {
    const res = await call('DOES-NOT-EXIST-000000');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/png');

    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.length).toBeGreaterThan(10_000);
  }, 60_000);
});
