import express, {Request, Response} from 'express'
import { AdminInfo } from '../models/adminInfo'
import cloudinary from '../middleware/cloudinary.middleware'
import {uploadFile} from "../middleware/multer.middleware"
import { checkIfAdmin } from '../middleware/auth.middleware'
import { UploadApiResponse } from 'cloudinary'

class AdminInfoController{
    public path = '/adminInfo'
    public router = express.Router()

    constructor(){
        this.initRoutes()
    }

    public initRoutes(){
        this.router.get('/name', this.getByName)

        // Admin Endpoints
        this.router.post('/', checkIfAdmin, uploadFile.single("file"), this.postAdminInfo)
        this.router.get('/', checkIfAdmin, this.getAdminInfo),
        this.router.put('/', checkIfAdmin, uploadFile.single("file"), this.changeAdminInfo)
    }

    async getByName(req:Request, res:Response){
        try{
            const adminInfo = await AdminInfo.findOne({name:req.query.name})

            res.send(adminInfo)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async getAdminInfo(req: Request, res: Response){
        try{
            const adminInfo = await AdminInfo.find({})
            res.send(adminInfo)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async postAdminInfo(req: Request, res: Response){
        try{
            let adminInfo
            if(req.file){
                let uploadedFile: UploadApiResponse
                try{
                    uploadedFile = await cloudinary.uploader.upload(req.file.path,{
                        folder: "Love_Together_Files",
                        resource_type: "auto"
                    });
    
                } catch(error){
                    res.status(404).send({errorMessage:error.message})
                }
    
                adminInfo = await AdminInfo.create({
                    name: req.body.name,
                    description:req.body.description,
                    value: req.body.value,
                    filename: req.file.originalname,
                    sizeInBytes: uploadedFile.bytes,
                    format: uploadedFile.format,
                    fileUrl: uploadedFile.secure_url,
                    cloudinaryId: uploadedFile.public_id
                })
            } else{
                adminInfo = await AdminInfo.create({
                    name: req.body.name,
                    description:req.body.description,
                    value: req.body.value,
                })
            }

            res.send(adminInfo)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

    async changeAdminInfo(req: Request, res: Response){
        try{
            let adminInfo
            if(req.file){
                let uploadedFile: UploadApiResponse
                try{
                    uploadedFile = await cloudinary.uploader.upload(req.file.path,{
                        folder: "Love_Together_Files",
                        resource_type: "auto"
                    });
    
                } catch(error){
                    res.status(404).send({errorMessage:error.message})
                }
    
                adminInfo = await AdminInfo.findOneAndUpdate({name: req.body.name}, {
                    name: req.body.name,
                    description:req.body.description,
                    value: req.body.value,
                    filename: req.file.originalname,
                    sizeInBytes: uploadedFile.bytes,
                    format: uploadedFile.format,
                    fileUrl: uploadedFile.secure_url,
                    cloudinaryId: uploadedFile.public_id
                })
            } else{
                adminInfo = await AdminInfo.findOneAndUpdate({name: req.body.name}, {
                    name: req.body.name,
                    description:req.body.description,
                    value: req.body.value,
                })
            }
            
            if(!adminInfo) return res.status(404).send({errorMessage: "Requested adminInfo could not be found."})
            res.send(adminInfo)
        }catch(error){
            res.status(500).json({errorMessage: error.message})
        }
    }

}

export default AdminInfoController