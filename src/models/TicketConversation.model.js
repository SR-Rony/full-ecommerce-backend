import mongoose from 'mongoose'
const TicketConversationSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: [true,'Ticket ID is a required']
  },
  message: {
    type: String,
    required: [true,'Message is a required!']
  },
  sender: {
    type: String,
    enum: ['admin', 'customer'],
    lowercase:true,
    trim:true,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  }
}, {
  timestamps: true
});
const TicketConversationModel = mongoose.model('TicketConversation', TicketConversationSchema);

export default TicketConversationModel;
