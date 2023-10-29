import mongoose, { Schema } from "mongoose";

const customersSchema = new Schema(
  {
    name: String,
    email: String,
    image_url: String,
  },
  {
    timestamps: true,
  }
);

const Customers = mongoose.models.customers || mongoose.model("customers", customersSchema);

export default Customers;
