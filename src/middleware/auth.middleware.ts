import { Users } from '../models/users';
import admin from '../config/firebase-service'

// Middleware to authenticate routes: https://dev.to/emeka/securing-your-express-node-js-api-with-firebase-auth-4b5f

const getAuthToken = (req, res, next) => {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'Bearer'
    ) {
      req.authToken = req.headers.authorization.split(' ')[1];
    } else {
      req.authToken = null;
    }
    next();
};

export const checkIfAuthenticated = (req, res, next) => {
    getAuthToken(req, res, async () => {
       try {
        console.log("Checking if you are authenticated:")
         const { authToken } = req;
         const userInfo = await admin
           .auth()
           .verifyIdToken(authToken);
         req.authId = userInfo.uid;
         return next();
       } catch (e) {
         return res
           .status(401)
           .send({ errorMessage: `You are not authorized to make this request.` });
       }
     });
   };

   export const makeUserAdmin = async (req, res) =>{
      const {userId} = req.body; // userId is the firebase uid for the user

      const user = await Users.findOne({userId: userId})
      const isAdmin = user.isAdmin

      const updatedUser = await Users.findOneAndUpdate({userId: userId},{isAdmin: !isAdmin}, {new: true})
      await admin.auth().setCustomUserClaims(userId, {admin: !isAdmin});

      return res.send({message: 'Success', user: updatedUser})
   }

   export const checkIfAdmin = (req, res, next) => {
    getAuthToken(req, res, async () => {
       try {
         const { authToken } = req;
         const userInfo = await admin
           .auth()
           .verifyIdToken(authToken);
   
         if (userInfo.admin === true) {
           req.authId = userInfo.uid;
           return next();
         }
   
         throw new Error('unauthorized')
       } catch (e) {
         return res
           .status(401)
           .send({ errorMessage: 'You are not authorized to make this request' });
       }
     });
   };