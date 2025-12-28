import { body } from "express-validator";

export const profileValidationRules = [
body('email').isEmail().withMessage('Invalid email address!'),
];
