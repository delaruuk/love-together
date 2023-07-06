import express, {Request, Response} from 'express'
import { Users } from "../models/users"
import { AdminInfo } from '../models/adminInfo'
import { Counter } from '../models/counter'
import { checkIfAuthenticated, checkIfAdmin, makeUserAdmin } from '../middleware/auth.middleware'
import { Answers } from '../models/answers'
import {Tempanswers} from '../models/tempanswers'
import admin from '../config/firebase-service'
import { Notifications } from '../models/notifications'

class UsersController{
    public path = '/users'
    public router = express.Router()

    constructor(){
        this.initRoutes()
    }

    public initRoutes(){
        this.router.post('/', checkIfAuthenticated, this.postUser)
        this.router.get('/user/:id', checkIfAuthenticated, this.getUser)
        this.router.put('/', checkIfAuthenticated, this.putUser)
        this.router.put('/addAPartner', this.addAPartner)
        this.router.put('/deleteAPartner', this.deleteAPartner)
        this.router.get('/shareCode', checkIfAuthenticated, this.checkShareCode)
        this.router.post('/requestAPartner', checkIfAuthenticated, this.requestAPartner)
        this.router.get('/checkNotifications', checkIfAuthenticated, this.checkNotifications)
        this.router.put('/declineAPartner', checkIfAuthenticated, this.declineAPartner)
        this.router.put('/cancelARequest', checkIfAuthenticated, this.cancelARequest)
        this.router.delete('/deleteSelf', checkIfAuthenticated, this.deleteSelf)

        // Admin Endpoints
        this.router.get('/', checkIfAdmin, this.getUsers)
        this.router.put('/changeStatus', checkIfAdmin, this.changeUserSubscriptionStatus)
        this.router.put('/makeAdmin', checkIfAdmin, this.makeUserAdmin)
        this.router.delete('/deleteUser', checkIfAdmin, this.deleteUser)
        // this.router.put('/editAll', this.editAllUsers)
    }

    async getUsers(req: Request, res: Response){
        try{
            const users = await Users.find({})

            if(!users) res.status(404).send({errorMessage: "No users found"})
            else res.send(users)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async getUser(req: Request, res: Response){
        try{
            const user = await Users.findOne({userId: req.params.id})

            if(!user) res.status(404).send({errorMessage: "User not found"})
            else res.send(user)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async postUser(req: Request, res: Response){
        try{ 
            const verId = await Counter.findOne({model: "questions"})
            
            const user = await Users.create({
                userId: req.body.userId,
                username: req.body.username,
                name: req.body.name,
                dateOfBirth: req.body.dateOfBirth,
                versionId: verId.counter,
                shareCode: req.body.shareCode,
                userInfo: req.body.userInfo,
                partners: []
            })

            console.log(user)
            res.send(user)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async putUser(req: Request, res: Response){
        try{const oldUser = await Users.findOne({userId: req.body.userId})

            const user = await Users.findOneAndUpdate({userId: req.body.userId}, {
                username: req.body.username,
                name: req.body.name,
                dateOfBirth: req.body.dateOfBirth,
                versionId: req.body.version,
                shareCode: req.body.shareCode,
                userInfo: req.body.userInfo
            }, {new: true})

            if(!user) res.status(404).send({errorMessage: "User not found"})
            else{
                if(req.body.shareCode !== oldUser.shareCode){
                    for(let partner of user.partners){
                        let partnerTemp = await Users.findOne({shareCode: partner}),
                            newPartnerArray = partnerTemp.partners
                        const index = newPartnerArray.indexOf(oldUser.shareCode)
                        if(index !== -1){
                            newPartnerArray[index] = user.shareCode
                            await Users.updateOne({shareCode: partner},{
                                partners: newPartnerArray
                            })
                        }
                    }
                }
                res.send(user)
            }
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async checkNotifications(req: Request, res: Response){
        try{
            Users.findOne({userId: req.query.userId}).populate("notifications").exec((err, user) =>{
                if(err){
                    return res.status(500).json({errorMessage: err.message})
                }else{
                    res.send(user.notifications)
                }
            })

        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async requestAPartner(req: Request, res: Response){
        try{
            const user = await Users.findOne({userId: req.body.userId})
            if(user.partners.includes(req.body.partnerShareCode)) return res.status(404).send({errorMessage: "You already have that partner."})
            if(user.shareCode === req.body.partnerShareCode) return res.status(404).send({errorMessage: "That is your own share code."})

            const partner = await Users.findOne({shareCode: req.body.partnerShareCode})
            if(!partner) return res.status(404).send({errorMessage:"That partner could not be found."})
            user.pendingPartners.forEach((el)=>{
                if(el.partnerUserId === partner.userId) return res.status(404).send({errorMessage: "You have already requested that partner."})
            })

            const notification = await Notifications.create({
                sender: req.body.userId,
                receiver: partner.userId,
                notificationType: "PartnerRequest",
                message: `${user.name} has requested to be a partner. By accepting you will be able to see each other's answers.`,
                status: "Pending"
            })

            const updatedUser = await Users.findOneAndUpdate({userId: req.body.userId},{
                $push: {pendingPartners: {partnerName: partner.name, partnerUserId: partner.userId, notification_id: notification._id}}
            }, {new: true})

            
            await Users.updateOne({userId: partner.userId},{
                $push: {notifications: notification._id}
            })

            res.send(updatedUser)

        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async declineAPartner(req: Request, res: Response){
        try{
            const notification = await Notifications.findOneAndUpdate({_id: req.body.notification_id},{
                status: "Declined"
            }, {new: true})

            const user = await Users.findOneAndUpdate({userId: req.body.userId},{
                $pull: {notifications: notification._id}
            }, {new: true})

            await Users.updateOne({userId: notification.sender},{
                $pull: {pendingPartners: {partnerUserId: req.body.userId}}
            })

            res.send(user)

        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async cancelARequest(req: Request, res: Response){
        try{
            const notification = await Notifications.findOneAndUpdate({_id: req.body.notification_id},{
                status: "Cancelled"
            }, {new: true})

            const user = await Users.findOneAndUpdate({userId: req.body.userId},{
                $pull: {pendingPartners: {partnerUserId: notification.receiver}}
            }, {new: true})

            await Users.updateOne({userId: notification.receiver},{
                $pull: {notifications: notification._id}
            })

            res.send(user)

        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async addAPartner(req: Request, res: Response){
        try{
            const notification = await Notifications.findOneAndUpdate({_id: req.body.notification_id},{
                status: "Accepted"
            }, {new: true})

            const maxPartners = await AdminInfo.findOne({name: "Number of Partners"})

            const userInfo = await Users.findOne({userId: req.body.userId}),
                  userPartners = userInfo.partners,
                  partnerInfo = await Users.findOne({userId: notification.sender})

            if(!partnerInfo) return res.status(404).send({errorMessage:"Partner does not exist"})
            if(userPartners.includes(partnerInfo.shareCode)) return res.status(404).send({errorMessage: "You already have that partner."})
            const partnersPartners = partnerInfo.partners

            if(userPartners && userPartners.length >= Number(maxPartners.value)) return res.status(500).json({errorMessage: "You have too many partners"})
            if(partnerInfo && partnersPartners.length >= Number(maxPartners.value)) return res.status(500).json({errorMessage: "That user has too many partners."})

            const user = await Users.findOneAndUpdate({userId: req.body.userId}, {
                $push: {partners: partnerInfo.shareCode}, 
                $pull: {notifications: notification._id}
            }, {new: true})

            await Users.updateOne({userId: notification.sender}, {
                $push: {partners: user.shareCode},
                $pull: {pendingPartners: {partnerUserId: req.body.userId}}
            })

            if(!user) res.status(404).send({errorMessage: "User not found"})
            else res.send(user)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async deleteAPartner(req: Request, res: Response){
        try{
            const userInfo = await Users.findOne({userId: req.body.userId}),
                  userPartners = userInfo.partners,
                  deletedPartner = req.body.shareCode,
                  partnerInfo = await Users.findOne({shareCode: deletedPartner}),
                  partnersPartners = partnerInfo.partners

            const user = await Users.findOneAndUpdate({userId: req.body.userId}, {
                partners: userPartners.filter(el=> el !== deletedPartner)
            }, {new: true})

            await Users.updateOne({shareCode: deletedPartner},{
                partners: partnersPartners.filter(el => el !== user.shareCode)
            })

            if(!user) res.status(404).send({errorMessage: "User not found"})
            else if(!partnerInfo) res.status(404).send({errorMessage: "Partner not found"})
            else res.send(user)

        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async checkShareCode(req: Request, res: Response){
        try{
            let shareCode = await Users.findOne({shareCode: req.query.shareCode})
            if(shareCode) return res.status(500).json({status: false, message: 'This Share Code is taken.'})

            res.send({status: true, message: "This Share Code is not taken."})
        }catch(error){
            res.status(500).send(error.message)
        }
    }

    async changeUserSubscriptionStatus(req: Request, res: Response){
        try{
            const newStatus = req.body.currentStatus === "Free" ? "Premium":"Free"
            const user = await Users.findOneAndUpdate({userId: req.body.userId}, {
                subscriptionStatus: newStatus
            }, {new: true})

            if(!user) res.status(404).send({errorMessage: "User not found"})
            else res.send(user)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async deleteSelf(req: Request, res: Response){
        try{
            if(typeof(req.query.userId) == 'string'){
                let fireBaseUser = await admin.auth().deleteUser(req.query.userId).then(async ()=>{
                    const dbUser = await Users.findOneAndDelete({userId: req.query.userId}),
                          dbUserPartners = dbUser.partners

                    for(let partner of dbUserPartners){
                        let partnerTemp = await Users.findOne({shareCode: partner})
                        await Users.updateOne({shareCode: partner},{
                            partners: partnerTemp.partners.filter(el => el !== dbUser.shareCode)
                        })
                    }
                    const answers = await Answers.deleteMany({userId: req.query.userId})
                    
                    if(!dbUser) res.status(404).send({errorMessage: "User login destroyed, but was not found in database."})
                    else res.send({message: "User successfully deleted", answers: answers, user: dbUser})
                }
                ).catch((error)=>{
                    throw new Error(error);
                })
            } else {
                throw new Error("Error retrieving requested user");
            }
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async makeUserAdmin(req: Request, res: Response){
        try{
            return makeUserAdmin(req, res)
        }catch(error){
            res.status(500).send(error.message)
        }
    }

    async deleteUser(req: Request, res: Response){
        try{
            if(typeof(req.query.userId) == 'string'){
                let fireBaseUser = await admin.auth().deleteUser(req.query.userId).then(async ()=>{
                    const dbUser = await Users.findOneAndDelete({userId: req.query.userId}),
                          dbUserPartners = dbUser.partners

                    for(let partner of dbUserPartners){
                        let partnerTemp = await Users.findOne({shareCode: partner})
                        await Users.updateOne({shareCode: partner},{
                            partners: partnerTemp.partners.filter(el => el !== dbUser.shareCode)
                        })
                    }
                    const answers = await Answers.deleteMany({userId: req.query.userId})
                    
                    if(!dbUser) res.status(404).send({errorMessage: "User login destroyed, but was not found in database."})
                    else res.send({message: "User successfully deleted", answers: answers, user: dbUser})
                }
                ).catch((error)=>{
                    throw new Error(error);
                })
            } else {
                throw new Error("Error retrieving requested user");
            }
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    // async editAllUsers(req: Request, res: Response){
    //     try{
    //         const users = await Users.find({})

    //         users.forEach(async (user)=>{
    //             const updatedU = await Users.findOneAndUpdate({_id: user._id},{
    //                 subscriptionStatus: "Premium"
    //             })
    //             console.log(updatedU)
    //         })

    //         const updatedUsers = await Users.find({})

    //         res.send(updatedUsers)
    //     }catch(error){
    //         res.status(500).json({errorMessage: error.message})
    //     }
    // }

}

export default UsersController