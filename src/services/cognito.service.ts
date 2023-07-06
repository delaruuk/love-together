import dotenv from 'dotenv'
import AWS from 'aws-sdk'
import crypto from 'crypto'
// import AmazonCognitoIdentity, { CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js'

dotenv.config()

// Initialize the Amazon Cognito credentials provider
AWS.config.region = process.env.POOL_REGION; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: process.env.IDENTITY_POOL_ID,
});

class CognitoService{
    private config = {
        region: 'us-east-1'
    }
    private secretHash: string = process.env.SECRET_HASH
    private clientId: string = process.env.CLIENT_ID
    private poolRegion: string = process.env.POOL_REGION
    private userPoolId: string = process.env.USER_POOL_ID
    private cognitoIdentity;

    constructor(){
        this.cognitoIdentity = new AWS.CognitoIdentityServiceProvider(this.config)
       
    }

    public async signUpUser(username: string, password: string, userAttr: Array<any>){
        const params = {
            ClientId: this.clientId,
            Password: password,
            Username: username,
            SecretHash: this.generateHash(username),
            UserAttributes: userAttr
        }
        
        try{
            const data = await this.cognitoIdentity.signUp(params).promise();
            console.log(data)
            return true
        } catch(error){
            console.log(error)
            return false
        }
    }

    public async verifyAccount(username: string, code: string): Promise<boolean> {
        const params={
            ClientId: this.clientId,
            ConfirmationCode: code,
            SecretHash: this.generateHash(username),
            Username: username
        }

        try{
            const data = await this.cognitoIdentity.confirmSignUp(params).promise();
            console.log(data)
            return true
        } catch(error){
            console.log(error)
            return false
        }
    }

    public async signInUser(username: string, password: string): Promise<boolean>{
        const params = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: this.clientId,
            AuthParameters: {
                'USERNAME': username,
                'PASSWORD': password,
                'SECRET_HASH': this.generateHash(username)
            }
        }

        try{
            const data = await this.cognitoIdentity.initiateAuth(params).promise()
            console.log("ac signin", data)
            AWS.config.credentials.sessionToken = data.AuthenticationResult.IdToken
            return true
        }catch(error){
            console.log(error)
            return false
        }
    }

    public async signOutUser(token: string, username: string): Promise<boolean> {
        const params = {
            AccessToken : token
        }

        // var userPool = new CognitoUserPool({UserPoolId: this.userPoolId, ClientId:this.clientId})
        // var cognitoUser = new CognitoUser({Username: username, Pool: userPool})

        console.log('attempting signout')
        const resp = await this.cognitoIdentity.globalSignOut(params).promise()

        console.log("anyresponse", resp)
       
        return true
    }

    private generateHash(username: string):string{
        return crypto.createHmac('SHA256', this.secretHash)
            .update(username + this.clientId).digest('base64')
    }
}

export default CognitoService