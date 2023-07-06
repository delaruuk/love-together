import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI,{
            // useNewUrlParser: true,
            // useUnifiedTopology: true
        })

        console.log('MongoDB Connected: Success') 
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

export default connectDB
