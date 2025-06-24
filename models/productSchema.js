        const mongoose = require('mongoose');
        const { Schema } = mongoose;

        const productSchema = new Schema({
            productName: {
                type: String,
                required: true,
                trim: true
            },
            description: {
                type: String,
                required: true,
                trim: true
            },
            brand: {
                type: String,
                required: true,
                trim: true
            },
            category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category',
                required: true
            },
            regularPrice: {
                type: Number,
                required: true,
                min: 0
            },
            salePrice: {
                type: Number,
                required: true,
                min: 0
            },
            productOffer: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            },
            quantity: {
                type: Number,
                required: true,
                min: 0
            },
            color: {
                type: String,
                required: true,
                trim: true
            },
            viewsToday: {
                type: Number,
                default: 0,
              },
              lastViewedDate: {
                type: Date,
                default: new Date(),
              },
              
            scale: {
                type: String,
             
               
            },
            material: {
                type: String,
                trim: true
            },
            productImage: {
                type: [String],
                required: true
            },
            isBlocked: {
                type: Boolean,
                default: false
            },
            status: {
                type: String,
                enum: ['available', 'out of stock', 'discontinued'],
                required: true,
                default: 'available'
            },
            reviews: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Review'
            }]
        }, { timestamps: true });

        const Product = mongoose.model('Product', productSchema);

        module.exports = Product;