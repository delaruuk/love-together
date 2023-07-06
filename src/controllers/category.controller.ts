import express, {Request, Response} from 'express'
import { Category } from '../models/category'
import { Counter } from '../models/counter'
import cloudinary from '../middleware/cloudinary.middleware'
import {uploadImage} from "../middleware/multer.middleware"
import { checkIfAdmin } from '../middleware/auth.middleware'

class CategoryController{
    public path = '/category'
    public router = express.Router()

    constructor(){
        this.initRoutes()
    }

    public initRoutes(){
        this.router.post('/', checkIfAdmin, uploadImage.single("image"), this.postCategory)
        this.router.get('/', this.getCategories) 
        this.router.delete('/', checkIfAdmin, this.deleteLatestCategory)
    }

    async getCategories(req: Request, res: Response){
        try{
            const categories = await Category.find({})
            res.send(categories)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async postCategory(req: Request, res: Response){
        try{
            // upload image to cloudinary
            const result = await cloudinary.uploader.upload(req.file.path);
                // option to compress image
                // { eager: [{ width: 400, crop: "fit" }] },
                // function (error, result) {
                // console.log(result);
                // }
                // const imageTag = result.eager[0].secure_url;

            const catId = await Counter.findOneAndUpdate({model: "category"}, {
                $inc: {counter: 1}
            })
            const category = await Category.create({
                category: req.body.category,
                categoryId: catId.counter + 1,
                categoryImage: result.secure_url,
                cloudinaryId: result.public_id
            })

            res.send(category)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async putCategory(req: Request, res: Response){
        try{
            // upload image to cloudinary
            if(req.file.path){
                const result = await cloudinary.uploader.upload(req.file.path);
                const category = await Category.findOneAndUpdate({
                    category: req.body.category,
                    categoryImage: result.secure_url,
                    cloudinaryId: result.public_id
                })
    
                res.send(category)
            } else{
                const category = await Category.findOneAndUpdate({
                    category: req.body.category
                })
    
                res.send(category)
            }
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async deleteLatestCategory(req: Request, res: Response){
        try{
            const catId = await Counter.findOneAndUpdate({model: "category"}, {
                $inc: {counter: -1}
            })

            const category = await Category.findOneAndDelete({categoryId: catId.counter})
            await cloudinary.uploader.destroy(category.cloudinaryId);
            res.send(category)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

}

export default CategoryController