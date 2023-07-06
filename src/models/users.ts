import mongoose, {Schema} from 'mongoose'

const usersSchema = new mongoose.Schema({
    userId:{type: String, required: true},
    username: {type: String},
    name: {type: String, required: true},
    dateOfBirth: {type: Date, required: true},
    versionId: {type: Number, required: true},
    shareCode: {type: String, required: true},
    partners: {type: []},
    pendingPartners: [
        {partnerName: {type: String},
        partnerUserId: {type: String},
        notification_id: {type: Schema.Types.ObjectId, ref: "Notifications"}}
    ],
    userInfo: {type: []},
    isAdmin: {type: Boolean, default: false},
    subscriptionStatus: {type: String, default: "Premium"},
    partnerStatus: {type: Number, default: 1},
    notifications: [{type: Schema.Types.ObjectId, ref: "Notifications"}]
})

usersSchema.index({userId:1}, {unique: true})
usersSchema.index({shareCode:1}, {unique: true})

const Users = mongoose.model('Users', usersSchema)

export {Users}
