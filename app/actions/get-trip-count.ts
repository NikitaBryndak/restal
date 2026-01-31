"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";

export async function getTripCount() {
  try {
    await connectToDatabase();
    return await Trip.countDocuments({});
  } catch {
    return 0;
  }
}
