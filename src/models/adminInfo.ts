import mongoose from 'mongoose'

const adminInfoSchema = new mongoose.Schema({
    name:{type: String, required: true},
    description:{type: String},
    value: {type: String},
    filename: {type: String},
    sizeInBytes: {type: String},
    format: {type: String},
    fileUrl: {type: String},
    cloudinaryId: {type: String}
})

const AdminInfo = mongoose.model('AdminInfo', adminInfoSchema)

export {AdminInfo}