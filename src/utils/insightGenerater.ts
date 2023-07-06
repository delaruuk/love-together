import { Insights } from '../models/insights';
import { Answers } from '../models/answers';
import { Questions } from '../models/questions'
import { InsightsData } from '../models/insightsData';
import { ObjectId } from 'mongodb';


class InsightGenerater{

    userId: any;
    qId: string;
    versionId: number;
    userInsightSet: object;
 
    constructor( userId: any, qId: string, versionId: number) { 
        this.userId = userId,
        this.qId = qId,
        this.versionId = versionId
    }  

    async buildInsight(){
        try{
            const userQuestion = await this.getQuestion()
            const userAnswer = await Answers.findOne({userId: this.userId, versionId: this.versionId, qId: this.qId})
            const userInsight = await InsightsData.findOne({versionId: this.versionId, qId: this.qId})
            if (!userInsight) throw new Error('insight data not found');
            if (userInsight.globalAnalysis === true) {
                this.userInsightSet = userInsight.insightsSet[0]
            }else if (userQuestion.answerTypeId === 1) {
                if (userAnswer.answer[0] < 3){
                    this.userInsightSet = userInsight.insightsSet[0]

                }else if ( userAnswer.answer[0] > 2 && userAnswer.answer[0] < 5 ){
                    this.userInsightSet = userInsight.insightsSet[1]

                }else if ( userAnswer.answer[0] > 5 && userAnswer.answer[0] < 8 ){
                    this.userInsightSet = userInsight.insightsSet[3]

                }else if ( userAnswer.answer[0] > 7 && userAnswer.answer[0] <= 10 ){
                    this.userInsightSet = userInsight.insightsSet[4]

                }else {
                    this.userInsightSet = userInsight.insightsSet[2]

                }
            }else if (userQuestion.answerTypeId === 2) {
                const idx = userAnswer.answer[0]
                const userInsightSet = userInsight.insightsSet[idx]
            }
            return this.userInsightSet
        }catch(error){
            console.log(error.message)
        }
    }

    async getQuestion(){
        try{
            const question = await Questions.findOne({versionId: this.versionId, _id: new ObjectId(this.qId)})
            if(!question) throw new Error('question not found');
            return question
        }catch(error){
            console.log(error.message)
        }
    }


}
export{InsightGenerater}

//write generate insight function