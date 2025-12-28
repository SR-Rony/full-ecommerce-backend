import { body } from 'express-validator'

export const ContactCreateValidationRules = [
    body('email').isEmail().withMessage('Invalid email'),
    body('contactCategory').isMongoId().withMessage('Contact Category should be a valid'),
    body('message').trim().isLength({ min: 1 }).withMessage('Message is required!'),
]
