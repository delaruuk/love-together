import dotenv from 'dotenv'
import mongoose, { Types } from 'mongoose'
dotenv.config()

// category schema with categoryId auto incremented below and questions array (autoincrement is initialized in survey model file)
const tempAnswersSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    qId: {type: String, required: true},
    shareCode:{type: String, required: true},
    versionId: {type: Number},
    categoryId: {type: Number},
    answer: {type: [], required: true}
})

tempAnswersSchema.index({userId: 1, qId: 1}, {unique:true})

const Tempanswers = mongoose.model('Tempanswers', tempAnswersSchema)



export {Tempanswers}