# EasyPost Shipping Integration - Customer Backend

This document explains the EasyPost shipping functionality that has been implemented in the customer backend.

## Overview

The EasyPost integration allows customers to:
- Get real-time shipping rates for their orders
- Purchase shipping labels with selected rates
- Track their shipments
- Manage shipping addresses

## API Endpoints

### 1. Get Shipping Rates
```
GET /api/v1.0/customers/shipping/rates/:orderId
```
Retrieves available shipping rates for an order.

**Requirements:**
- Customer must be authenticated
- Order must belong to the customer
- Order status must be PENDING or PAID

**Response:**
```json
{
  "success": true,
  "message": "Shipping rates retrieved successfully",
  "data": {
    "orderId": "ORD123456",
    "shipmentId": "shp_1234567890",
    "rates": [
      {
        "id": "rate_123",
        "service": "Priority Mail",
        "carrier": "USPS",
        "rate": 12.50,
        "currency": "USD",
        "delivery_days": 2,
        "delivery_date": "2025-01-10T00:00:00.000Z"
      }
    ],
    "orderTotal": 125.00,
    "currency": "USD"
  }
}
```

### 2. Purchase Shipping Label
```
POST /api/v1.0/customers/shipping/purchase/:orderId
```
Purchases a shipping label with the selected rate.

**Body:**
```json
{
  "rateId": "rate_123"
}
```

**Requirements:**
- Customer must be authenticated
- Order must be paid
- Shipping rates must have been retrieved first

**Response:**
```json
{
  "success": true,
  "message": "Shipping label purchased successfully",
  "data": {
    "orderId": "ORD123456",
    "trackingCode": "9400111109548712345678",
    "trackingUrl": "https://tools.usps.com/track/9400111109548712345678",
    "labelUrl": "https://easypost-files.s3.amazonaws.com/label.pdf",
    "carrier": "USPS",
    "service": "Priority Mail",
    "shippingCost": 12.50,
    "orderStatus": "PACKED"
  }
}
```

### 3. Track Shipment
```
GET /api/v1.0/customers/shipping/track/:orderId
```
Retrieves tracking information for an order.

**Requirements:**
- Customer must be authenticated
- Order must have a tracking code

**Response:**
```json
{
  "success": true,
  "message": "Shipment tracking retrieved successfully",
  "data": {
    "orderId": "ORD123456",
    "orderStatus": "DELIVERED",
    "trackingCode": "9400111109548712345678",
    "trackingStatus": "delivered",
    "trackingDetails": [...],
    "carrier": "USPS",
    "service": "Priority Mail",
    "shippedAt": "2025-01-08T10:30:00.000Z",
    "deliveredAt": "2025-01-10T14:15:00.000Z"
  }
}
```

### 4. Get Shipping Estimate
```
POST /api/v1.0/customers/shipping/estimate
```
Get shipping estimate before placing an order.

**Body:**
```json
{
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US",
    "email": "customer@example.com",
    "phone": "555-123-4567",
    "receiverName": "John Doe"
  },
  "products": [
    {
      "sku": "PROD123",
      "name": "Product Name",
      "quantity": 2,
      "weight": 1.5,
      "length": 12,
      "width": 9,
      "height": 3
    }
  ]
}
```

### 5. Shipping Address Management

#### Get Shipping Addresses
```
GET /api/v1.0/customers/shipping/addresses
```

#### Add Shipping Address
```
POST /api/v1.0/customers/shipping/addresses
```

#### Update Shipping Address
```
PUT /api/v1.0/customers/shipping/addresses/:addressId
```

#### Delete Shipping Address
```
DELETE /api/v1.0/customers/shipping/addresses/:addressId
```

## Database Schema Updates

The Order model has been updated to include the following shipping fields:

```javascript
shipping: {
  // Existing fields...
  street: String,
  phone: String,

  // EasyPost fields
  shipmentId: String,
  trackingCode: String,
  trackingUrl: String,
  trackingStatus: String,
  trackingDetails: [Object],
  carrier: String,
  service: String,
  labelUrl: String,
  labelData: String,
  shippingCost: Number,
  availableRates: [Object],
  selectedRate: Object,
  shippedAt: Date,
  deliveredAt: Date,
  autoProcessed: Boolean,
  batchId: String
}
```

## Environment Variables

Add the following to your `.env` file:

```env
#EASYPOST CONFIGURATION
EASYPOST_API_KEY=your_easypost_api_key_here
EASYPOST_WEBHOOK_SECRET=your_webhook_secret_here

#SENDER ADDRESS
SENDER_ADDRESS_STREET=123 Business St
SENDER_ADDRESS_CITY=New York
SENDER_ADDRESS_STATE=NY
SENDER_ADDRESS_ZIP=10001
SENDER_ADDRESS_COUNTRY=US
SENDER_NAME=Hammer & Bell
SENDER_EMAIL=support@hammerandbell.com
SENDER_PHONE=555-123-4567
```

## Workflow

1. **Order Creation**: Customer creates an order with PENDING status
2. **Payment**: Customer pays the order, status changes to PAID
3. **Get Rates**: Customer calls `/rates/:orderId` to get shipping rates
4. **Select Rate**: Customer reviews rates and selects one
5. **Purchase Label**: Customer calls `/purchase/:orderId` with selected rate
6. **Order Update**: Order status changes to PACKED, tracking code generated
7. **Shipping**: Package is shipped
8. **Tracking**: Customer can track package using `/track/:orderId`

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common errors:
- Order not found
- Invalid order status
- Payment required
- Shipping label already purchased
- Invalid rate ID

## Security

- All endpoints require customer authentication
- Orders are verified to belong to the authenticated customer
- Webhook signatures are verified (if configured)
- Rate limiting is applied to prevent abuse

## Testing

To test the integration:

1. Set up EasyPost test account
2. Use test API key in environment
3. Create test orders
4. Verify rate retrieval and label purchase
5. Check tracking updates

## Support

For EasyPost API documentation: https://www.easypost.com/docs/api

For issues with the integration:
1. Check logs for error details
2. Verify API key and configuration
3. Ensure product weights and dimensions are accurate
4. Test with EasyPost's test environment first