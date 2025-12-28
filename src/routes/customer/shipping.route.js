import express from "express";
import { authMiddleware } from "../../middlewares/index.js";
import shippingController from "../../controllers/customer/shipping.controllers.js";

const router = express.Router();

// All shipping routes require authentication
router.use(authMiddleware.customer.isCustomerAuthorized);

/**
 * @route   GET /api/customer/shipping/rates/:orderId
 * @desc    Get shipping rates for an order
 */
router.get("/rates/:orderId", shippingController.getShippingRates);

/**
 * @route   POST /api/customer/shipping/purchase/:orderId
 * @desc    Purchase shipping label with selected rate
 */
router.post("/purchase/:orderId", shippingController.purchaseShippingLabel);

/**
 * @route   GET /api/customer/shipping/track/:orderId
 * @desc    Track order shipment
 */
router.get("/track/:orderId", shippingController.trackOrder);

/**
 * @route   POST /api/customer/shipping/estimate
 * @desc    Get shipping estimate before placing order
 */
router.post("/estimate", shippingController.getShippingEstimate);

/**
 * @route   POST /api/customer/shipping/create
 * @desc    Create shipment with address and products to get shipping options
 * @body    { address, products[] }
 */
router.post("/create", shippingController.createShipping);

/**
 * @route   GET /api/customer/shipping/addresses
 * @desc    Get customer shipping addresses
 */
router.get("/addresses", shippingController.getShippingAddresses);

/**
 * @route   POST /api/customer/shipping/addresses
 * @desc    Add new shipping address
 */
router.post("/addresses", shippingController.addShippingAddress);

/**
 * @route   PUT /api/customer/shipping/addresses/:addressId
 * @desc    Update shipping address
 */
router.put("/addresses/:addressId", shippingController.updateShippingAddress);

/**
 * @route   DELETE /api/customer/shipping/addresses/:addressId
 * @desc    Delete shipping address
 */
router.delete("/addresses/:addressId", shippingController.deleteShippingAddress);

export default router;