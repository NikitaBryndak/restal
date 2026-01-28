"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Trip from "@/models/trip";

export async function getTripCount() {
  try {
    await connectToDatabase();
    const count = await Trip.countDocuments({});
    console.log("Trip count calculated:", count);
    return count;
  } catch (error) {
    console.error("Failed to fetch trip count:", error);
    return 0;
  }
}
