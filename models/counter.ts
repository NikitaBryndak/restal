import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

// DEVELOPMENT: Delete cached model on hot-reload to prevent "Cannot overwrite model" errors
if (process.env.NODE_ENV === "development") {
    if (mongoose.models.Counter) delete mongoose.models.Counter;
}

export default mongoose.models.Counter ||
  mongoose.model("Counter", CounterSchema);