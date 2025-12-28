import mongoose from 'mongoose';

const CreditHistorySchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Customer ID is required'],
        index: true
    },
    orderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
       default: null
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: 0
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: [true, 'Transaction type is required (credit/debit)']
    },
    description: {
        type: String,
      default:null
    },

    previousBalance: {
        type: Number,
        required: true
    },
  
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for faster queries on customer and date
CreditHistorySchema.index({ customerId: 1, createdAt: -1 });

// Virtual for customer details
CreditHistorySchema.virtual('customer', {
    ref: 'Customer',
    localField: 'customerId',
    foreignField: '_id',
    justOne: true
});


const CreditHistory = mongoose.model('CreditHistory', CreditHistorySchema);

export default CreditHistory;