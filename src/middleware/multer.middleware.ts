import {Request} from "express"
import multer, {FileFilterCallback} from "multer"
import path from "path"

// Multer config for verifying image type
export const uploadImage = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback ) => {
        let ext = path.extname(file.originalname).toLowerCase();
        if(ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" ){
            cb(new Error("File type is not supported"));
            return
        }
        cb(null, true)
    }
})

// Multer config for uploading pdf
export const uploadFile = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback ) => {
        let ext = path.extname(file.originalname).toLowerCase();
        if(ext !== ".pdf"){
            cb(new Error("File type is not supported"));
            return
        }
        cb(null, true)
    }
})

