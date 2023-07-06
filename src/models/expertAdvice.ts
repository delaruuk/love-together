import mongoose, { Schema } from 'mongoose'

const expertAdviceSchema = new mongoose.Schema({
    name:{type: String, required: true},
    message: {type: String, required: true},
    description: {type: String},
    categoryId:{type:Number}
})

const ExpertAdvice = mongoose.model('ExpertAdvice', expertAdviceSchema)

export {ExpertAdvice}