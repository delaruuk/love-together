import * as admin from "firebase-admin"

// const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY as string);

// admin.initializeApp({
// 	credential: admin.credential.cert(serviceAccount),
// });

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.PROJECT_ID,
        privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.CLIENT_EMAIL,
    }),
    databaseURL: process.env.DATABASE_URL
});

export default admin