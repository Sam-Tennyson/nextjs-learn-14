import mongoose, { Schema } from "mongoose";

const invoicesSchema = new Schema(
  {
    customer_id: String,
    amount: String,
    status: String,
    date: String,
  },
  {
    timestamps: true,
  }
);

const Invoices = mongoose.models.invoices || mongoose.model("invoices", invoicesSchema);

export default Invoices;
