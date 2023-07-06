import express, {Request, Response} from 'express'
import { Testimonials } from "../models/testimonials"
import cloudinary from '../middleware/cloudinary.middleware'
import {uploadImage} from "../middleware/multer.middleware"
import { checkIfAdmin } from '../middleware/auth.middleware'

class TestimonialController{
    public path = '/testimonial'
    public router = express.Router()
    constructor(){
        this.initRoutes()
    }

    public initRoutes(){
        this.router.get('/', this.getAllTestimonials)
        this.router.post('/', checkIfAdmin, uploadImage.single("image"), this.postTestimonial)
        this.router.delete('/', checkIfAdmin, this.deleteTestimonial)
        // this.router.put('/', checkIfAdmin, uploadImage.single("image"), this.putTestimonial)
    }

    async getAllTestimonials(req: Request, res: Response){
        try{
            const testimonials = await Testimonials.find({})
            res.send(testimonials)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async postTestimonial(req: Request, res: Response){
        try{
            // upload image to cloudinary
            const result = await cloudinary.uploader.upload(req.file.path);
                // option to compress image
                // { eager: [{ width: 400, crop: "fit" }] },
                // function (error, result) {
                // console.log(result);
                // }
                // const imageTag = result.eager[0].secure_url;

            const testimonial = await Testimonials.create({
                name: req.body.name,
                age: req.body.age,
                message: req.body.message,
                testimonialImage: result.secure_url,
                cloudinaryId: result.public_id
            })

            res.send(testimonial)
        }catch(error){
            res.status(500).send({errorMessage:error.message})
        }
    }

    async deleteTestimonial(req: Request, res: Response){
        try {
            const testimonial = await Testimonials.findByIdAndDelete({_id: req.query._id})

            if(!testimonial) res.status(404).send({errorMessage: "That testimonial was not found."})
            else res.send(testimonial)
        } catch (error) {
            res.status(500).send({errorMessage:error.message})
        }
    }

}

export default TestimonialController