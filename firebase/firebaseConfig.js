import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const base64 = process.env.BASE64_SERVICE_ACCOUNT_KEY ;

if(!base64){
    throw new Error("Firebase service account sdk env is not set !");
}

const serviceAccount = JSON.parse(Buffer.from(base64,"base64").toString("utf-8"));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export default admin;