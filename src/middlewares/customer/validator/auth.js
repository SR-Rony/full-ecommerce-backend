import { body } from "express-validator";

export const customerSignupValidationRules = [
body('email').isEmail().withMessage('Invalid email address!'),
body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters!'),
];
export const resetPasswordValidationRules = [
body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters!'),
]

export const  customerLoginValidationRules = [
body('email').isEmail().withMessage('Invalid email address!'),
body('password').notEmpty().withMessage('Password is required!'),
];
