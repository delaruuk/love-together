import express, {Request, Response} from 'express'

class HomeController{
    public path = '/'
    public router = express.Router()

    constructor(){
        this.initRoutes()
    }

    private initRoutes(){
        this.router.get('/', this.home)
    }

    home(req: Request, res: Response){
        res.send(`
        <h1>Success! You made it to Love-Together API Server! </h1>
        <p>
        NODE_ENV: ${process.env.NODE_ENV}
        PORT: ${process.env.PORT}
        </p>
    `)
    }
}

export default HomeController