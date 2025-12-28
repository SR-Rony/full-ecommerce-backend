import { body } from 'express-validator'

export const CustomerShippingAddressValidationRules = [
  body('streetNumber').notEmpty().withMessage('Street number is required'),
  body('streetName').notEmpty().withMessage('Street Name is required'),
  body('aptUnit').notEmpty().withMessage('Apt unit is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('zipCode').notEmpty().withMessage('Zip code is required'),
  body('email').optional().isEmail('Email invalid'),
  body('receiverName.firstName').optional(),
  body('receiverName.lastName').optional()
]
