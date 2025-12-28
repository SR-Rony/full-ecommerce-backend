import mongoose from 'mongoose';
const TicketSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, "Customer ID is required"]
  },
  orderId: {
    type: String,
    trim: true,
    required: [true, "Order ID is required"]
  },
  issue: {
    type: String,
    required: [true,"Issue description is required"],
    trim: true,
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'resolved'],
    lowercase: true,
    trim: true,
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    lowercase: true,
    trim: true,
    default: 'medium'
  },
  closed_by: {
    type: String,
    enum: ['admin', 'customer', null],
    lowercase: true,
    trim: true,
    default: null
  },
  closed_or_resolved_at: {
    type: Date,
    default: null
  },
  resolved_by: {
    type: String,
    enum: ['admin', 'customer', null],
    lowercase: true,
    trim: true,
    default: null
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TicketConversation',
    default: null
  }
}, {
  timestamps: true
});

const TicketModel = mongoose.model('Ticket', TicketSchema);
export default TicketModel
