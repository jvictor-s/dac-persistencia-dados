import mongoose from "mongoose";

export async function connectMongo(){
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB conectado!");
    return mongoose.connection;
}