import { customerControllerMessages } from "../../common/index.js";
import OrderModel from "../../models/Order.model.js";
import TicketModel from "../../models/Ticket.model.js";

import TicketConversationModel from "../../models/TicketConversation.model.js";
import { isValidObjectId, responseError, responseSuccess } from "../../utils/index.js";

// Import the new email function
import { sendTicketMessageNotification } from "../../mail/emailHelpers.js";

// Create a new ticket
export const createTicket = async (req, res, next) => {
  try {
    let { orderId, issue, priority = "medium" } = req.body;

    orderId = orderId ? orderId.trim() : null;
    // If orderId contains '#', replace it with an empty string
    if (orderId && orderId.includes('#')) {
      orderId = orderId.replace(/#/g, '').trim();
    }

    const exisOrder = await OrderModel.findOne({
      customer: req.customer._id,
      orderId: orderId
    }).lean()

    if (!exisOrder) {
      return res.status(400).json(
        responseError("Order not found.")
      );
    }

    const existingTicket = await TicketModel.findOne({
      customerId: req.customer._id,
      orderId: orderId,
      status: "open"
    }).lean();
    if (existingTicket) {
      return res.status(400).json(
        responseError("You already have an open ticket for this order")
      );
    }
    // Create ticket
    const ticket = await TicketModel.create({
      customerId: req.customer._id,
      orderId,
      issue,
      priority,
      status: "open"
    });

    // Create initial conversation message
    const initialConversation = await TicketConversationModel.create({
      ticketId: ticket._id,
      message: issue,
      sender: "customer",
      customerId: req.customer._id
    });

    // Update ticket with lastMessage
    await TicketModel.findByIdAndUpdate(ticket._id, {
      lastMessage: initialConversation._id
    });
  // Send email notification to admin
    await sendTicketMessageNotification({
        _id:ticket?._id,
      orderId: ticket.orderId,
      customerId: req.customer._id,
      origin: req.customer.origin
    }, true);
    return res.status(201).json(
      responseSuccess("Ticket created successfully", ticket)
    );
  } catch (error) {
    next(error);
  }
};

// Get all tickets for a customer
export const getMyTickets = async (req, res, next) => {
  try {
    const {
      status,
      search, // Changed from 'issue' to 'search' to match admin controller
      priority,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      fromDate,
      toDate
    } = req.query;

    // Build query object
    const query = { customerId: req.customer._id };

    // Add status filter
    if (status) {
      query.status = status.toLowerCase();
    }

    // Add priority filter
    if (priority) {
      query.priority = priority.toLowerCase();
    }

    // Add date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Handle search functionality - similar to admin controller
    if (search) {
      // Clean search term for orderId matching (remove # symbols)
      const cleanedSearch = search.replace(/#/g, '').trim();
      
      // Create search conditions
      const searchConditions = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { issue: { $regex: search, $options: 'i' } }, // Keep issue for backward compatibility
        { orderId: { $regex: search, $options: 'i' } } // Original search term
      ];

      // Add cleaned search term only if it's different from original
      if (cleanedSearch !== search && cleanedSearch.length > 0) {
        searchConditions.push({ orderId: { $regex: cleanedSearch, $options: 'i' } });
      }

      query.$or = searchConditions;
    }

    // Handle sorting by lastMessage
    if (sortBy === 'lastMessage') {
      // Use aggregation pipeline for lastMessage sorting
      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'ticketconversations',
            localField: 'lastMessage',
            foreignField: '_id',
            as: 'lastMessageData'
          }
        },
        {
          $addFields: {
            lastMessageCreatedAt: {
              $ifNull: [
                { $arrayElemAt: ['$lastMessageData.createdAt', 0] },
                '$createdAt'
              ]
            }
          }
        },
        {
          $sort: {
            lastMessageCreatedAt: sortOrder === 'desc' ? -1 : 1
          }
        },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $project: {
            _id: 1,
            subject: 1,
            description: 1,
            issue: 1,
            status: 1,
            priority: 1,
            orderId: 1, // Include orderId
            customerId: 1,
            lastMessage: {
              $ifNull: [
                {
                  _id: { $arrayElemAt: ['$lastMessageData._id', 0] },
                  message: { $arrayElemAt: ['$lastMessageData.message', 0] },
                  sender: { $arrayElemAt: ['$lastMessageData.sender', 0] },
                  createdAt: { $arrayElemAt: ['$lastMessageData.createdAt', 0] }
                },
                null
              ]
            },
            createdAt: 1,
            updatedAt: 1
          }
        }
      ];

      // Get total count for pagination
      const totalTickets = await TicketModel.countDocuments(query);
      
      // Execute aggregation
      const tickets = await TicketModel.aggregate(pipeline);

      return res.status(200).json(
        responseSuccess("Tickets fetched successfully", {
          tickets,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalTickets / parseInt(limit)),
            totalTickets,
            limit: parseInt(limit),
            hasMore: parseInt(page) < Math.ceil(totalTickets / parseInt(limit))
          }
        })
      );
    }

    // Regular sorting for other fields
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count for pagination
    const totalTickets = await TicketModel.countDocuments(query);

    // Get paginated tickets with populated lastMessage and proper field selection
    const tickets = await TicketModel.find(query)
      .select('_id subject description issue status priority orderId customerId lastMessage createdAt updatedAt') // Include orderId
      .populate({
        path: 'lastMessage',
        select: 'message sender createdAt'
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    return res.status(200).json(
      responseSuccess("Tickets fetched successfully", {
        tickets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalTickets / parseInt(limit)),
          totalTickets,
          limit: parseInt(limit),
          hasMore: parseInt(page) < Math.ceil(totalTickets / parseInt(limit))
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

// Get single ticket details with conversations
export const getTicketDetails = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const {
      page = 1,
      limit = 10,
      search,
      fromDate,
      toDate,
      sender
    } = req.query;

    if (!isValidObjectId(ticketId)) {
      return res.status(400).json(
        responseError("Invalid ticket ID")
      );
    }

    // Find ticket with populated lastMessage
    const ticket = await TicketModel.findOne({
      _id: ticketId,
      customerId: req.customer._id
    })
    .populate({
      path: 'lastMessage',
      select: 'message sender createdAt'
    })
    .lean();

    if (!ticket) {
      return res.status(404).json(
        responseError("Ticket not found")
      );
    }

    // Build conversation query
    const conversationQuery = { ticketId };

    // Add search filter for message content
    if (search) {
      conversationQuery.message = { $regex: search, $options: 'i' };
    }

    // Add date range filter
    if (fromDate || toDate) {
      conversationQuery.createdAt = {};
      if (fromDate) {
        conversationQuery.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        conversationQuery.createdAt.$lte = new Date(toDate);
      }
    }

    // Add sender filter
    if (sender) {
      conversationQuery.sender = sender; // 'customer' or 'admin'
    }

    // Get total count of conversations
    const totalConversations = await TicketConversationModel.countDocuments(conversationQuery);
    const totalPages = Math.ceil(totalConversations / parseInt(limit));

    let conversations;
    
    if (parseInt(page) === 1) {
      // For first page, get the latest messages and reverse them to show oldest to newest
      conversations = await TicketConversationModel.find(conversationQuery)
        .sort({ createdAt: -1 }) // DESC order - newest first
        .limit(parseInt(limit))
        .lean();
      
      // Reverse to show oldest to newest for display
      conversations = conversations.reverse();
    } else {
      // For subsequent pages (loading older messages), use ascending order with proper skip
      // Calculate skip from the end for older messages
      const skip = totalConversations - (parseInt(page) * parseInt(limit));
      const actualSkip = Math.max(0, skip);
      const actualLimit = skip < 0 ? parseInt(limit) + skip : parseInt(limit);
      
      conversations = await TicketConversationModel.find(conversationQuery)
        .sort({ createdAt: 1 }) // ASC order - oldest first
        .skip(actualSkip)
        .limit(actualLimit)
        .lean();
    }

    return res.status(200).json(
      responseSuccess("Ticket details fetched", {
        ticket,
        conversations,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalConversations,
          limit: parseInt(limit),
          hasMore: parseInt(page) < totalPages
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

// Add message to ticket conversation
export const addTicketMessage = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json(
        responseError("Invalid ticket ID")
      );
    }
    const ticket = await TicketModel.findOne({
      _id: ticketId,
      customerId: req.customer._id
    });

    if (!ticket) {
      return res.status(404).json(
        responseError("Ticket not found")
      );
    }

    if (ticket.status !== "open") {
      return res.status(400).json(
        responseError("Cannot add message to closed/resolved ticket")
      );
    }

    const conversation = await TicketConversationModel.create({
      ticketId,
      message,
      sender: "customer",
      customerId: req.customer._id
    });

    // Update the ticket's lastMessage field
    await TicketModel.findByIdAndUpdate(ticketId, {
      lastMessage: conversation._id
    });

    // Send email notification to admin
    await sendTicketMessageNotification({
      _id:ticket?._id,
      orderId: ticket.orderId,
      customerId: req.customer._id,
      origin: req.customer.origin
    }, true);

    return res.status(201).json(
      responseSuccess("Message added successfully", conversation)
    );
  } catch (error) {
    next(error);
  }
};

// Close a ticket
export const updateStatusTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { status = "closed" } = req.body; // Allow status to be 'closed' or 'resolved'

    // Validate ticketId
    if (!isValidObjectId(ticketId)) {
      return res.status(400).json(
        responseError("Invalid ticket ID")
      );
    }

    // Validate status
    const validStatuses = ["closed", "resolved"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json(
        responseError("Status must be either 'closed' or 'resolved'")
      );
    }

    // Find ticket
    let ticket = await TicketModel.findOne({
      _id: ticketId,
      customerId: req.customer._id
    }).lean();

    if (!ticket) {
      return res.status(404).json(
        responseError("Ticket not found")
      );
    }

    // Check if ticket can be updated
    if (ticket.status !== "open") {
      return res.status(400).json(
        responseError(`Ticket is already ${ticket.status}`)
      );
    }

    // Create a conversation entry for the status change
    const statusConversation = await TicketConversationModel.create({
      ticketId,
      message: `Ticket ${status.toLowerCase()} by customer`,
      sender: "customer",
      customerId: req.customer._id,
    });

    // Update ticket with new status and lastMessage
    ticket = await TicketModel.findOneAndUpdate(
      { _id: ticketId, customerId: req.customer._id },
      {
        status: status.toLowerCase(),
        closed_by: "customer",
        closed_or_resolved_at: new Date(),
        lastMessage: statusConversation._id
      },
      { new: true }
    )
    .populate([{
      path: 'lastMessage',
      select: 'message sender createdAt'
    },
  {
      path: 'customerId',
      select: {pass:0}
    },]
  )
    .lean();
 // Send email notification to customer
    await sendTicketMessageNotification({
        _id:ticket?._id,
      orderId: ticket.orderId,
      customerId: ticket?.customerId?._id,
      customer: ticket?.customerId,
      origin: ticket?.customerId?.origin
    }, true);
    return res.status(200).json(
      responseSuccess(`Ticket ${status.toLowerCase()} successfully`, ticket)
    );
  } catch (error) {
    next(error);
  }
};

// Get ticket by orderId
export const getTicketByOrderId = async (req, res, next) => {
  try {
    let { orderId, page = 1, limit = 20, search, fromDate, toDate, sender } = req.query;
    
    // Clean up orderId if it contains '#'
    orderId = orderId ? orderId.trim() : null;
    if (orderId && orderId.includes('#')) {
      orderId = orderId.replace(/#/g, '').trim();
    }
    
    if (!orderId) {
      return res.status(400).json(
        responseError("Please provide a valid orderId")
      );
    }
    
    // Find open ticket for this order with populated lastMessage
    const ticket = await TicketModel.findOne({
      customerId: req.customer._id,
      orderId: orderId,
      status: "open"
    })
    .populate({
      path: 'lastMessage',
      select: 'message sender createdAt'
    })
    .lean();
    
    if (!ticket) {
      return res.status(200).json(
        responseSuccess("No open ticket found for this order", { exists: false })
      );
    }
    
    // Build conversation query for pagination
    const conversationQuery = { ticketId: ticket._id };

    // Add search filter for message content
    if (search) {
      conversationQuery.message = { $regex: search, $options: 'i' };
    }

    // Add date range filter
    if (fromDate || toDate) {
      conversationQuery.createdAt = {};
      if (fromDate) {
        conversationQuery.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        conversationQuery.createdAt.$lte = new Date(toDate);
      }
    }

    // Add sender filter
    if (sender) {
      conversationQuery.sender = sender; // 'customer' or 'admin'
    }

    // Get total count of conversations
    const totalConversations = await TicketConversationModel.countDocuments(conversationQuery);
    const totalPages = Math.ceil(totalConversations / parseInt(limit));

    let conversations;
    
    if (parseInt(page) === 1) {
      // For first page, get the latest messages and reverse them to show oldest to newest
      conversations = await TicketConversationModel.find(conversationQuery)
        .sort({ createdAt: -1 }) // DESC order - newest first
        .limit(parseInt(limit))
        .lean();
      
      // Reverse to show oldest to newest for display
      conversations = conversations.reverse();
    } else {
      // For subsequent pages (loading older messages), use ascending order with proper skip
      // Calculate skip from the end for older messages
      const skip = totalConversations - (parseInt(page) * parseInt(limit));
      const actualSkip = Math.max(0, skip);
      const actualLimit = skip < 0 ? parseInt(limit) + skip : parseInt(limit);
      
      conversations = await TicketConversationModel.find(conversationQuery)
        .sort({ createdAt: 1 }) // ASC order - oldest first
        .skip(actualSkip)
        .limit(actualLimit)
        .lean();
    }
    
    return res.status(200).json(
      responseSuccess("Open ticket found for this order", {
        exists: true,
        ticket,
        conversations,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalConversations,
          limit: parseInt(limit),
          hasMore: parseInt(page) < totalPages
        }
      })
    );
  } catch (error) {
    next(error);
  }
};