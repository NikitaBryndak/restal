import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Start an isolated in-memory MongoDB BEFORE app modules are evaluated:
// lib/mongodb.ts captures process.env.MONGODB_URI at import time.
const mongod = await MongoMemoryServer.create();
const testUri = mongod.getUri('restal_test');
process.env.MONGODB_URI = testUri;
process.env.NEXTAUTH_SECRET ??= 'test-secret';

beforeAll(async () => {
  await mongoose.connect(testUri);
}, 120_000);

// Isolate tests: wipe every collection after each test.
afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  await Promise.all(collections.map((c) => db.collection(c.name).deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
