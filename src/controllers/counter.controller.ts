import express, {Request, Response} from 'express'
import { Counter } from "../models/counter"

class CounterController{
    public path = '/counter'
    public router = express.Router()

    constructor(){
        this.initRoutes()
    }

    public initRoutes(){
        this.router.post('/', this.postCounter)
    }

    async postCounter(req: Request, res: Response){
        try{
            const counter = await Counter.create({
                model: req.body.model,
                field: req.body.field,
                counter: 0
            })

            res.send(counter)
        }catch(error){
            console.log(error)
            res.status(500).send(error.message)
        }
    }

}

export default CounterController