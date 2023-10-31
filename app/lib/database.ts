import mongoose from "mongoose"

let isConnected = false
let MONGO_DB_URI: string  = `mongodb+srv://saurabh:12345@atlascluster.63lskgf.mongodb.net/?retryWrites=true&w=majority`
export const connectToDB = async () => {
    mongoose.set("strictQuery", true)
    if (isConnected) {
        console.log("Database is already connected ...!");
        return;
    }

    try {
        await mongoose.connect(MONGO_DB_URI, {
            dbName: "test",  // dbname
        })

        isConnected = true
        console.log("MongoDB connected");
    } catch (error) {
        console.log(error, "mongodb");
    }
}