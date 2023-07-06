import mongoose from 'mongoose'

const counterSchema = new mongoose.Schema({
    model:{type: String, required: true},
    field: {type: String, required: true},
    counter: {type: Number, default: 0}
})

const Counter = mongoose.model('Counter', counterSchema)

export {Counter}