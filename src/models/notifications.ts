import mongoose, { Schema } from 'mongoose'

const notificationsSchema = new mongoose.Schema({
    sender:{type: String},
    receiver: {type: String},
    notificationType: {type: String},
    message: {type: String},
    status: {type: String},
    read: {type: Boolean, default: false}
}, {timestamps: true})

notificationsSchema.index({receiver:1})

const Notifications = mongoose.model('Notifications', notificationsSchema)

export {Notifications}