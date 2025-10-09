import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// optional: index here instead of runtime createIndex
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", otpSchema);
