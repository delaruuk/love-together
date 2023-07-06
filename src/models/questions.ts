import mongoose from 'mongoose'

const questionsSchema = new mongoose.Schema({
    versionId:{type:Number, required: true},
    categoryId:{type:Number, required: true},
    answerTypeId: {type: Number, required:true},
    parent: {
        questionText: {type: String},
        answerReq: {type: String}
    },
    orderNum: {type: Number, required: true},
    questionText: {type: String, required: true},
    descriptionText: {type: String},
    answerWeight: {type: Number, default: 1},
    answers:{type: [], required: true},
    active:{type: Boolean, default: true}
})

questionsSchema.index({versionId:1})
questionsSchema.index({versionId: 1, categoryId:1})

const Questions = mongoose.model('Questions', questionsSchema)

export {Questions}

