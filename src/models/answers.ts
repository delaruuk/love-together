import dotenv from 'dotenv'
import mongoose from 'mongoose'
dotenv.config()

// category schema with categoryId auto incremented below and questions array (autoincrement is initialized in survey model file)
const answersSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    shareCode:{type: String, required: true},
    qId: {type: String, required: true},
    versionId: {type: Number},
    categoryId: {type: Number},
    answer: {type: [], required: true},
})

answersSchema.index({userId:1, qId: 1}, {unique: true})
answersSchema.index({userId:1})
answersSchema.index({shareCode:1})

const Answers = mongoose.model('Answers', answersSchema)

export {Answers}