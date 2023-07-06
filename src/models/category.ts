import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
    category:{type: String, required: true},
    categoryId: {type: Number},
    categoryImage: {type: String},
    cloudinaryId: {type: String},
    subscriptionStatus:{type: String, default: "Free"}
})

const Category = mongoose.model('Category', categorySchema)

export {Category}