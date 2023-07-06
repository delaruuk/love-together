import dotenv from 'dotenv'
import { object } from 'firebase-functions/v1/storage'
import mongoose from 'mongoose'
dotenv.config()

const insightsSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    qId: {type: String, required: true},
    versionId: {type: Number},
    categoryId: {type: Number},
    insight: {type: object},
    question_info: {type: object},
    answer_info:{type: object}
})

insightsSchema.index({userId:1, qId: 1}, {unique: true})
insightsSchema.index({userId:1})

const Insights = mongoose.model('Insights', insightsSchema)

export {Insights}