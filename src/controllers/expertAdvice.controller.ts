import express, {Request, Response} from 'express'
import { ExpertAdvice } from "../models/expertAdvice"
import { checkIfAdmin } from '../middleware/auth.middleware'
import { Category } from '../models/category'

class ExpertAdviceController{
    public path = '/expertAdvice'
    public router = express.Router()
    constructor(){
        this.initRoutes()
    }

    public initRoutes(){
        this.router.get('/', this.getAllExpertAdvices)
        this.router.post('/', checkIfAdmin, this.postExpertAdvice)
        this.router.delete('/', checkIfAdmin, this.deleteExpertAdvice)
        this.router.put('/', checkIfAdmin, this.putExpertAdvice)
    }

    async getAllExpertAdvices(req: Request, res: Response){
        try{
            const expertAdvices = await ExpertAdvice.find({})
            res.send(expertAdvices)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async postExpertAdvice(req: Request, res: Response){
        try{
            const category = await Category.findOne({category: req.body.category})
            if(!category) res.status(404).send({errorMessage: "Invalid Category"})

            const expertAdvice = await ExpertAdvice.create({
                name: req.body.name,
                message: req.body.message,
                description: req.body.description,
                categoryId: category.categoryId 
            })

            res.send(expertAdvice)
        }catch(error){
            res.status(500).send({errorMessage:error.message})
        }
    }

    async putExpertAdvice(req: Request, res: Response){
        try{
            const expertAdvice = await ExpertAdvice.findOneAndUpdate({_id: req.body._id},{
                name: req.body.name,
                message: req.body.message,
                description: req.body.description
            })

            if(!expertAdvice) res.status(404).send({errorMessage: "Quote not found"})
            res.send(expertAdvice)
        }catch(error){
            res.status(500).send({errorMessage:error.message})
        }
    }

    async deleteExpertAdvice(req: Request, res: Response){
        try {
            const expertAdvice = await ExpertAdvice.findByIdAndDelete({_id: req.query._id})

            if(!expertAdvice) res.status(404).send({errorMessage: "That quote was not found."})
            else res.send(expertAdvice)
        } catch (error) {
            res.status(500).send({errorMessage:error.message})
        }
    }

}

export default ExpertAdviceController