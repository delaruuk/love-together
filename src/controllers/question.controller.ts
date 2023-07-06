import express, {Request, Response} from 'express'
import {Questions} from '../models/questions'
import { Counter } from '../models/counter'
import { Tempquestions } from '../models/tempquestions'
import { Category } from '../models/category'
import { Users } from '../models/users'
import { checkIfAuthenticated, checkIfAdmin } from '../middleware/auth.middleware'
import { Answers } from '../models/answers'

class QuestionsController{
    public path = '/questions'
    public router = express.Router()

    constructor(){
        this.initRoutes()
    }

    public initRoutes(){
        this.router.get('/', checkIfAuthenticated, this.getCurrentSurveyQuestionsByCategory) // NOT USED: get current questions per category
        this.router.get('/categories', checkIfAuthenticated, this.getCategoriesByVersion) // get categories in a version
        this.router.get('/category', checkIfAuthenticated, this.getQuestionsByCategory) // get questions in a category and version

        // Admin Endpoints
        this.router.get('/versionAndCategory', checkIfAdmin,  this.getQuestionsByVersionAndCategory) // get all questions in a version and category
        this.router.post('/postOneQuestion', checkIfAdmin, this.postOneQuestion)
        // this.router.post('/', checkIfAdmin, this.postQuestions) 
        this.router.post('/newSurvey', checkIfAdmin, this.postNewSurvey)
        this.router.put('/updateOneQuestion', checkIfAdmin, this.updateOneQuestion)
        this.router.put('/updateOneCategoriesQuestions', checkIfAdmin, this.updateOneCategoriesQuestions)
        this.router.delete('/deleteQuestion', checkIfAdmin, this.deleteQuestion)

        // this.router.put('/updateAll', checkIfAdmin, this.updateAllQuestions)
        // this.router.put('/editTemp', checkIfAdmin, this.editTempQuestions)

        // this.router.post('/temp',  checkIfAdmin, this.postTempQuestions)
        // this.router.put('/getbyanswertype', this.getAllTextQuestions)
    }

    async getCurrentSurveyQuestionsByCategory(req: Request, res: Response){
        try{
            const verId = await Counter.findOne({model: "questions"})

            const category = await Category.findOne({category: req.query.category})

            if(!category)res.status(404).send({errorMessage: "Category not found"})
            else{
                const categoryId = category.categoryId
    
                const questions = await Questions.find({versionId: verId.counter, categoryId: categoryId}).sort({orderNum: 1})
                if(!questions.length) res.status(404).send({errorMessage: "No questions in this version and category"})
                else res.send(questions)
            }

        }catch(error){
            console.log(error.message)
            res.status(500).send(error.message)
        }
    }

    async getCategoriesByVersion(req: Request, res: Response){
        try{
            const user = await Users.findOne({userId: req.query.userId})
            if(!user) res.status(404).send({errorMessage: "User not found."})
            else{
                const categoryList = await Category.find({})
                const questions = await Questions.find({versionId: user.versionId})
    
                let freeCategories = new Set(), premiumCategories = new Set()
                
                questions.forEach(el=>{
                    if(!freeCategories.has(el.categoryId) && !premiumCategories.has(el.categoryId)){
                        let categoryTemp = categoryList.find(cat=>cat.categoryId === el.categoryId)

                        if(categoryTemp.subscriptionStatus === "Free") freeCategories.add(el.categoryId)
                        else premiumCategories.add(el.categoryId)
                    } 
                })
    
                res.send({freeCategories: categoryList.filter(el => freeCategories.has(el.categoryId)),
                        premiumCategories: categoryList.filter(el => premiumCategories.has(el.categoryId))})
            }


        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async getQuestionsByCategory(req: Request, res: Response){
        try{
            const user = await Users.findOne({userId: req.query.userId})

            if(!user) res.status(404).send({errorMessage: "User not found."})
            else{
                const category = await Category.findOne({category: req.query.category})
                if(!category) res.status(404).send({errorMessage: "Category not found"})
                else{
                    if(user.subscriptionStatus === "Premium" || user.subscriptionStatus === category.subscriptionStatus){
                        const categoryId = category.categoryId
            
                        const questions = await Questions.find({versionId: user.versionId, categoryId: categoryId}).sort({orderNum: 1})
                        if(!questions.length) res.status(404).send({errorMessage: "No questions in this version and category"})
                        else res.send(questions)
                    } else res.status(404).json({errorMessage: "You must have Premium to view these questions."})
                }
            }
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    //Admin Endpoints

    async getQuestionsByVersionAndCategory(req: Request, res: Response){
        try{
            if(!req.query.version) return res.status(404).send({errorMessage: "No version detected"})

            const category = await Category.findOne({category: req.query.category})
            if(!category)res.status(404).send({errorMessage: "Category not found"})
            else{
                const categoryId = category.categoryId
    
                const questions = await Questions.find({versionId: req.query.version, categoryId: categoryId}).sort({orderNum: 1})
                if(!questions.length) res.status(404).send({errorMessage: "No questions in this version and category"})
                else res.send(questions)
            }
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async postOneQuestion(req: Request, res: Response){
        try{
            const question = await Questions.create({
                versionId: req.body.versionId,
                categoryId: req.body.categoryId,
                answerTypeId: req.body.answerTypeId,
                questionText: req.body.questionText,
                descriptionText: req.body.descriptionText,
                orderNum: req.body.orderNum,
                answerWeight: req.body.answerWeight,
                answers: req.body.answers,
                active: req.body.active
            })

            res.send(question)

        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async postQuestions(req: Request, res: Response){
        try{
            const questionsArr = req.body.questions,
                  categoryId = questionsArr[0].categoryId

            for(let i = 0; i<questionsArr.length; i++){
                let question = questionsArr[i]
                question["orderNum"] = i+1

                if(question.answerTypeId == 1 || question.answerTypeId == 2){
                    let id = 0
                    question.answers.forEach((ans) => {
                        ans["ansId"] = id
                        id++
                    })
                }
            }

            const status = await Tempquestions.bulkWrite(questionsArr.map(question => ({
                updateOne:{
                    filter: {_id: question._id},
                    update: question,
                    upsert: true
                }
            })))

            res.send(status)

        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async postNewSurvey(req: Request, res: Response){
        // This is used to generate a new survey version. It takes in an array of all the questions that will be on the new survey version and adds it to the questions schema. 
        try{
            const verId = await Counter.findOneAndUpdate({model: "questions"}, {
                $inc: {counter: 1}
            })
            const curVersion = verId.counter + 1

            const category = {}

            const unorderedQuestions = req.body.questions
            
            unorderedQuestions.forEach((question)=>{
                let catId = question.categoryId
                category[catId] ? category[catId].push(question) : category[catId] = [question]
            })

            let orderedQuestions = [] 

            for(let catId in category){
                let orderNum = 1
                for(let question of category[catId]){
                    question["orderNum"] = orderNum
                    question["versionId"] = curVersion
                    orderNum++
                }
                orderedQuestions = orderedQuestions.concat(category[catId])
            }

            const questions = await Questions.insertMany(orderedQuestions)
            console.log("Questions added successfully")
            res.json(questions)

        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async updateOneQuestion(req: Request, res: Response){
        try{
            if(!req.body._id) return res.status(404).send({errorMessage: "Need valid question _id"})
            const question = await Questions.findOneAndUpdate({_id: req.body._id}, {
                answerTypeId: req.body.answerTypeId,
                questionText: req.body.questionText,
                descriptionText: req.body.descriptionText,
                answerWeight: req.body.answerWeight,
                answers: req.body.answers,
                active: req.body.active
            }, {new: true})

            if(!question) return res.status(404).send({errorMessage: "Question _id not found"})
            else{
                console.log("Question updated successfully")
                res.json(question)
            }

        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async updateOneCategoriesQuestions(req: Request, res: Response){
        try{
            const questionsArr = req.body.questions 

            for(let i = 0; i<questionsArr.length; i++){
                let question = questionsArr[i]
                
                const updatedQ = await Questions.findOneAndUpdate({_id: question._id}, {
                    answerWeight: question.answerWeight,
                    orderNum: i+1,
                    active: question.active,
                    questionText: question.questionText,
                    descriptionText: question.descriptionText
                })

                console.log(updatedQ.orderNum, updatedQ.questionText)
            }

            const category = await Questions.find({categoryId: questionsArr[0].categoryId})
            res.send(category)

        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async postQuestionsFromScratch(req: Request, res:Response){
        try{
            const category = {}
            const unorderedQuestions = req.body.questions
            
            unorderedQuestions.forEach((question)=>{
                let catId = question.categoryId
                category[catId] ? category[catId].push(question) : category[catId] = [question]
            })

            let orderedQuestions = [] 

            for(let catId in category){
                let orderNum = 1
                for(let question of category[catId]){
                    question["orderNum"] = orderNum
                    orderNum++
                }
                orderedQuestions = orderedQuestions.concat(category[catId])
            }

            const questions = await Questions.insertMany(orderedQuestions)
            console.log("Questions added successfully")
            res.json(questions)

        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async deleteQuestion(req: Request, res: Response){
        try{
            if(!req.body._id) return res.status(404).send({errorMessage: "Need valid question _id"})
            const question = await Questions.findOneAndDelete({_id: req.body._id}).then(async ()=>{
                
                const answers = await Answers.deleteMany({qId: req.body._id})
                
                console.log("Question and user answers deleted successfully")
                res.json({message: "Question successfully deleted"})

            }).catch((error)=>{
                throw new Error(error)
            })

        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    // async postTempQuestions(req: Request, res: Response){
    //     try{
    //         const actual = await Questions.find({})

    //         const questions = await Tempquestions.insertMany(actual)
    //         console.log("Questions added successfully")
    //         res.json(questions)

    //     }catch(error){
    //         console.log(error.message)
    //         res.status(500).json({errorMessage: error.message})
    //     }
    // }
    
    // async editTempQuestions(req: Request, res: Response){
    //     try{
    //         const temp = await Questions.find({})

    //         temp.forEach(async (el)=>{
    //             if(el.answerTypeId == 1 || el.answerTypeId == 2){
    //                 let id = 0
    //                 el.answers.forEach((ans) => {
    //                     ans["ansId"] = id
    //                     id++
    //                 })
    //                 const updatedQ = await Questions.findOneAndUpdate({_id: el._id}, {answers: el.answers})
    //                 console.log(updatedQ)
    //             }
    //         })

    //         const newTemp = await Questions.find({})

    //         res.send(newTemp)
      
    //     }catch(error){
    //         console.log(error.message)
    //         res.status(500).json({errorMessage: error.message})
    //     }
    // }

    // async updateOneQuestion(req: Request, res: Response){
    //     try{
    //         let category, categoryId
    //         if(req.body.newCategory){
    //             category = await Category.findOne({category: req.body.newCategory})
    //             categoryId = category.categoryId
    //         }

    //         const questions = await Questions.findOneAndUpdate({_id: req.body._id}, {
    //             categoryId: categoryId,
    //             answerTypeId: req.body.answerTypeId,
    //             questionText: req.body.questionText,
    //             answerWeight: req.body.answerWeight,
    //             answers: req.body.answers,
    //             active: req.body.active
    //         }, {new: true})
    //         console.log("Question updated successfully")
    //         res.json(questions)

    //     }catch(error){
    //         console.log(error.message)
    //         res.status(500).json({errorMessage: error.message})
    //     }
    // }

    // async updateAllQuestions(req: Request, res: Response){
    //     try{
    //         let boolean = req.body.active === 'true' || req.body.active === true ? true : false
    //         const questions = await Questions.updateMany({versionId:req.body.version},{
    //             active: boolean
    //         })
    //         console.log("Questions updated successfully")
    //         res.json(questions)

    //     }catch(error){
    //         console.log(error.message)
    //         res.status(500).json({errorMessage: error.message})
    //     }
    // }
}

export default QuestionsController

