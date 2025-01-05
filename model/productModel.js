const mongoose = require('mongoose');
mongoose.pluralize(null);

const productModel = new mongoose.Schema({
  'productId':{
    type: String,
    required: true,
    unique: true,
  },
  'name': {
    type: String,
    required: true,
  },
  'description': {
    type: String,
    required: false,
  },
  'price': {
    type: Number,
    required: true,
  },
  'brand': {
    type: String,
    required: true,
  },
  'material': {
    type: String,
    required: true,
  },
  'image': {
    type: [String],
    required: false,
  },
  'sex': {
    type: String,
    enum: ['Men', 'women', 'Unisex'],
    required: true,
  },
  'stock': {
    type: Number,
    required: true,
  },
  'sales': {
    type: Number,
    required: true,
  },
  'status': {
    type: String,
    required: true,
    enum: ['Available', 'Unavailable'],
  }
},
{
  timestamps: true,
}
);
module.exports = mongoose.model('products', productModel, 'products');
