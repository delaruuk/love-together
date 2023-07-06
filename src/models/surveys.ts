import mongoose from 'mongoose'

const surveySchema = new mongoose.Schema({
    questions:{type:[], required: true},
    surveyVersion: {type: Number}
})

const Survey = mongoose.model('Survey', surveySchema)

export {Survey}

