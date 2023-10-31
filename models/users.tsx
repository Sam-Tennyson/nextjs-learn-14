import mongoose, { Schema } from "mongoose";

const usersSchema = new Schema(
  {
    name: String,
    email: String,
    password: String,
  },
  {
    timestamps: true,
  }
);

const Users = mongoose.models.users || mongoose.model("users", usersSchema);

export default Users;
