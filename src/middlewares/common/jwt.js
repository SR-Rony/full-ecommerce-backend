import jwt from "jsonwebtoken"
import CONFIG from "../../config/index.js"
export const genToken = (data) =>{
  return  jwt.sign(data, CONFIG.JWT.JWT_SECRET, { expiresIn: CONFIG?.JWT?.JWT_EXPIRED })
}