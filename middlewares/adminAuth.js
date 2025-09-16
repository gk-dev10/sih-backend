import admin from "../firebase/firebaseConfig.js";
import Admin from "../models/adminModel.js";

const auth = admin.auth();
  
class AdminAuthMiddleware {
  
}

export default new AdminAuthMiddleware();