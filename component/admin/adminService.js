const bcrypt = require('bcryptjs');
const UserModel = require('../../model/userModel');
const ProductModel = require('../../model/productModel');
const OrderModel = require('../../model/orderModel');
require('dotenv').config({ path: 'dbconfig.env' })
const { MongoClient, ServerApiVersion } = require('mongodb');
const dbconfig = {
  url: process.env.DB_URL || ""
}

// MongoDB connection URI
const uri = dbconfig.url;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
class AdminService {
  async findUserById(userId) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error('Error finding user: ' + error.message);
    }
  }
  async updateUserById(userId, userData) {
    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        userData,
        { new: true }
      );
      if (!updatedUser) {
        throw new Error('User not found');
      }
      return updatedUser;
    } catch (error) {
      throw new Error('Error updating user: ' + error.message);
    }
  }
  async updateProfile(userId, username) {
    // Validate the username format
    const fullNamePattern = /^[A-Z][a-z]+( [A-Z][a-z]+)+$/;
    if (!fullNamePattern.test(username)) {
      throw new Error('Invalid username format.');
    }

    try {
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { username },
        { new: true }
      );
      if (!updatedUser) {
        throw new Error('User not found');
      }
      return updatedUser;
    } catch (error) {
      throw new Error('Error updating user: ' + error.message);
    }
  }
  async updatePassword(userId, oldPassword, newPassword) {
    try {
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if the old password is correct
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        throw new Error('Incorrect old password.');
      }

      // Password complexity validation
      const complexityPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!complexityPattern.test(newPassword)) {
        throw new Error('New password must include uppercase, lowercase, number, and special character, and be at least 8 characters long.');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      user.password = hashedPassword;
      await user.save();

      return user;
    } catch (error) {
      throw new Error('Error updating password: ' + error.message);
    }
  }
  async getUsers(page = 1, limit = 5, sortField = 'username', sortOrder = 'asc', search = '') {
    try {
      const skip = (page - 1) * limit;
      const sortQuery = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
        
      let query = {};
      if (search) {
        query = {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        };
      }
        
      const users = await UserModel.find(query)
          .sort(sortQuery)
          .skip(skip)
          .limit(limit)
          .exec();
            
      const total = await UserModel.countDocuments(query);
      return { users, total };
    } catch (error) {
      throw new Error('Error fetching users: ' + error.message);
    }
  }
  async getProducts(page = 1, limit = 5, sortField = 'productId', sortOrder = 'asc', search = '') {
    try {
      page = parseInt(page);
      limit = parseInt(limit);
      const skip = (page - 1) * limit;
      const sortOrderValue = sortOrder === 'asc' ? 1 : -1;
  
      // Build the match query for search
      let matchQuery = {};
      if (search) {
        matchQuery = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } }
          ]
        };
      }
  
      // Build the aggregation pipeline
      const pipeline = [
        { $match: { ...matchQuery, productId: { $exists: true, $ne: null } } },
        {
          $addFields: {
            productIdNumeric: {
              $convert: {
                input: "$productId",
                to: "long",
                onError: 0,
                onNull: 0
              }
            }
          }
        },
        { $sort: { [sortField === 'productId' ? 'productIdNumeric' : sortField]: sortOrderValue } },
        { $skip: skip },
        { $limit: limit }
      ];
  
      // Execute the aggregation pipeline
      const products = await ProductModel.aggregate(pipeline).exec();
  
      // Count the total documents matching the query
      const total = await ProductModel.countDocuments(matchQuery);
  
      return { products, total };
    } catch (error) {
      console.error('Aggregation error:', error.message); // Debugging
      throw new Error('Error fetching products: ' + error.message);
    }
  }  
  async findProductById(productId) {
    try {
        const product = await ProductModel.findById(productId);
        if (!product) throw new Error('Product not found');
        return product;
    } catch (error) {
        throw new Error('Error finding product: ' + error.message);
    }
  }
  async updateProductById(productId, productData) {
    try {
        const product = await ProductModel.findByIdAndUpdate(
            productId,
            productData,
            { new: true }
        );
        if (!product) throw new Error('Product not found');
        return product;
    } catch (error) {
        throw new Error('Error updating product: ' + error.message);
    }
  }
  async addProductImage(productId, imageUrl) {
    try {
        const product = await ProductModel.findById(productId);
        if (!product) throw new Error('Product not found');
        
        product.image.push(imageUrl);
        await product.save();
        return product;
    } catch (error) {
        throw new Error('Error adding image: ' + error.message);
    }
  }
  async removeProductImage(productId, index) {
    try {
        const product = await ProductModel.findById(productId);
        if (!product) throw new Error('Product not found');
        
        product.image.splice(index, 1);
        await product.save();
        return product;
    } catch (error) {
        throw new Error('Error removing image: ' + error.message);
    }
  }
  async deleteProduct(productId) {
    try {
        const result = await ProductModel.findByIdAndDelete(productId);
        if (!result) throw new Error('Product not found');
        return result;
    } catch (error) {
        throw new Error('Error deleting product: ' + error.message);
    }
  }
  async getNextProductId() {
    const lastProduct = await ProductModel.aggregate([
      {
        $project: {
          productIdAsNumber: { $toInt: "$productId" } // Convert productId to a number
        }
      },
      { $sort: { productIdAsNumber: -1 } }, // Sort numerically by the converted field
      { $limit: 1 } // Get the highest productId
    ]);
  
    if (lastProduct.length === 0) return '1'; // Start with '1' if no products exist
  
    const lastId = lastProduct[0].productIdAsNumber; // Get the highest numeric productId
    return (lastId + 1).toString(); // Increment and convert back to string
  }    
  async addProduct(productData) {
    try {
      const nextProductId = await this.getNextProductId();
      
      const product = new ProductModel({
        ...productData,
        productId: nextProductId,
        sales: 0,
        status: productData.status || 'Available',
      });
      
      await product.save();
      return product;
    } catch (error) {
      throw new Error('Error adding product: ' + error.message);
    }
  }
  async getOrders(page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc', status = '') {
    try {
      const skip = (page - 1) * limit;
      const sortQuery = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
        
      let query = {};
      if (status) {
        query.status = status;
      }
        
      const orders = await OrderModel.find(query)
          .sort(sortQuery)
          .skip(skip)
          .limit(limit)
          .exec();
            
      const total = await OrderModel.countDocuments(query);
      return { orders, total };
    } catch (error) {
      throw new Error('Error fetching orders: ' + error.message);
    }
  }
  async updateOrderStatus(orderId, newStatus) {
    try {
        const order = await OrderModel.findByIdAndUpdate(
          orderId,
          { 
            status: newStatus,
            updatedAt: new Date()
          },
          { new: true }
        );
        
        if (!order) {
            throw new Error('Order not found');
        }
        
        return order;
    } catch (error) {
        throw new Error('Error updating order status: ' + error.message);
    }
  }
  async findOrderById(orderId) {
    try {
        const order = await OrderModel.findById(orderId)
            .populate('products.product')
            .exec();
            
        if (!order) {
            throw new Error('Order not found');
        }
        
        return order;
    } catch (error) {
        throw new Error('Error finding order: ' + error.message);
    }
  }
  
  async getRevenueStats(range = 'month') {
    try {
      const now = new Date();
      let startDate, groupBy;

      switch (range) {
        case 'day':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          groupBy = { $hour: "$createdAt" }; // Group by hour
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          groupBy = { $dayOfWeek: "$createdAt" }; // Group by day of the week
          break;
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Start of the previous month
          groupBy = { $dayOfMonth: "$createdAt" }; // Group by day of the month
          break;
      }

      const stats = await OrderModel.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate },
              status: { $in: ['shipped', 'delivered'] }
            }
          },
          {
            $group: {
              _id: groupBy, // Group by hour/dayOfWeek/dayOfMonth
              revenue: { $sum: "$totalPrice" }
            }
          },
          {
            $sort: {
             _id: 1 // Explicitly sort by the simple _id field
            }
          }
      ]);

      return stats;
    } catch (error) {
      throw new Error('Error getting revenue stats: ' + error.message);
    }
  }

  async  findUserByEmail(email) {
    try {
        //console.log('Searching for email:', email);
        const database = client.db("shop");
        const users = database.collection("users");
        const foundUser = await users.findOne({ email }); // Search for a user by email
        if (foundUser) {
            console.log('User found:', foundUser);
          } else {
            console.log('No user found with the email:',email);
          }
        return foundUser; // Return the found user document or null if not found
    } catch (error) {
        console.error('Error finding user by email:', error);
        throw error; // Propagate the error for handling in the controller
    }
  }
  async  findUserByUsername(username) {
    try {
      const database = client.db("shop");
      const users = database.collection("users");
      const foundUser = await users.findOne({ username });
      return foundUser; // Return the user document or null
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }
}

module.exports = new AdminService();