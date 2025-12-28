import { body } from 'express-validator';
export const orderValidationRules = [
  //body('payment.payerAddress').isString().notEmpty().withMessage('Invalid payer address'),
  //body('payment.paidAmount').isFloat({ gt: 0 }).withMessage('Paid amount must be greater than 0'),
  body('products.*.product').isMongoId().withMessage('Invalid product ID'),
  body('products.*.title').isString().notEmpty().withMessage('Product title is required'),
  body('products.*.price.regular').isFloat({ gt: 0 }).withMessage('Regular price must be greater than 0'),
  body('products.*.price.sale').isFloat({ gt: 0 }).withMessage('Sale price must be greater than 0'),
  body('orderSummary.productsSubtotal').isFloat({ gt: 0 }).withMessage('Products subtotal must be greater than 0'),
  body('orderSummary.shippingCost').isFloat({ gte: 0 }).withMessage('Shipping cost must be greater than or equal to 0'),
  body('orderSummary.totalSaving').isFloat({ gte: 0 }).withMessage('Total saving must be greater than or equal to 0'),
  body('orderSummary.totalAmount').isFloat({ gt: 0 }).withMessage('Total amount must be greater than 0'),
  body('shipping.address.streetNumber').isString().optional(),
  body('shipping.address.aptUnit').isString().optional(),
  body('shipping.address.city').isString().optional(),
  body('shipping.address.state').isString().optional(),
  body('shipping.address.zipCode').isString().optional(),
  body('shipping.address.receiverName.firstName').isString().optional(),
  body('shipping.email').isEmail().optional(),
  body('status').isIn(['PENDING', 'NEW', 'PACKED', 'SHIPPED']).toUpperCase().optional(),
  ];

  export const orderReviewValidationRules =[
    body('orderId').isString().notEmpty().withMessage('OrderId invalid!'),
    body('reviewMessage').notEmpty().withMessage('Please write a message!').isString().withMessage('Review message must be a string.').trim().isLength({ min: 1, max: 250 }).withMessage('Review message must be between 1 and 250 characters.'),
    body('ratingStar').isNumeric().withMessage('Please enter a valid rating number.')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating star must be between 1 and 5'),
  ]