import express, {Request, Response} from 'express'
import { checkIfAuthenticated, checkIfAdmin } from '../middleware/auth.middleware'
import { Users } from '../models/users'
import { Category } from '../models/category'
import { Answers } from '../models/answers'
import { Insights } from '../models/insights'
import { InsightsData } from '../models/insightsData';
import { generateKey } from 'crypto'
import { version } from 'os'
import { InsightGenerater } from '../utils/insightGenerater'
import { Questions } from '../models/questions'

class InsightsController{
    public path = '/insights'
    public router = express.Router()

    constructor(){
        this.initRoutes()
    }

    public initRoutes(){
        this.router.get('/category', checkIfAuthenticated, this.getInsightsByCategory)
        this.router.get('/question',  this.getInsightsByQuestion)
        // // Admin Endpoints
        // this.router.get('/versionAndCategory', this.getInsightsByVersionAndCategory) //give all insights to the category
        // this.router.post('/postOneInsight', checkIfAdmin, this.postOneInsight) //add an insight
        // this.router.put('/updateOneInsight', checkIfAdmin, this.updateOneInsight) // edit an insight
        // // // this.router.put('/updateOneCategoriesQuestions', checkIfAdmin, this.updateOneCategoriesQuestions)
        // this.router.delete('/deleteInsight', checkIfAdmin, this.deleteInsight)
        // this.router.get('/deleteAllInsight', this.deleteAllInsight)

    }

    async getInsightsByCategory(req: Request, res: Response){
        try{
            const user = await Users.findOne({userId: req.query.userId})
            if (!user) res.status(404).send({errorMessage: "User not found."})
            const category = await Category.findOne({category: req.query.category})
            if (!category) res.status(404).send({errorMessage: "Category not found."})
            const categoryId = category.categoryId
            const tempCollection = []
            const questions = await Questions.find({versionId: user.versionId, categoryId: categoryId})
            const insightsSet = await Promise.all(questions.map(async question => {
              const userInsightSet = await Insights.findOne({userId: req.query.userId, versionId: user.versionId, qId: question._id.toString()})
              if (!userInsightSet) {
                const generater = new InsightGenerater(req.query.userId, question._id.toString(), user.versionId)
                const generateduserInsight = await generater.buildInsight()
                tempCollection.push({
                  userId: req.query.userId,
                  qId: question._id.toString(),
                  categoryId: categoryId,
                  versionId: user.versionId,
                  insight: generateduserInsight,
                })
              } else {
                tempCollection.push(userInsightSet)
              }
            }))
            const insight = await Insights.create(tempCollection)
            res.send(tempCollection)            
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async getInsightsByQuestion(req: Request, res: Response){
        try{
            const user = await Users.findOne({userId: req.query.userId})
            if (!user) res.status(404).send({errorMessage: "User not found."})
            let tempCollection = {}
            const question = await Questions.findOne({versionId: user.versionId, _id: req.query.qId})
            const userInsight = await Insights.findOne({userId: req.query.userId, versionId: user.versionId, qId: req.query.qId})
            if (!userInsight) {
            const generater = new InsightGenerater(req.query.userId, question._id.toString(), user.versionId)
            const generateduserInsight = await generater.buildInsight()
            tempCollection = {
                userId: req.query.userId,
                qId: req.query.qId,
                categoryId: question.categoryId,
                versionId: user.versionId,
                insight: generateduserInsight,
            }
            } else {
                tempCollection = userInsight
            }

            const insight = await Insights.create(tempCollection)
            res.send(tempCollection)            
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

//     //Admin Endpoints

// async getInsightsByVersionAndCategory(req: Request, res: Response){
//     try{
//         const user = await Users.findOne({userId: req.query.userId})
//         if(!user) res.status(404).send({errorMessage: "User not found."})
//         else{
//             const category = await Category.findOne({category: req.query.category})
//             if(!category) res.status(404).send({errorMessage: "Category not found."})
//             else{
//                 const categoryId = category.categoryId
//                 const pipeline = [
//                     { $match: { $and: [{ versionId: user.versionId }, { categoryId: categoryId }] } },
//                     {
//                       $lookup: {
//                         from: "insightsdatas",
//                         let: { searchId: { $toString: "$_id" } },
//                         pipeline: [
//                           { $match: { $expr: { $eq: ["$qId", "$$searchId"] } } },
//                           { $project: { _id: 1, insightsSet: 1, globalAnalysis: 1 } },
//                         ],
//                         as: "insight_info",
//                       },
//                     },
//                     {
//                       $unwind: {
//                         path: "$insight_info",
//                         preserveNullAndEmptyArrays: true,
//                       },
//                     },
                    
//                     {
//                       $project: {
//                         _id: "$_id",
//                         versionId: "$versionId",
//                         categoryId: "$categoryId",
//                         answerTypeId: "$answerTypeId",
//                         questionText: "$questionText",
//                         active: "$active",
//                         insightId: { $ifNull: ["$insight_info._id", undefined] },
//                         globalAnalysis: { $ifNull: ["$insight_info.globalAnalysis", undefined] },
//                         insights: {
//                           $ifNull: [
//                             {
//                               $map: {
//                                 input: "$insight_info.insightsSet",
//                                 as: "insightsSet",
//                                 in: "$$insightsSet",
//                               },
//                             },
//                             undefined,
//                           ],
//                         },
//                         answers: {
//                           $map: {
//                             input: "$answers",
//                             as: "answer",
//                             in: "$$answer",
//                           },
//                         },
//                       },
//                     },
//                   ];
                  
//                 const insightsCollection = await Questions.aggregate(pipeline)
//                 res.send(insightsCollection)
//             }
//         }
//     }catch(error){
//         console.log(error.message)
//         res.status(500).json({errorMessage: error.message})
//     }
// }

// async updateOneInsight(req: Request, res: Response){
//     try{
//         if(!req.body._id) return res.status(404).send({errorMessage: "Need valid insight _id"})
//         const insight = await InsightsData.findOneAndUpdate({_id: req.body._id}, {
//             qId: req.body.qId,
//             questionText: req.body.questionText,
//             insightsSet: req.body.insightsSet,
//             categoryId: req.body.categoryId,
//             versionId: req.body.versionId,
//             globalAnalysis : req.body.globalAnalysis
//         }, {new: true})

//         if(!insight) return res.status(404).send({errorMessage: "Insight _id not found"})
//         else{
//             console.log("Insight updated successfully")
//             res.json(insight)
//         }

//     }catch(error){
//         console.log(error.message)
//         res.status(500).json({errorMessage: error.message})
//     }
// }

// async postOneInsight(req: Request, res: Response){
//     try{
//         const insight = await InsightsData.create({
//             versionId: req.body.versionId,
//             categoryId: req.body.categoryId,
//             questionText: req.body.questionText,
//             qId: req.body.questionId,
//             insightsSet: req.body.insightsSet,
//             globalAnalysis: req.body.globalAnalysis
//         })

//         res.send(insight)

//     }catch(error){
//         console.log(error.message)
//         res.status(500).json({errorMessage: error.message})
//     }
// }

// async deleteInsight(req: Request, res: Response){
//     try{
//         if(!req.body._id) return res.status(404).send({errorMessage: "Need valid insight _id"})
//         const insight = await InsightsData.findOneAndDelete({_id: req.body._id}).then(async ()=>{
            
//             const userInsights = await Insights.deleteMany({qId: req.body.qId})
            
//             console.log("Insight and user Insights deleted successfully")
//             res.json({message: "Insights successfully deleted"})

//         }).catch((error)=>{
//             throw new Error(error)
//         })

//     }catch(error){
//         console.log(error.message)
//         res.status(500).json({errorMessage: error.message})
//     }
// }

// async deleteAllInsight(req: Request, res: Response){
//     try{
//         console.log('kkk')
//         const questions = await Questions.find({})
//         const insightsDatas = questions.map(
//             async question =>{
//                 if (question.answerTypeId === 1){
//                     const insight = await InsightsData.create({
//                     versionId: question.versionId,
//                     categoryId: question.categoryId,
//                     questionText: question.questionText,
//                     qId: question._id,
//                     insightsSet: 
//                     [
//                         {openingStatement:"",analysis:[],impacts:[],solutions:[],closingStatement:""},
//                         {openingStatement:"",analysis:[],impacts:[],solutions:[],closingStatement:""},
//                         {openingStatement:"",analysis:[],impacts:[],solutions:[],closingStatement:""},
//                         {openingStatement:"",analysis:[],impacts:[],solutions:[],closingStatement:""},
//                         {openingStatement:"",analysis:[],impacts:[],solutions:[],closingStatement:""}
//                     ],
//                     globalAnalysis: false
//                 })
//                 }else if(question.answerTypeId === 2){
//                     const insightsSet = []
//                     for (var i = 0; i < question.answers.length; i++){
//                         insightsSet.push({openingStatement:"",analysis:[],impacts:[],solutions:[],closingStatement:""})
//                     }
//                     const insight = await InsightsData.create({
//                         versionId: question.versionId,
//                         categoryId: question.categoryId,
//                         questionText: question.questionText,
//                         qId: question._id,
//                         insightsSet: insightsSet,
//                         globalAnalysis: false})
//                 }else{
//                     const insight = await InsightsData.create({
//                         versionId: question.versionId,
//                         categoryId: question.categoryId,
//                         questionText: question.questionText,
//                         qId: question._id,
//                         insightsSet: 
//                         [
//                             {openingStatement:"",analysis:[],impacts:[],solutions:[],closingStatement:""},
//                         ],
//                         globalAnalysis: true
//                     })
//                 }}
//             )
        
//         res.send(insightsDatas)
//     }catch(error){
//         console.log(error.message)
//         res.status(500).json({errorMessage: error.message})
//     }
// }

}



export default InsightsController


