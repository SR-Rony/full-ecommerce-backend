import {Router} from 'express'
import { customerController } from '../../controllers/customer/index.js'

const router = Router()
router.patch('/',customerController.customerShippingAddress.customerShippingAddressCreateAndUpdate)
router.get('/',customerController.customerShippingAddress.customerShippingAddressGetDetails)
router.get('/search',customerController.customerShippingAddress.customerShippingAddressSearch)
export default router
