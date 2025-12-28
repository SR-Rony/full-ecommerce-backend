import EasyPost from '@easypost/api';
import config from '../config/index.js';
import Order from '../models/Order.model.js';

const easyPostClient = new EasyPost(config.EASYPOST.API_KEY);

class ShippingRateManager {
  constructor() {
    this.easyPostClient = easyPostClient;
  }

  /**
   * Create shipment and get rates from EasyPost
   * @param {Object} orderData - Order data
   * @returns {Object} Shipment with available rates
   */
  async getShippingRates(orderData) {
    try {
      // If test mode is enabled, return mock rates
      if (config.EASYPOST.TEST_MODE) {
        return this.getMockShippingRates(orderData);
      }

      const { address, products } = orderData;

      // Get product weights and dimensions
      const parcels = await this.createParcelsFromProducts(products);

      // Create sender address (your business address)
      const fromAddress = await this.getSenderAddress();

      // Create recipient address
      const toAddress = await this.easyPostClient.Address.create({
        street1: address.street || `${address.streetNumber || ''} ${address.streetName || ''}`.trim() || 'N/A',
        city: address.city,
        state: address.state,
        zip: address.zip || address.zipCode,
        country: address.country?.value || address.country,
        name: address.receiverName?.fullName || `${address.receiverName?.firstName || ''} ${address.receiverName?.lastName || ''}`.trim() || 'Customer',
        email: address.email,
        phone: address.phone || address.phoneNum
      });

      // Create shipment
      const shipment = await this.easyPostClient.Shipment.create({
        from_address: fromAddress,
        to_address: toAddress,
        parcels: parcels,
        options: {
          label_format: 'PDF',
          print_custom_1: `Order #${orderData.orderId}`
        }
      });

      // Filter and sort rates
      const filteredRates = this.filterRates(shipment.rates);

      return {
        shipmentId: shipment.id,
        rates: filteredRates,
        postage_label: shipment.postage_label,
        tracking_code: shipment.tracking_code
      };
    } catch (error) {
      console.error('Error getting shipping rates:', error);

      // If EasyPost fails and test mode is not enabled, try to return mock rates as fallback
      if (!config.EASYPOST.TEST_MODE) {
        console.log('EasyPost unavailable, returning mock rates as fallback');
        return this.getMockShippingRates(orderData);
      }

      throw error;
    }
  }

  /**
   * Create parcels from product data
   * @param {Array} products - Product list
   * @returns {Array} Parcels array
   */
  async createParcelsFromProducts(products) {
    // Default dimensions in inches
    const DEFAULT_DIMENSIONS = {
      length: 12,
      width: 9,
      height: 3,
      weight: 16 // 1 lb default
    };

    // Calculate total weight and create one parcel
    let totalWeight = 0;
    let maxDimensions = { length: 0, width: 0, height: 0 };

    for (const product of products) {
      const productWeight = (product.weight || DEFAULT_DIMENSIONS.weight) * (product.quantity || 1);
      totalWeight += productWeight;

      // Use maximum dimensions
      maxDimensions.length = Math.max(maxDimensions.length, product.length || DEFAULT_DIMENSIONS.length);
      maxDimensions.width = Math.max(maxDimensions.width, product.width || DEFAULT_DIMENSIONS.width);
      maxDimensions.height = Math.max(maxDimensions.height, product.height || DEFAULT_DIMENSIONS.height);
    }

    // Convert to ounces if weight is in pounds
    const weightInOunces = totalWeight;

    return [{
      length: maxDimensions.length,
      width: maxDimensions.width,
      height: maxDimensions.height,
      weight: Math.round(weightInOunces * 16) // Convert to ounces for EasyPost
    }];
  }

  /**
   * Get sender address from config or database
   * @returns {Object} Sender address
   */
  async getSenderAddress() {
    // Use config values with defaults
    return {
      street1: config.EASYPOST.SENDER_ADDRESS.street || '123 Business St',
      city: config.EASYPOST.SENDER_ADDRESS.city || 'New York',
      state: config.EASYPOST.SENDER_ADDRESS.state || 'NY',
      zip: config.EASYPOST.SENDER_ADDRESS.zip || '10001',
      country: config.EASYPOST.SENDER_ADDRESS.country || 'US',
      name: config.EASYPOST.SENDER_ADDRESS.name || 'Hammer & Bell',
      email: config.EASYPOST.SENDER_ADDRESS.email || 'support@hammerandbell.com',
      phone: config.EASYPOST.SENDER_ADDRESS.phone || '555-123-4567'
    };
  }

  /**
   * Get mock shipping rates for testing/fallback
   * @param {Object} orderData - Order data
   * @returns {Object} Mock shipping rates
   */
  getMockShippingRates(orderData) {
    const { orderId } = orderData;

    // Generate mock rates
    const mockRates = [
      {
        id: 'rate_usps_ground',
        service: 'Ground Advantage',
        carrier: 'USPS',
        rate: 8.50,
        currency: 'USD',
        delivery_days: 3,
        delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        delivery_date_guaranteed: false,
        estimated_delivery_date: '3-5 business days',
        shipping_amount: 8.50,
        carrier_account_id: 'mock_ca_usps'
      },
      {
        id: 'rate_usps_priority',
        service: 'Priority Mail',
        carrier: 'USPS',
        rate: 12.75,
        currency: 'USD',
        delivery_days: 2,
        delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        delivery_date_guaranteed: false,
        estimated_delivery_date: '2-3 business days',
        shipping_amount: 12.75,
        carrier_account_id: 'mock_ca_usps'
      },
      {
        id: 'rate_ups_ground',
        service: 'Ground',
        carrier: 'UPS',
        rate: 14.25,
        currency: 'USD',
        delivery_days: 2,
        delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        delivery_date_guaranteed: false,
        estimated_delivery_date: '2-4 business days',
        shipping_amount: 14.25,
        carrier_account_id: 'mock_ca_ups'
      },
      {
        id: 'rate_fedex_2day',
        service: '2-Day',
        carrier: 'FedEx',
        rate: 24.99,
        currency: 'USD',
        delivery_days: 2,
        delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        delivery_date_guaranteed: true,
        estimated_delivery_date: '2 business days',
        shipping_amount: 24.99,
        carrier_account_id: 'mock_ca_fedex'
      },
      {
        id: 'rate_fedex_overnight',
        service: 'Overnight',
        carrier: 'FedEx',
        rate: 45.00,
        currency: 'USD',
        delivery_days: 1,
        delivery_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        delivery_date_guaranteed: true,
        estimated_delivery_date: 'Next business day',
        shipping_amount: 45.00,
        carrier_account_id: 'mock_ca_fedex'
      }
    ];

    return {
      shipmentId: `mock_shipment_${orderId}`,
      rates: mockRates,
      postage_label: null,
      tracking_code: null,
      isMock: true
    };
  }

  /**
   * Filter and sort shipping rates
   * @param {Array} rates - Raw rates from EasyPost
   * @returns {Array} Filtered and sorted rates
   */
  filterRates(rates) {
    // Filter out unwanted carriers and sort by price
    const filtered = rates
      .filter(rate => {
        // Include major carriers
        const allowedCarriers = ['USPS', 'UPS', 'FedEx', 'DHL'];
        return allowedCarriers.includes(rate.carrier);
      })
      .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));

    return filtered.map(rate => ({
      id: rate.id,
      service: rate.service,
      carrier: rate.carrier,
      rate: parseFloat(rate.rate),
      currency: rate.currency,
      delivery_days: rate.delivery_days,
      delivery_date: rate.delivery_date,
      delivery_date_guaranteed: rate.delivery_date_guaranteed,
      estimated_delivery_date: rate.est_delivery_days,
      shipping_amount: rate.rate,
      carrier_account_id: rate.carrier_account_id
    }));
  }

  /**
   * Purchase shipping label with selected rate
   * @param {String} shipmentId - EasyPost shipment ID
   * @param {String} rateId - Selected rate ID
   * @returns {Object} Purchased shipment with label
   */
  async purchaseShippingLabel(shipmentId, rateId) {
    try {
      const shipment = await this.easyPostClient.Shipment.retrieve(shipmentId);

      // Purchase the selected rate
      await shipment.buy(rateId);

      return {
        shipmentId: shipment.id,
        trackingCode: shipment.tracking_code,
        trackingUrl: shipment.tracking_url,
        labelUrl: shipment.postage_label.label_url,
        labelData: shipment.postage_label.label_pdf_base64,
        carrier: shipment.selected_rate.carrier,
        service: shipment.selected_rate.service,
        rate: parseFloat(shipment.selected_rate.rate),
        fees: shipment.fees
      };
    } catch (error) {
      console.error('Error purchasing shipping label:', error);
      throw error;
    }
  }

  /**
   * Track shipment
   * @param {String} trackingCode - Tracking number
   * @param {String} carrier - Carrier name
   * @returns {Object} Tracking details
   */
  async trackShipment(trackingCode, carrier = null) {
    try {
      const tracker = await this.easyPostClient.Tracker.create({
        tracking_code: trackingCode,
        carrier: carrier
      });

      return {
        trackingCode: tracker.tracking_code,
        status: tracker.status,
        status_detail: tracker.status_detail,
        trackingDetails: tracker.tracking_details,
        carrier: tracker.carrier,
        created_at: tracker.created_at,
        updated_at: tracker.updated_at
      };
    } catch (error) {
      console.error('Error tracking shipment:', error);
      throw error;
    }
  }
}

class EasyPostWebhookManager {
  /**
   * Process webhook from EasyPost
   * @param {Object} webhookData - Webhook payload
   * @param {String} signature - Webhook signature
   * @returns {Object} Processed result
   */
  async processWebhook(webhookData, signature) {
    try {
      // Verify webhook signature (if configured)
      if (config.EASYPOST.WEBHOOK_SECRET) {
        const crypto = require('crypto');
        const calculatedSignature = crypto
          .createHmac('sha256', config.EASYPOST.WEBHOOK_SECRET)
          .update(JSON.stringify(webhookData))
          .digest('hex');

        if (calculatedSignature !== signature) {
          throw new Error('Invalid webhook signature');
        }
      }

      const { type, result } = webhookData;

      switch (type) {
        case 'tracker.updated':
          return await this.handleTrackingUpdate(result);
        case 'shipment.updated':
          return await this.handleShipmentUpdate(result);
        case 'batch.updated':
          return await this.handleBatchUpdate(result);
        default:
          console.log('Unhandled webhook type:', type);
          return { status: 'ignored', type };
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Handle tracking update webhook
   * @param {Object} trackerData - Tracker data
   * @returns {Object} Update result
   */
  async handleTrackingUpdate(trackerData) {
    const { tracking_code, status, status_detail, tracking_details } = trackerData;

    // Find order by tracking code
    const order = await Order.findOne({ 'shipping.trackingCode': tracking_code });
    if (!order) {
      console.log('No order found for tracking code:', tracking_code);
      return { status: 'no_order_found', tracking_code };
    }

    // Update order tracking status
    order.shipping.trackingStatus = status;
    order.shipping.trackingDetails = tracking_details;

    // Update order status based on tracking
    if (status === 'delivered') {
      order.status = 'DELIVERED';
      order.shipping.deliveredAt = new Date();
    }

    await order.save();

    return {
      status: 'updated',
      orderId: order._id,
      trackingCode: tracking_code,
      orderStatus: order.status
    };
  }

  /**
   * Handle shipment update webhook
   * @param {Object} shipmentData - Shipment data
   * @returns {Object} Update result
   */
  async handleShipmentUpdate(shipmentData) {
    // Handle shipment updates if needed
    console.log('Shipment update:', shipmentData.id);
    return { status: 'received', shipmentId: shipmentData.id };
  }

  /**
   * Handle batch update webhook
   * @param {Object} batchData - Batch data
   * @returns {Object} Update result
   */
  async handleBatchUpdate(batchData) {
    // Handle batch updates if needed
    console.log('Batch update:', batchData.id);
    return { status: 'received', batchId: batchData.id };
  }
}

export {
  ShippingRateManager,
  EasyPostWebhookManager
};