import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

describe('connectToDatabase', () => {
  it('returns a connected mongoose instance', async () => {
    const conn = await connectToDatabase();
    expect(conn).toBe(mongoose);
    expect(mongoose.connection.readyState).toBe(1); // CONNECTED
  });

  it('is idempotent — repeated calls return the cached connection without reconnecting', async () => {
    const first = await connectToDatabase();
    const second = await connectToDatabase();
    expect(second).toBe(first);
  });

  it('resets its promise and rethrows when the underlying connection fails', async () => {
    // The cache lives on globalThis.mongooseCache (see lib/mongodb.ts) — manipulate it directly.
    const g = globalThis as unknown as { mongooseCache: { conn: unknown; promise: Promise<unknown> | null } };
    const original = { ...g.mongooseCache };
    try {
      g.mongooseCache.conn = null;
      g.mongooseCache.promise = Promise.reject(new Error('boom'));
      await expect(connectToDatabase()).rejects.toThrow('boom');
      // After failure the promise must be cleared so a later call can retry.
      expect(g.mongooseCache.promise).toBeNull();
    } finally {
      g.mongooseCache.conn = original.conn;
      g.mongooseCache.promise = original.promise;
    }
  });
});
