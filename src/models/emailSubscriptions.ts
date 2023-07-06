import mongoose from 'mongoose'

const emailSubscriptionSchema = new mongoose.Schema({
    email:{type: String, required: true},
    subscribed: {type: Boolean, default: true}
})

emailSubscriptionSchema.index({email:1})

const EmailSubscription = mongoose.model('EmailSubscription', emailSubscriptionSchema)

export {EmailSubscription}