import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LargeDiscountProduct from '../src/models/LargeDiscountProduct.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

async function initLargeDiscountProducts() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if there's already a document
    const existingDoc = await LargeDiscountProduct.findOne({});
    
    if (!existingDoc) {
      // Create a new document with an empty array of products
      const largeDiscountProduct = new LargeDiscountProduct({
        largeDiscountProducts: [],
        isActive: true
      });
      
      await largeDiscountProduct.save();
      console.log('Successfully created initial LargeDiscountProduct document');
    } else {
      console.log('LargeDiscountProduct document already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing LargeDiscountProducts:', error);
    process.exit(1);
  }
}

initLargeDiscountProducts();
