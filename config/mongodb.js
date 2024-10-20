import mongoose  from "mongoose";

// Connect to MongoDB
const connectDB = async () => {
    mongoose.connection.on('connected', () => console.log("Connecting to MongoDB"));
    await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`)
    
}

export default connectDB;