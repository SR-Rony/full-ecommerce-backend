import { ShippingRateManager } from '../utils/easypost.js';
import Order from '../models/Order.model.js';
import CustomerShippingAddress from '../models/CustomerShippingAddress.model.js';

class ShippingService {
  constructor() {
    this.shippingManager = new ShippingRateManager();
  }

  /**
   * Get shipping rates for an order
   * @param {String} orderId - Order ID
   * @param {String} customerEmail - Customer email for verification
   * @returns {Object} Shipping rates and order details
   */
  async getShippingRatesForOrder(orderId, customerEmail) {
    try {
      // Find the order
      const order = await Order.findOne({
        orderId: orderId,
        'shipping.email': customerEmail
      }).populate('customer');

      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order is in a valid state for getting rates
      if (order.status !== 'PENDING' && order.status !== 'PAID') {
        throw new Error(`Cannot get shipping rates for order status: ${order.status}`);
      }

      // Prepare order data for shipping
      const orderData = {
        orderId: order.orderId,
        address: {
          street: order.shipping.address.street,
          streetNumber: order.shipping.address.streetNumber,
          streetName: order.shipping.address.streetName,
          city: order.shipping.address.city,
          state: order.shipping.address.state,
          zip: order.shipping.address.zip || order.shipping.address.zipCode,
          country: order.shipping.address.country,
          email: order.shipping.email,
          phone: order.shipping.phone || order.shipping.phoneNum,
          receiverName: order.shipping.address.receiverName
        },
        products: order.products.map(p => ({
          sku: p.sku,
          name: p.name,
          quantity: p.quantity,
          weight: p.weight || 1, // Default weight in pounds
          length: p.length || 12,
          width: p.width || 9,
          height: p.height || 3
        }))
      };

      // Get shipping rates from EasyPost
      const shippingData = await this.shippingManager.getShippingRates(orderData);

      // Update order with shipment details
      order.shipping.shipmentId = shippingData.shipmentId;
      order.shipping.availableRates = shippingData.rates;
      await order.save();

      return {
        orderId: order.orderId,
        shipmentId: shippingData.shipmentId,
        rates: shippingData.rates,
        orderTotal: order.orderSummary.totalAmount,
        currency: 'USD'
      };
    } catch (error) {
      console.error('Error getting shipping rates:', error);

      // Handle network timeout errors specifically
      if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
        throw new Error('Unable to connect to shipping service. Please try again later.');
      }

      throw error;
    }
  }

  /**
   * Purchase shipping label for an order
   * @param {String} orderId - Order ID
   * @param {String} rateId - Selected shipping rate ID
   * @param {String} customerEmail - Customer email for verification
   * @returns {Object} Purchased label details
   */
  async purchaseShippingLabel(orderId, rateId, customerEmail) {
    try {
      // Find and verify order
      const order = await Order.findOne({
        orderId: orderId,
        'shipping.email': customerEmail
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order has shipment ID
      if (!order.shipping.shipmentId) {
        throw new Error('No shipment found for this order. Please get shipping rates first.');
      }

      // Check if order is paid
      if (order.payment.status !== 'confirmed' && order.payment.status !== 'finished' && !order.payment.isPaymentCompleted) {
        throw new Error('Order must be paid before purchasing shipping label');
      }

      // Check if shipping is already purchased
      if (order.shipping.labelUrl) {
        throw new Error('Shipping label already purchased for this order');
      }

      // Purchase the shipping label
      const labelData = await this.shippingManager.purchaseShippingLabel(
        order.shipping.shipmentId,
        rateId
      );

      // Update order with label details
      order.shipping.trackingCode = labelData.trackingCode;
      order.shipping.trackingUrl = labelData.trackingUrl;
      order.shipping.labelUrl = labelData.labelUrl;
      order.shipping.labelData = labelData.labelData;
      order.shipping.carrier = labelData.carrier;
      order.shipping.service = labelData.service;
      order.shipping.shippingCost = labelData.rate;
      order.shipping.shippedAt = new Date();

      // Find selected rate from available rates
      const selectedRate = order.shipping.availableRates.find(r => r.id === rateId);
      if (selectedRate) {
        order.shipping.selectedRate = selectedRate;
      }

      // Update order status
      order.status = 'PACKED';

      // Add tracking number to tracking numbers array
      if (labelData.trackingCode && !order.shipping.trackingNumbers.includes(labelData.trackingCode)) {
        order.shipping.trackingNumbers.push(labelData.trackingCode);
      }

      await order.save();

      return {
        orderId: order.orderId,
        trackingCode: labelData.trackingCode,
        trackingUrl: labelData.trackingUrl,
        labelUrl: labelData.labelUrl,
        carrier: labelData.carrier,
        service: labelData.service,
        shippingCost: labelData.rate,
        orderStatus: order.status
      };
    } catch (error) {
      console.error('Error purchasing shipping label:', error);

      // Handle network timeout errors specifically
      if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
        throw new Error('Unable to connect to shipping service. Please try again later.');
      }

      throw error;
    }
  }

  /**
   * Track shipment for an order
   * @param {String} orderId - Order ID
   * @param {String} customerEmail - Customer email for verification
   * @returns {Object} Tracking details
   */
  async trackOrderShipment(orderId, customerEmail) {
    try {
      // Find and verify order
      const order = await Order.findOne({
        orderId: orderId,
        'shipping.email': customerEmail
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order has tracking code
      if (!order.shipping.trackingCode) {
        throw new Error('No tracking code available for this order');
      }

      // Get tracking details from EasyPost
      const trackingData = await this.shippingManager.trackShipment(
        order.shipping.trackingCode,
        order.shipping.carrier
      );

      // Update order with latest tracking details
      order.shipping.trackingStatus = trackingData.status;
      order.shipping.trackingDetails = trackingData.trackingDetails;

      // Update order status if delivered
      if (trackingData.status === 'delivered' && order.status !== 'DELIVERED') {
        order.status = 'DELIVERED';
        order.shipping.deliveredAt = new Date();
      }

      await order.save();

      return {
        orderId: order.orderId,
        orderStatus: order.status,
        trackingCode: order.shipping.trackingCode,
        trackingStatus: order.shipping.trackingStatus,
        trackingDetails: order.shipping.trackingDetails,
        carrier: order.shipping.carrier,
        service: order.shipping.service,
        shippedAt: order.shipping.shippedAt,
        deliveredAt: order.shipping.deliveredAt
      };
    } catch (error) {
      console.error('Error tracking shipment:', error);

      // Handle network timeout errors specifically
      if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
        throw new Error('Unable to connect to shipping service. Please try again later.');
      }

      throw error;
    }
  }

  /**
   * Get shipping estimate without creating a shipment
   * @param {Object} addressData - Shipping address
   * @param {Array} products - Product list
   * @returns {Object} Estimated shipping rates
   */
  async getShippingEstimate(addressData, products) {
    try {
      // Create temporary order data for estimation
      const tempOrderData = {
        orderId: 'ESTIMATE',
        address: addressData,
        products: products.map(p => ({
          sku: p.sku || 'unknown',
          name: p.name || 'Product',
          quantity: p.quantity || 1,
          weight: p.weight || 1,
          length: p.length || 12,
          width: p.width || 9,
          height: p.height || 3
        }))
      };

      // Get shipping rates
      const shippingData = await this.shippingManager.getShippingRates(tempOrderData);

      // Return only the rates (no shipment creation)
      return {
        rates: shippingData.rates,
        estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      };
    } catch (error) {
      console.error('Error getting shipping estimate:', error);

      // Handle network timeout errors specifically
      if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
        throw new Error('Unable to connect to shipping service. Please try again later.');
      }

      throw error;
    }
  }

  /**
   * Create shipment with address and get shipping options
   * @param {String} customerEmail - Customer email
   * @param {String} customerId - Customer ID
   * @param {Object} options - Shipping options including address and products
   * @returns {Object} Shipping data with rates
   */
  async createShippingWithAddress(customerEmail, customerId, { address, products } = {}) {
    try {
      if (!products || products.length === 0) {
        throw new Error('Products are required for shipping rates');
      }

      if (!address) {
        throw new Error('Address is required');
      }

      // Use the provided address with customer info
      const shippingAddress = {
        ...address,
        email: customerEmail
      };

      // Create a temporary order data for shipping rates
      const orderData = {
        orderId: 'TEMP_' + Date.now(), // Temporary ID for EasyPost
        address: shippingAddress,
        products: products.map(p => ({
          sku: p.sku || 'unknown',
          name: p.name || 'Product',
          quantity: p.quantity || 1,
          weight: p.weight || 1, // Default weight in pounds
          length: p.length || 12,
          width: p.width || 9,
          height: p.height || 3
        }))
      };

      // Get shipping rates from EasyPost
      const shippingData = await this.shippingManager.getShippingRates(orderData);

      return {
        shipmentId: shippingData.shipmentId,
        rates: shippingData.rates,
        address: shippingAddress,
        products: products,
        currency: 'USD'
      };
    } catch (error) {
      console.error('Error creating shipping with address:', error);

      // Handle network timeout errors specifically
      if (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH') {
        throw new Error('Unable to connect to shipping service. Please try again later.');
      }

      // Re-throw the original error for other cases
      throw error;
    }
  }

  /**
   * Get available shipping addresses for a customer
   * @param {String} customerId - Customer ID
   * @returns {Array} List of shipping addresses
   */
  async getCustomerShippingAddresses(customerId) {
    try {
      const addresses = await CustomerShippingAddress.find({
        customer: customerId,
        deleted: false
      }).sort({ isDefault: -1, createdAt: -1 });

      return addresses;
    } catch (error) {
      console.error('Error getting customer shipping addresses:', error);
      throw error;
    }
  }

  /**
   * Add new shipping address for a customer
   * @param {String} customerId - Customer ID
   * @param {Object} addressData - Address details
   * @returns {Object} Created address
   */
  async addCustomerShippingAddress(customerId, addressData) {
    try {
      // If this is set as default, unset other default addresses
      if (addressData.isDefault) {
        await CustomerShippingAddress.updateMany(
          { customer: customerId },
          { isDefault: false }
        );
      }

      const address = new CustomerShippingAddress({
        customer: customerId,
        ...addressData
      });

      await address.save();
      return address;
    } catch (error) {
      console.error('Error adding customer shipping address:', error);
      throw error;
    }
  }

  /**
   * Update shipping address
   * @param {String} addressId - Address ID
   * @param {String} customerId - Customer ID (for ownership check)
   * @param {Object} updateData - Address updates
   * @returns {Object} Updated address
   */
  async updateCustomerShippingAddress(addressId, customerId, updateData) {
    try {
      const address = await CustomerShippingAddress.findOne({
        _id: addressId,
        customer: customerId,
        deleted: false
      });

      if (!address) {
        throw new Error('Address not found');
      }

      // If setting as default, unset others
      if (updateData.isDefault) {
        await CustomerShippingAddress.updateMany(
          {
            customer: customerId,
            _id: { $ne: addressId }
          },
          { isDefault: false }
        );
      }

      Object.assign(address, updateData);
      await address.save();

      return address;
    } catch (error) {
      console.error('Error updating customer shipping address:', error);
      throw error;
    }
  }

  /**
   * Delete shipping address (soft delete)
   * @param {String} addressId - Address ID
   * @param {String} customerId - Customer ID
   * @returns {Boolean} Success status
   */
  async deleteCustomerShippingAddress(addressId, customerId) {
    try {
      const address = await CustomerShippingAddress.findOneAndUpdate(
        {
          _id: addressId,
          customer: customerId
        },
        { deleted: true }
      );

      if (!address) {
        throw new Error('Address not found');
      }

      return true;
    } catch (error) {
      console.error('Error deleting customer shipping address:', error);
      throw error;
    }
  }
}

export default new ShippingService();