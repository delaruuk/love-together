import mongoose from 'mongoose'

const userQuestionsSchema = new mongoose.Schema({
    label: {type: String, required: true},
    questionText: {type: String, required: true},
    descriptionText: {type: String},
    answerTypeId: {type: Number, required: true},
    answers: {type: [], required: true},
    hidden: {type: Boolean, default: false}
})

userQuestionsSchema.index({label: 1}, {unique: true})

const UserQuestions = mongoose.model('UserQuestions', userQuestionsSchema)

export {UserQuestions}