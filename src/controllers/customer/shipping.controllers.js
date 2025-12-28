import shippingService from '../../services/shippingService.js';
import { logger } from "../../utils/logger.js";

class ShippingController {
  /**
   * Get shipping rates for an order
   */
  async getShippingRates(req, res) {
    try {
      const { orderId } = req.params;
      const customerEmail = req.customer.email; // Get from authenticated user

      const shippingData = await shippingService.getShippingRatesForOrder(orderId, customerEmail);

      res.status(200).json({
        success: true,
        message: 'Shipping rates retrieved successfully',
        data: shippingData
      });
    } catch (error) {
      logger.error('Error getting shipping rates:', error, {
        orderId: req.params.orderId,
        email: req.customer.email
      });

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get shipping rates'
      });
    }
  }

  /**
   * Purchase shipping label
   */
  async purchaseShippingLabel(req, res) {
    try {
      const { orderId } = req.params;
      const { rateId } = req.body;
      const customerEmail = req.customer.email;

      if (!rateId) {
        return res.status(400).json({
          success: false,
          message: 'Rate ID is required'
        });
      }

      const labelData = await shippingService.purchaseShippingLabel(orderId, rateId, customerEmail);

      res.status(200).json({
        success: true,
        message: 'Shipping label purchased successfully',
        data: labelData
      });
    } catch (error) {
      logger.error('Error purchasing shipping label:', error, {
        orderId: req.params.orderId,
        rateId: req.body.rateId,
        email: req.customer.email
      });

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to purchase shipping label'
      });
    }
  }

  /**
   * Track order shipment
   */
  async trackOrder(req, res) {
    try {
      const { orderId } = req.params;
      const customerEmail = req.customer.email;

      const trackingData = await shippingService.trackOrderShipment(orderId, customerEmail);

      res.status(200).json({
        success: true,
        message: 'Shipment tracking retrieved successfully',
        data: trackingData
      });
    } catch (error) {
      logger.error('Error tracking shipment:', error, {
        orderId: req.params.orderId,
        email: req.customer.email
      });

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to track shipment'
      });
    }
  }

  /**
   * Create shipment with address and get shipping options
   */
  async createShipping(req, res) {
    try {
      const { address, products } = req.body;
      const customerEmail = req.customer.email;
      const customerId = req.customer._id;

      // Address is required
      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Address is required'
        });
      }

      const shippingData = await shippingService.createShippingWithAddress(
        customerEmail,
        customerId,
        { address, products }
      );

      res.status(200).json({
        success: true,
        message: 'Shipping options retrieved successfully',
        data: shippingData
      });
    } catch (error) {
      logger.error('Error creating shipping:', error, {
        email: req.customer.email
      });

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create shipping'
      });
    }
  }

  /**
   * Get shipping estimate (before placing order)
   */
  async getShippingEstimate(req, res) {
    try {
      const { address, products } = req.body;

      if (!address || !products || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Address and products are required for shipping estimate'
        });
      }

      const estimate = await shippingService.getShippingEstimate(address, products);

      res.status(200).json({
        success: true,
        message: 'Shipping estimate retrieved successfully',
        data: estimate
      });
    } catch (error) {
      logger.error('Error getting shipping estimate:', error, {
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get shipping estimate'
      });
    }
  }

  /**
   * Get customer shipping addresses
   */
  async getShippingAddresses(req, res) {
    try {
      const customerId = req.customer._id;

      const addresses = await shippingService.getCustomerShippingAddresses(customerId);

      res.status(200).json({
        success: true,
        message: 'Shipping addresses retrieved successfully',
        data: addresses
      });
    } catch (error) {
      logger.error('Error getting shipping addresses:', error, {
        customerId: req.customer._id
      });

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get shipping addresses'
      });
    }
  }

  /**
   * Add new shipping address
   */
  async addShippingAddress(req, res) {
    try {
      const customerId = req.customer._id;
      const addressData = req.body;

      const address = await shippingService.addCustomerShippingAddress(customerId, addressData);

      res.status(201).json({
        success: true,
        message: 'Shipping address added successfully',
        data: address
      });
    } catch (error) {
      logger.error('Error adding shipping address:', error, {
        customerId: req.customer._id,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to add shipping address'
      });
    }
  }

  /**
   * Update shipping address
   */
  async updateShippingAddress(req, res) {
    try {
      const { addressId } = req.params;
      const customerId = req.customer._id;
      const updateData = req.body;

      const address = await shippingService.updateCustomerShippingAddress(addressId, customerId, updateData);

      res.status(200).json({
        success: true,
        message: 'Shipping address updated successfully',
        data: address
      });
    } catch (error) {
      logger.error('Error updating shipping address:', error, {
        addressId: req.params.addressId,
        customerId: req.customer._id,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update shipping address'
      });
    }
  }

  /**
   * Delete shipping address
   */
  async deleteShippingAddress(req, res) {
    try {
      const { addressId } = req.params;
      const customerId = req.customer._id;

      await shippingService.deleteCustomerShippingAddress(addressId, customerId);

      res.status(200).json({
        success: true,
        message: 'Shipping address deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting shipping address:', error, {
        addressId: req.params.addressId,
        customerId: req.customer._id
      });

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete shipping address'
      });
    }
  }
}

export default new ShippingController();