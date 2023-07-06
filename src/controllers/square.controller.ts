import crypto from 'crypto';
import dotenv from 'dotenv';
import { Users } from '../models/users';
import mongoose from 'mongoose';
import { Client, Environment, ApiError } from 'square';
import connectDB from '../config/database'
dotenv.config();

class SquareController {

  private squareClient: Client;

  constructor() {
    this.squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN!,
      environment: Environment.Sandbox,
    });
  };


  async getMongoUser(userID) {
      await connectDB();
  
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      
      const user_col = db.collection('users');

      const user = await user_col.findOne({ userId: userID });
      const userName = user.name;
      

      // console.log(userName);
      await mongoose.connection.close();
      return user;
  };
  
  // Helper functions
  async getCustomerIdFromMongoId(mongoID: string) {
    try {
      const response = await this.squareClient.customersApi.searchCustomers({
        query: {
          filter: {
            referenceId: { 
              exact: mongoID
            }
          }
        }
    });
    const customer_id = (response.result.customers[0].id);
    return customer_id;
    } catch(error) {
      console.log(error);
    }    
  };

  async getSubscriptionIdByCustomer(customerID: string) {
    try {
      const response = await this.squareClient.subscriptionsApi.searchSubscriptions({
        query: {
          filter: {
            customerIds: [
              customerID              
            ]
          }
        }
      });
      const subscription_id = (response.result.subscriptions[0].id);
      console.log(`SUBID: ${subscription_id}`)
      return subscription_id;
      } catch(error) {
        console.log(error);
      }
  };

  async getSubscriptionIdByName(subscription_name: string) {
    try {
      const response = await this.squareClient.catalogApi.listCatalog();
      
      const matchingObjects = (response.result).objects.filter(obj => obj.subscriptionPlanData.name === subscription_name);

      const ids = matchingObjects.map(obj => obj.id);
      // console.log(ids)
      return ids[0];
    } catch(error) {
      console.log(error);
    }
  };

  async subscribeToPlan(mongoID: string, plan_name: string) {
    const subscription_id = await this.getSubscriptionIdByName(plan_name);
    const customer_id = await this.getCustomerIdFromMongoId(mongoID);
    
    try {
    const response = await this.squareClient.subscriptionsApi.createSubscription({
      idempotencyKey: crypto.randomUUID(),
      locationId: 'LYXXVE9W6N253', // <--- HardCoded location ID for now
      planId: subscription_id,
      customerId: customer_id,
      cardId: 'customercardid'
    });

      console.log(response.result);
    } catch(error) {
      console.log(error);
    }
    
  };

    // Add mongo user to customerk
   async addUserToCustomers(userID) {
    const user = await this.getMongoUser(userID);

    // Get user's bday in the format square expects
    const birthObj = user.userInfo.find((obj) => obj.label === 'birth');
    const birthValue = birthObj ? birthObj.value : '';

    console.log(
      `USERNAME: ${user.name}\n\
       EMAIL: ${user.username}\n\
       ID: ${user.userId}\n\
       BDAY: ${birthValue}`);


    try {
        const response = await this.squareClient.customersApi.createCustomer({
            givenName: user.name,
            emailAddress: user.username,
            referenceId: user.userId,
            birthday: birthValue
          });

        console.log(response.result);
    } catch(error) {
        console.log(error);
    }
  };

  async addCardToCustomer(userID, cardObject) {
    const idempotencyKey = crypto.randomUUID();
    try {
      const response = await this.squareClient.cardsApi.createCard({
        idempotencyKey: idempotencyKey,
        sourceId: 'cnon:card-nonce-ok',
        // verificationToken: 'string',
        card: {
          expMonth: cardObject.expMonth,
          expYear: cardObject.expYear,
          cardholderName: cardObject.cardholderName,
          customerId: userID,
        }
      });
      console.log(response.result);
    } catch(error) {
      console.log(error);
    }
  };

  async cancelSubscriptionPlanByMongoID(mongoID) {
    const customer_id = await this.getCustomerIdFromMongoId(mongoID);
    const sub_id = await this.getSubscriptionIdByCustomer(customer_id);
    console.log(sub_id)

    try {
      const response = await this.squareClient.subscriptionsApi.cancelSubscription(sub_id);

      console.log(response.result);
    } catch(error) {
      console.log(error);
    }
  };

  // Create new sub plan
                      // prepend id with '#'            no. of weeks | amount in cents
  async createSubscriptionPlan(id: string, name: string, periods: number, amount: bigint) {
    const plan_uuid = crypto.randomUUID();
    try {
      const response = await this.squareClient.catalogApi.upsertCatalogObject({
        idempotencyKey: plan_uuid,
        object: {
          type: 'SUBSCRIPTION_PLAN',
          id: id,
          subscriptionPlanData: {
            name: name,
            phases: [
                {
                  cadence: 'MONTHLY',
                  periods: periods,
                  recurringPriceMoney: {
                      amount: amount,
                      currency: 'USD'
                    }
                }
            ]
          }
        }
  });

        console.log(response.result);
    } catch(error) {
        console.log(error);
    }
  };
};

export default SquareController
// const squareController = new SquareController();

// (async () => {
//   const test_id = 'HCCBWT6WMWCY3Y46VRRDM3ZZJG'
//   const cardObject = {
//     expMonth: 1, 
//     expYear: 24,
//     cardholderName: 'Benjamin Marshal'
//   };
//
//   await squareController.addCardToCustomer(test_id, cardObject);

  // await squareController.cancelSubscriptionPlanByMongoID(test_id);

  // await squareController.getSubscriptionIdByName("Test Plan");

  // Test addUserToCustomers method
  // await squareController.addUserToCustomers(test_id);
  
  // Test createSubscriptionPlan method
  // await squareController.createSubscriptionPlan('#1', 'Test Plan', 4, 1000);
// })();
