import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
}, { _id: false })

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled']

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },

  customer: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
  deliveryAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    instructions: String,
  },
  deliveryMethod: { type: String, enum: ['standard', 'express'], default: 'standard' },
  paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },

  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, required: true },
  total: { type: Number, required: true },

  status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

export const orderStatuses = ORDER_STATUSES
export default mongoose.model('Order', orderSchema)
