import { Router } from "express";
import { authMiddleware } from "../../middlewares/index.js";
import { bodyValidator } from "../../middlewares/common/bodyValidator.js";
import { createTicketValidation, addMessageValidation } from "../../middlewares/customer/validator/ticket.validator.js";
import {
  createTicket,
  getMyTickets,
  getTicketDetails,
  addTicketMessage,
  updateStatusTicket,
  getTicketByOrderId
} from "../../controllers/customer/ticket.controllers.js";

const router = Router();

// Create new ticket
router.post(
  "/create",
  authMiddleware.customer.isCustomerAuthorized,
  createTicketValidation,
  bodyValidator,
  createTicket
);

// Get all tickets for logged in customer
router.get(
  "/my-tickets",
  authMiddleware.customer.isCustomerAuthorized,
  getMyTickets
);

// Get single ticket details with conversations
router.get(
  "/details/:ticketId",
  authMiddleware.customer.isCustomerAuthorized,
  getTicketDetails
);

// Add message to ticket conversation
router.post(
  "/:ticketId/message",
  authMiddleware.customer.isCustomerAuthorized,
  addMessageValidation,
  bodyValidator,
  addTicketMessage
);

// Close a ticket
router.patch(
  "/:ticketId/update-status",
  authMiddleware.customer.isCustomerAuthorized,
  updateStatusTicket
);

// Get ticket by orderId
router.get(
  "/by-order-id",
  authMiddleware.customer.isCustomerAuthorized,
  getTicketByOrderId
);

export default router;