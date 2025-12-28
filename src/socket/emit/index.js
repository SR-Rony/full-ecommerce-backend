import { toParseObject } from "../../utils/index.js"
import { constantEmit } from "./constantEmit.js"

export const socketEmit = {
    order:{
        orderCreate:(io, data) =>{
            io.emit(constantEmit.order.orderCreate,toParseObject(data))
        }
    }
}