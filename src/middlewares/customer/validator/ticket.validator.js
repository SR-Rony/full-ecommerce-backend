import { body, param } from "express-validator";

export const createTicketValidation = [
  body("orderId")
    .notEmpty()
    .withMessage("Order ID is required")
    .trim(),
  body("issue")
    .notEmpty()
    .withMessage("Issue description is required"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Invalid priority level")
];

export const addMessageValidation = [
  param("ticketId")
    .notEmpty()
    .withMessage("Ticket ID is required"),
  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Message cannot be empty")
];