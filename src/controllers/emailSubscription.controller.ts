import express, {Request, Response} from 'express'
import { EmailSubscription } from '../models/emailSubscriptions'
import { checkIfAdmin } from '../middleware/auth.middleware'

class EmailSubscriptionController{
    public path = '/emailSubscription'
    public router = express.Router()

    constructor(){
        this.initRoutes()
    }

    public initRoutes(){
        this.router.get('/', checkIfAdmin, this.getSubs)
        this.router.post('/', this.postEmail)
        this.router.delete('/', this.deleteEmail)
        // this.router.put('/changeSubStatus', this.changeSubStatus)
    }

    async getSubs(req: Request, res: Response){
        try{
            const emailSubs = await EmailSubscription.find({})
            res.send(emailSubs)
        }catch(error){
            res.status(500).send({errorMessage:error.message})
        }
    }
    async postEmail(req: Request, res: Response){
        try{
            const emailSub = await EmailSubscription.create({
                email: req.body.email
            })

            res.send(emailSub)
        }catch(error){
            res.status(500).send({errorMessage:error.message})
        }
    }
    async deleteEmail(req: Request, res: Response){
        try{
            const emailSub = await EmailSubscription.findOneAndDelete({
                email: req.body.email
            })
            if(!emailSub) res.status(404).send({errorMessage: "Email not found"})
            else res.send(emailSub)
        }catch(error){
            res.status(500).send({errorMessage:error.message})
        }
    }

}

export default EmailSubscriptionController