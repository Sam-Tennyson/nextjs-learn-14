import mongoose, { Schema } from "mongoose";

const revenueSchema = new Schema(
  {
    month: String,
    revenue: Number
},
  {
    timestamps: true,
  }
);

const Revenues = mongoose.models.revenue || mongoose.model("revenue", revenueSchema);

export default Revenues;
