const mongoose = require('mongoose');
const schema = mongoose.Schema;
mongoose.pluralize(null);

const orderModel = new schema({
    'userid': {
     type: String,
     required: true,
    },
    'address': {
     type: String,
     required: true,
    },
    'status': {
     type: String,
     required: true,
     enum: ['pending', 'shipped', 'delivered'],
    },
    'products': {
     type: [Object],
     required: true,
    },
    'receiver':{
        type: String,
        required: true,
    },
    'phone':{
        type: String,
        required: true,
    },
    'totalPrice':{
        type: Number,
        required: true,
    }
},{
    timestamps: true, // Automatically add `createdAt` and `updatedAt` fields
  }
);

module.exports = mongoose.model('orders', orderModel, 'orders');