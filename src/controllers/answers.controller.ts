import express, {Request, Response} from 'express'
import { Users } from '../models/users'
import { checkIfAuthenticated, checkIfAdmin } from '../middleware/auth.middleware'
import {Answers} from '../models/answers'
import { Category } from '../models/category'
import { Questions } from '../models/questions'
import { Tempanswers } from '../models/tempanswers'
import { parse } from 'json2csv';
import * as ExcelJS from 'exceljs';

class AnswersController{
    public path = '/answers'
    public router = express.Router()

    constructor(){
        this.initRoutes()
    }

    public initRoutes(){
        this.router.get('/user', checkIfAuthenticated, this.getAnswersByUser) // get all of a users answers
        this.router.get('/category', checkIfAuthenticated, this.getAnswersByCategory) // get all of a users answers by category
        this.router.get('/compare', checkIfAuthenticated, this.compareUsers) // compare scores between 2 users (returns array of all scores)
        this.router.get('/partner', checkIfAuthenticated, this.getPartnerTotalScore) // get the total score between 2 users
        this.router.get('/catScore', checkIfAuthenticated, this.getOneCategoryScore) // get the category score between 2 users 
        this.router.get('/partnerAnswers', checkIfAuthenticated, this.getUserAndPartnerAnswersByCategory) // get the user and partner answers
        this.router.post('/', checkIfAuthenticated, this.postUserAnswers) // post a users answers 
        this.router.put('/changeShareCode', checkIfAuthenticated, this.changeShareCode)
        // this.router.put('/editAnswers', checkIfAdmin, this.editAnswers)
        // this.router.delete('/delete', this.deleteAnswers)
        
        // Admin Endpoints
        this.router.get('/getAllAnswersByCategory', checkIfAdmin, this.getAllAnswersByCategory) // get all answers by category
        this.router.get('/getAllAnswers', checkIfAdmin, this.getAllAnswers) // get all answers and send csv
    }

    async getAnswersByUser(req: Request, res: Response){
        try{
            const user = await Users.findOne({userId: req.query.userId})
            if(!user) res.status(404).send({errorMessage: "User not found."})
            else{
                const answersCollection = await Answers.find({userId: req.query.userId, versionId: user.versionId})
                res.send(answersCollection)
            }
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async getAnswersByCategory(req: Request, res: Response){
        try{
            const user = await Users.findOne({userId: req.query.userId})
            if(!user) res.status(404).send({errorMessage: "User not found."})
            else{
                const category = await Category.findOne({category: req.query.category})
                if(!category) res.status(404).send({errorMessage: "Category not found."})
                else{
                    const categoryId = category.categoryId
        
                    const answersCollection = await Answers.aggregate([
                        {$match: {$and:[{userId: req.query.userId}, {versionId: user.versionId}, {categoryId: categoryId}]}},
                        {$lookup:{
                            from: "questions",
                            let: {"searchId": {$toObjectId: "$qId"}},
                            pipeline: [
                                {$match: {$expr: { $eq: ["$_id", "$$searchId"]}}},
                                {$project: {"_id": 0, "questionText": 1, "orderNum": 1, "answerTypeId": 1, "answers": 1}}
                            ],
                            as: "question_info"
                        }},
                        {$project:{"_id": 1, "qId": 1, "answer": 1, "categoryId":1, "question_info": 1}}
                    ])
        
                    res.send(answersCollection)
                }
            }
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async compareUsers(req: Request, res: Response){
        try{
            const user1 = await Users.findOne({userId: req.query.userId})
            const user2 = await Users.findOne({shareCode: req.query.partnerShareCode})

            if(!user1) res.status(404).send({errorMessage: "User not found"})
            else if(!user2) res.status(404).send({errorMessage: "Invalid Share Code."})
            else if(user1.shareCode === req.query.partnerShareCode) res.status(404).send({errorMessage: "That is your share code."})
            else{
                const user1Collection = await Answers.aggregate([
                    {$match: {userId: req.query.userId}},
                    {$lookup:{
                        from: "questions",
                        // set searchId where qId string converted to ObjectId
                        let: {"searchId": {$toObjectId: "$qId"}},
                        // search query with [searchId] value
                        pipeline: [
                            // searching [searchId] value equals field [_id]
                            {$match: {$expr: { $eq: ["$_id", "$$searchId"]}}},
                            // specify parameters needed returned
                            {$project: {"_id": 0, "categoryId":1, "answerTypeId": 1, "answerWeight":1, "answers": 1, "active":1}}
                        ],
                        as: "question_info"
                    }},
                    {$project:{"_id": 1, "qId": 1, "answer": 1, "question_info": 1}}
                    ])
                const user2Collection = await Answers.aggregate([
                    {$match: {shareCode: req.query.partnerShareCode}},
                    {$lookup:{
                        from: "questions",
                        let: {"searchId": {$toObjectId: "$qId"}},
                        pipeline: [
                            {$match: {$expr: { $eq: ["$_id", "$$searchId"]}}},
                            {$project: {"_id": 0, "categoryId":1, "answerTypeId": 1, "answerWeight":1, "answers": 1, "active":1}}
                        ],
                        as: "question_info"
                    }},
                    {$project:{"_id": 1, "qId": 1, "answer": 1, "question_info": 1}}
                ])
                let categoryScores = await AnswersController.dateTwoPeople(user1Collection, user2Collection)

                res.send({freeCatScores: categoryScores.filter(el=>el.catStatus==="Free"), premiumCatScores: categoryScores.filter(el=>el.catStatus==="Premium"), partner: user2.name})
            }
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async getPartnerTotalScore(req: Request, res: Response){
        try{
            const user1 = await Users.findOne({userId: req.query.userId})
            const partner = await Users.findOne({shareCode: req.query.partnerShareCode})

            if(!user1) res.status(404).send({errorMessage: "User not found"})
            else if(!partner) res.status(404).send({errorMessage: "Invalid Share Code."})
            else if(user1.shareCode === req.query.partnerShareCode) res.status(404).send({errorMessage: "That is your share code."})
            else{
                const user1Collection = await Answers.aggregate([
                    {$match: {userId: req.query.userId}},
                    {$lookup:{
                        from: "questions",
                        // set searchId where qId string converted to ObjectId
                        let: {"searchId": {$toObjectId: "$qId"}},
                        // search query with [searchId] value
                        pipeline: [
                            // searching [searchId] value equals field [_id]
                            {$match: {$expr: { $eq: ["$_id", "$$searchId"]}}},
                            // specify parameters needed returned
                            {$project: {"_id": 0, "categoryId":1, "answerTypeId": 1, "answerWeight":1, "answers": 1, "active":1}}
                        ],
                        as: "question_info"
                    }},
                    {$project:{"_id": 1, "qId": 1, "answer": 1, "question_info": 1}}
                    ])
                const user2Collection = await Answers.aggregate([
                    {$match: {shareCode: req.query.partnerShareCode}},
                    {$lookup:{
                        from: "questions",
                        let: {"searchId": {$toObjectId: "$qId"}},
                        pipeline: [
                            {$match: {$expr: { $eq: ["$_id", "$$searchId"]}}},
                            {$project: {"_id": 0, "categoryId":1, "answerTypeId": 1, "answerWeight":1, "answers": 1, "active":1}}
                        ],
                        as: "question_info"
                    }},
                    {$project:{"_id": 1, "qId": 1, "answer": 1, "question_info": 1}}
                ])
    
                let categoryScores = await AnswersController.dateTwoPeople(user1Collection, user2Collection)
    
                let dateScore = 0, totalScore = 0
    
                categoryScores.forEach(el=>{
                    dateScore += el.dateScore
                    totalScore += el.totalScore})
                let compatibilityScore = dateScore/totalScore
    
                res.send({partnerName: partner.name, compatibilityScore:compatibilityScore})
            }
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async getOneCategoryScore(req: Request, res: Response){
        try{
            const user1 = await Users.findOne({userId: req.query.userId})
            const user2 = await Users.findOne({shareCode: req.query.partnerShareCode})

            if(!user1) res.status(404).send({errorMessage: "User not found"})
            else if(!user2) res.status(404).send({errorMessage: "Invalid Share Code."})
            else if(user1.shareCode === req.query.partnerShareCode) res.status(404).send({errorMessage: "That is your share code."})
            else{
                const category = await Category.findOne({category: req.query.category})
                if(!category) res.status(404).send({errorMessage: "Category not found"})
                else{
                    const categoryId = category.categoryId        
                    const user1Collection = await Answers.aggregate([
                        {$match: {$and:[{userId: user1.userId}, {versionId: user1.versionId}, {categoryId: categoryId}]}},
                        {$lookup:{
                            from: "questions",
                            let: {"searchId": {$toObjectId: "$qId"}},
                            pipeline: [
                                {$match: {$expr: { $eq: ["$_id", "$$searchId"]}}},
                                {$project: {"_id": 0, "answerTypeId": 1, "answerWeight":1, "answers": 1, "active":1}}
                            ],
                            as: "question_info"
                        }},
                        {$project:{"_id": 1, "qId": 1, "answer": 1, "categoryId":1, "question_info": 1}}
                    ])
                    const user2Collection = await Answers.aggregate([
                        {$match: {$and:[{userId: user2.userId}, {versionId: user2.versionId}, {categoryId: categoryId}]}},
                        {$lookup:{
                            from: "questions",
                            let: {"searchId": {$toObjectId: "$qId"}},
                            pipeline: [
                                {$match: {$expr: { $eq: ["$_id", "$$searchId"]}}},
                                {$project: {"_id": 0, "answerTypeId": 1, "answerWeight":1, "answers": 1, "active":1}}
                            ],
                            as: "question_info"
                        }},
                        {$project:{"_id": 1, "qId": 1, "answer": 1, "categoryId":1, "question_info": 1}}
                    ])
        
                    let categoryScore = await AnswersController.compareOneCategory(user1Collection, user2Collection)
        
                    res.send(categoryScore)
                }
            }
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }


    async getUserAndPartnerAnswersByCategory(req: Request, res: Response){
        try{
            const user1 = await Users.findOne({userId: req.query.userId})
            const user2 = await Users.findOne({shareCode: req.query.partnerShareCode})
            if(!user1) res.status(404).send({errorMessage: "User not found."})
            else if(!user2) res.status(404).send({errorMessage: "Invalid Share Code."})
            else if(user1.shareCode === req.query.partnerShareCode) res.status(404).send({errorMessage: "That is your share code."})
            else{
                const category = await Category.findOne({category: req.query.category})
                if(!category) return res.status(404).send({errorMessage: "Category not found."})

                const categoryId = category.categoryId

                const answer1Collection = await Answers.find({userId: user1.userId, versionId: user1.versionId, categoryId: categoryId})
                const answer2Collection = await Answers.find({userId: user2.userId, versionId: user2.versionId, categoryId: categoryId})
                const questions = await Questions.find({versionId: user1.versionId, categoryId: categoryId})

                res.send({user1Answers: answer1Collection, user2Answers: answer2Collection, questions: questions})
                
            }
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async postUserAnswers(req: Request, res: Response){
        try{
            const user = await Users.findOne({userId: req.query.userId})
            if(!user) return res.status(404).send({errorMessage: "User not found"})

            const answersArr = req.body.answers // req.body.answers = [ {userId:, shareCode:, qId:, versionId:, answer:[]}, ...]
            
            for(let answer of answersArr){
                answer["shareCode"] = user.shareCode
            }

            const status = await Answers.bulkWrite(answersArr.map(ans => ({
                updateOne:{
                    filter: {userId: ans.userId, qId: ans.qId},
                    update: ans,
                    upsert: true
                }
            })))

            res.send(status)

        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async changeShareCode(req:Request, res: Response){
        try{
            const answers = await Answers.updateMany({shareCode: req.body.oldShareCode}, {shareCode: req.body.newShareCode})

            res.send(answers)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    
    // Private methods for algorithm

    private static async dateTwoPeople(user1, user2){
        let catScores = [{category: "blank", categoryId: 0, catStatus: "blank", dateScore: 0, totalScore: 0, isCompleted: false}] // initiated so categoryIds match with index

        const categories = await Category.find({})
        // fill out catScores array with initialized dateScore and totalScore
        for(let cat of categories){
            catScores.push({
                category: cat.category,
                categoryId: cat.categoryId,
                catStatus: cat.subscriptionStatus,
                dateScore: 0,
                totalScore: 0,
                isCompleted: false
            })
        }
        // add into catScores the compatibility score for every question
        for(let user1Ans of user1){
            let q_info = user1Ans.question_info[0],
                catId = q_info.categoryId,
                answerType = q_info.answerTypeId,
                answerWeight = q_info.answerWeight,
                answers = q_info.answers,
                active = q_info.active
            
            if(!active) continue;

            catScores[catId].totalScore += 10*answerWeight

            for(let user2Ans of user2){
                if(user1Ans.qId === user2Ans.qId){
                    let user1_cur = user1Ans.answer,
                        user2_cur = user2Ans.answer
                    
                    let user_diff = AnswersController.compareAnswer(user1_cur, user2_cur, answerType, answers)
                    
                    catScores[catId].dateScore += user_diff*answerWeight
                    catScores[catId].isCompleted = true
                    break;
                }
            }
        }
        return catScores
    }

    private static async compareOneCategory(user1, user2){ 
        let dateScore = 0, totalScore = 0

        for(let user1Ans of user1){
            let q_info = user1Ans.question_info[0],
                answerType = q_info.answerTypeId,
                answerWeight = q_info.answerWeight,
                answers = q_info.answers,
                active = q_info.active

            if(!active) continue;
            totalScore += 10*answerWeight

            for(let user2Ans of user2){
                if(user1Ans.qId === user2Ans.qId){
                    let user1_cur = user1Ans.answer,
                        user2_cur = user2Ans.answer
                    
                    let user_diff = AnswersController.compareAnswer(user1_cur, user2_cur, answerType, answers)
                    
                    dateScore += user_diff*answerWeight
                }
            }
        }
        return {dateScore: dateScore, totalScore: totalScore}
    }

    private static compareAnswer(user1_cur, user2_cur, answerType, answers){
        let user1_val = 0, user2_val = 0, user_diff = 0
        switch(answerType){
            case 1: // 1: selection
            case 2: // 2: radio
                for(let i = 0; i<answers.length; i++){
                    if(answers[i].ansId === user1_cur[0]) user1_val = answers[i].value
                    if(answers[i].ansId === user2_cur[0]) user2_val = answers[i].value 
                }
                if(user1_cur !== null && user2_cur !== null){
                    user_diff = (10 - Math.abs(user1_val - user2_val))
                }

                return user_diff
            
            case 3: // 3: checkbox 
            case 5: // 5: text
                for(let i = 0; i<user1_cur.length; i++){
                    if(user2_cur.includes(user1_cur[i])) user_diff += (10 / user1_cur.length)
                }
                
                return user_diff
            case 4: // 4: ranking
                for(let i = 0; i<user1_cur.length; i++){
                    if(user1_cur[i] === user2_cur[i]) user_diff += (10 / user1_cur.length)
                }

                return user_diff
        }
    }
    // async deleteAnswers(req: Request, res: Response){
    //     try{
    //         const deleted = await Answers.deleteMany({qId: "63c470cf304fd0692d0236d2"})
    //         res.send(deleted)
    //     }catch(error){
    //         console.log(error.message)
    //         res.status(500).json({errorMessage: error.message})
    //     }
    // }
    // async editAnswers(req: Request, res: Response){
    //     try{
    //         const temp = await Answers.find({userId: "Yw5MgmG2vId9oacpPBpoCpcQmxc2"})
    //         const questions = await Questions.find({})

    //         temp.forEach(async (el)=>{
    //             for(let i = 0; i<questions.length; i++){
    //                 if(el.qId === questions[i]._id.toString()){
    //                     if(questions[i].answerTypeId == 1 || questions[i].answerTypeId == 2){
    //                         for(let ans of questions[i].answers){
    //                             if(el.answer[0] === ans.answer){
    //                                 el.answer = [ans.ansId]
    //                                 break;
    //                             }
    //                         }
    //                         const updatedA = await Answers.findOneAndUpdate({_id: el._id}, {answer: el.answer})
    //                         console.log(updatedA)
    //                     }
    //                     break;
    //                 }
    //             }
    //         })

    //         // const newTemp = await Questions.find({})

    //         res.send("ended")
      
    //     }catch(error){
    //         console.log(error.message)
    //         res.status(500).json({errorMessage: error.message})
    //     }
    // }

    async getAllAnswersByCategory(req: Request, res: Response){
        try{
            const category = await Category.findOne({category: req.query.category})
                if(!category) res.status(404).send({errorMessage: "Category not found."})
                else{
                    const categoryId = category.categoryId
                    const versionId = parseInt(req.query.versionId as string, 10);
                    const questions = await Questions.aggregate([
                        { $match: {$and:[{versionId: versionId}, {categoryId: categoryId}]}},
                        { $project: { _id: 1, questionText: 1 } }
                      ]);

                    const questionIds = questions.map(q => q._id.toString());

                    const answers = await Answers.aggregate([
                        {
                          $match: {
                            qId: { $in: questionIds }
                          }
                        },
                        {
                          $group: {
                            _id: "$qId",
                            count: { $sum: 1 }
                          }
                        }
                      ])
                    const results = questions.map(q => {
                        const answerCount = answers.find(a => a._id === q._id.toString())?.count || 0;
                        return { qId: q._id, questionText: q.questionText, answerCount };
                    });
        
                    res.send(results)
                }
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

    async getAllAnswers(req: Request, res: Response){
        try {

            const categoriesSet = await Category.find({})

            const categoriesArray = categoriesSet.map(categorySet => categorySet.category)
   
            const versionId = parseInt(req.query.versionId as string, 10);
            const pipeline = [
                { $match:{versionId: versionId}},
                {
                    $lookup: {
                      from: "categories",
                      localField: "categoryId",
                      foreignField: "categoryId",
                      as: "category"
                    }
                  },
                {
                  $lookup: {
                    from: "questions",
                    let: { searchId: {$toObjectId: "$qId"} },
                    pipeline: [
                      { $match: { $expr: { $eq: ["$_id", "$$searchId"] } } },
                      { $project: { questionText: 1 , answerTypeId: 1, answers: 1} },
                    ],
                    as: "question_info",
                  },
                },
                {
                  $unwind: {
                    path: "$question_info",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                
                {
                  $project: {
                    category: { $arrayElemAt: ["$category.category", 0]},
                    questionText: { $ifNull: ["$question_info.questionText", undefined] },
                    answerTypeId: { $ifNull: ["$question_info.answerTypeId", undefined] },
                    answer: {
                        $cond: {
                          if: {
                            $eq: [
                              "$question_info.answerTypeId",
                              2
                            ]
                            },
                            then: [{ $arrayElemAt: [ "$question_info.answers.answer", { $arrayElemAt: ["$answer", 0]} ] }],
                            else: "$answer",
                        }}
                  },
                },
              ];
            const answers = await Answers.aggregate(pipeline)
            console.log(answers)
            

            // Create a new workbook instance
            const workbook = new ExcelJS.Workbook();

            // Map over the categories and create a sheet for each one
            const categorySheets = categoriesArray.map((category) => {
            // Filter the questions by category
            const categoryQuestions = answers.filter((answer) => answer.category === category);

            // Create a new sheet for this category
            const sheet = workbook.addWorksheet(`Category ${category}`);

            // Add the column headers
            sheet.addRow(['Question Text', 'Answer Type', 'Answers']);

            // Add the question data to the sheet
            categoryQuestions.forEach((answer) => {
                sheet.addRow([answer.questionText, answer.answerTypeId, answer.answer.join(', ')]);
            });

            // Return the sheet
            return sheet;
            });

            // Send the workbook to the frontend
            const filename = 'data.xlsx';
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            workbook.xlsx.write(res)
            .then(() => {
                res.status(200).end();
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send('Error generating Excel file');
            });
        }catch(error){
            console.log(error.message)
            res.status(500).json({errorMessage: error.message})
        }
    }

}

export default AnswersController


// Interface and typecheck to verify that the questions array has the right attribute types
