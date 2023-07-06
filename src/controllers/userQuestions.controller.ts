import express, {Request, Response} from 'express'
import { checkIfAdmin, checkIfAuthenticated } from '../middleware/auth.middleware'
import { UserQuestions } from "../models/userquestions"

class UserQuestionsController{
    public path = '/userquestions'
    public router = express.Router()

    constructor(){
        this.initRoutes()
    }

    public initRoutes(){
        this.router.get('/', checkIfAuthenticated, this.getUserQuestions)

        //admin endpoints
        this.router.get('/allUserQuestions', checkIfAdmin, this.getAllUserQuestions)
        this.router.post('/', checkIfAdmin, this.postUserQuestion)
        this.router.put('/', checkIfAdmin, this.putUserQuestion)
        this.router.put('/hiddenStatus', checkIfAdmin, this.hideUserQuestion)
        // this.router.put('/tempedit', this.editUserQuestions)
    }

    async getUserQuestions(req: Request, res: Response){
        try{
            const userQuestions = await UserQuestions.find({hidden: false})
            res.send(userQuestions)
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async getAllUserQuestions(req: Request, res: Response){
        try{
            const userQuestions = await UserQuestions.find()
            res.send(userQuestions)
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }
    async postUserQuestion(req: Request, res: Response){
        try{
            const userQuestion = await UserQuestions.create({
                label: req.body.label,
                questionText: req.body.questionText,
                descriptionText: req.body.descriptionText,
                answerTypeId: req.body.answerTypeId,
                answers: req.body.answers
            })

            res.send(userQuestion)
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async putUserQuestion(req: Request, res: Response){
        try{
            const userQuestion = await UserQuestions.findOneAndUpdate({label: req.body.label}, {
                label: req.body.label,
                questionText: req.body.questionText,
                descriptionText: req.body.descriptionText,
                answerTypeId: req.body.answerTypeId,
                answers: req.body.answers
            })

            if(!userQuestion) return res.status(404).send({errorMessage: "Question not found"})
            res.send(userQuestion)
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async hideUserQuestion(req: Request, res: Response){
        try {
            const currentStatus = req.body.hiddenStatus
            const userQuestion = await UserQuestions.findOneAndUpdate({label: req.body.label}, {
                hidden: !currentStatus
            })

            if(!userQuestion) return res.status(404).send({errorMessage: "Question not found"})
            res.send(userQuestion)
        } catch (error) {
            res.status(500).json({errorMessage: error.message})
        }
    }

    // async editUserQuestions(req: Request, res: Response){
    //     try{
    //         const temp = await UserQuestions.find({})

    //         temp.forEach(async (el)=>{
    //             if(el.answerTypeId == 1 || el.answerTypeId == 2){
    //                 let id = 0
    //                 el.answers.forEach((ans) => {
    //                     ans["ansId"] = id
    //                     id++
    //                 })
    //                 const updatedQ = await UserQuestions.findOneAndUpdate({_id: el._id}, {answers: el.answers})
    //                 console.log(updatedQ)
    //             }
    //         })

    //         const newTemp = await UserQuestions.find({})

    //         res.send(newTemp)
      
    //     }catch(error){
    //         console.log(error.message)
    //         res.status(500).json({errorMessage: error.message})
    //     }
    // }

}

export default UserQuestionsController