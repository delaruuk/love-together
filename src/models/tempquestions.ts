// import dotenv from 'dotenv'
import mongoose from 'mongoose'
// import autoIncrement from 'mongoose-auto-increment'
// dotenv.config()

// const connection = mongoose.createConnection(process.env.MONGO_URI)
// autoIncrement.initialize(connection)

// survey schema with surveyVersion auto incremented below and questions array
const tempquestionsSchema = new mongoose.Schema({
    versionId:{type:Number, required: true},
    categoryId:{type:Number, required: true},
    answerTypeId: {type: Number, required:true},
    parent: {
        questionText: {type: String},
        answerReq: {type: String}
    },
    orderNum: {type: Number, required: true},
    questionText: {type: String, required: true},
    answerWeight: {type: Number, default: 1},
    answers:{type: [], required: true},
    active:{type: Boolean, default: false},
    descriptionText: {type: String}
})

// surveySchema.plugin(autoIncrement.plugin, {model:'Survey', field: 'surveyVersion'})

const Tempquestions = mongoose.model('Tempquestions', tempquestionsSchema)

export {Tempquestions}

