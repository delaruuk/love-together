import dotenv from 'dotenv'
import mongoose from 'mongoose'
dotenv.config()

const insightsDataSchema = new mongoose.Schema({
    qId: {type: String, required: true},
    insightsSet: {type: [], required: true},
    categoryId: {type: Number},
    versionId: {type: Number},
    globalAnalysis : {type: Boolean, default: false}
})


const InsightsData = mongoose.model('InsightsData', insightsDataSchema)

export {InsightsData}