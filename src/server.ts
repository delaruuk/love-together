import App from './app';

import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import bodyParser from 'body-parser';

import HomeController from './controllers/home.controller'
import CategoryController from './controllers/category.controller';
import QuestionsController from './controllers/question.controller';
import AnswersController from './controllers/answers.controller';
import UsersController from './controllers/users.controller';
import CounterController from './controllers/counter.controller';
import UserQuestionsController from './controllers/userQuestions.controller';
import StripeController from './controllers/stripe.controller';
import AdminInfoController from './controllers/adminInfo.controller';
import EmailSubscriptionController from './controllers/emailSubscription.controller';
import TestimonialController from './controllers/testimonial.controller';
import ExpertAdviceController from './controllers/expertAdvice.controller';
import InsightsController from './controllers/insight.controller';

dotenv.config()

const app = new App({
    port: Number(process.env.PORT) || 8080, 
    controllers:[
        new HomeController(),
        new CategoryController(),
        new QuestionsController(),
        new AnswersController(),
        new UsersController(),
        new CounterController(),
        new UserQuestionsController(),
        new StripeController(),
        new AdminInfoController(),
        new EmailSubscriptionController(),
        new TestimonialController(),
        new ExpertAdviceController(),
        new InsightsController()
    ],
    middlewares:[
        helmet(),
        cors(),
        bodyParser.json(),
        bodyParser.urlencoded({extended:true})
    ]
})

app.listen()