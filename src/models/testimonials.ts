import mongoose, { Schema } from 'mongoose'

const testimonialsSchema = new mongoose.Schema({
    name:{type: String, required: true},
    age: {type: Number, required: true},
    message: {type: String, required: true},
    testimonialImage: {type: String},
    cloudinaryId: {type: String}
})

const Testimonials = mongoose.model('Testimonials', testimonialsSchema)

export {Testimonials}