import mongoose from "mongoose";

const connectDB = async() => {
    try{
        const connectionObj = await mongoose.connect(
            `${process.env.MONGO_URI}/${process.env.DB_NAME}`,
        );
        console.log(`MongoDB connected: ${connectionObj.connection.host}`);
    }
    catch(err){
        console.error(`Error: ${err}`);
        process.exit(1);
    }
}

export default connectDB;