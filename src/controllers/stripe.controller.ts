import express, {Request, Response} from 'express'
import { checkIfAuthenticated } from '../middleware/auth.middleware';
import Stripe from "stripe"
import { Users } from '../models/users';
import { AdminInfo } from '../models/adminInfo';

const stripe = new Stripe(process.env.STRIPE_SECRET, {apiVersion:'2022-11-15'});

class StripeController{
    public path = '/stripe'
    public router = express.Router()

    constructor(){
        this.initRoutes()
    }

    public initRoutes(){
        this.router.post('/create-checkout-session', checkIfAuthenticated, this.createCheckoutSession)
        this.router.put('/checkoutSession', checkIfAuthenticated, this.successCheckoutSession)
    }

    async createCheckoutSession(req: Request, res: Response) {
        let price = await AdminInfo.findOne({name: "Premium Price"})
        const total = 100
        const line_items = [{
            price_data: {
              currency: "usd",
              product_data: {
                name: "Love Together",
                description: "Package"
              },
              unit_amount: Number(price.value),
            },
            quantity: 1
          }]
    
        const session = await stripe.checkout.sessions.create({
          allow_promotion_codes: true,
          payment_method_types: ["card"],
          line_items,
          mode: "payment",
          success_url: `${process.env.URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.URL}/profile`,
        });
        res.send({ url: session.url });
      }

      async successCheckoutSession(req: Request, res: Response){
        try{
          const session = await stripe.checkout.sessions.retrieve(req.query.id as string)

          if(session.payment_status === "paid"){
            const user = await Users.findOneAndUpdate({userId: req.query.userId},{
              subscriptionStatus: "Premium"
            }, {new: true})
            
            res.json({user: user, sessionInfo: session})
          }

        }catch(error){
          res.status(500).json({errorMessage: error.message})
        }
      }

}

export default StripeController