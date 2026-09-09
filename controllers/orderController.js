import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { sendNewOrderEmail, sendOrderStatusEmail } from '../services/emailService.js'

const DELIVERY_CHARGES = { standard: 100, express: 200 } // NPR — configurable here, not hard-coded in the frontend

function generateOrderNumber() {
  return `AQ-${Math.floor(10000 + Math.random() * 89999)}`
}

export const createOrder = asyncHandler(async (req, res) => {
  const { items, customer, deliveryAddress, deliveryMethod = 'standard', paymentMethod = 'cod' } = req.body

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order must include at least one item.' })
  }
  if (!customer?.fullName || !customer?.phone || !customer?.email) {
    return res.status(400).json({ message: 'Customer name, phone and email are required.' })
  }
  if (!deliveryAddress?.address || !deliveryAddress?.city || !deliveryAddress?.postalCode) {
    return res.status(400).json({ message: 'Delivery address, city and postal code are required.' })
  }

  // Re-price every line item from the database — never trust prices sent by the client.
  const productIds = items.map((i) => i.productId)
  const products = await Product.find({ _id: { $in: productIds } })
  const productMap = new Map(products.map((p) => [String(p._id), p]))

  const orderItems = []
  for (const item of items) {
    const product = productMap.get(String(item.productId))
    if (!product) return res.status(400).json({ message: `Product ${item.productId} not found.` })
    if (product.stock < item.qty) {
      return res.status(409).json({ message: `${product.name} only has ${product.stock} in stock.` })
    }
    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.discountPrice || product.price,
      qty: item.qty,
    })
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0)
  const deliveryCharge = DELIVERY_CHARGES[deliveryMethod] ?? DELIVERY_CHARGES.standard
  const total = subtotal + deliveryCharge

  const session = await mongoose.startSession()
  let order
  try {
    await session.withTransaction(async () => {
      for (const item of orderItems) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.qty } }, { session })
      }
      const [created] = await Order.create([{
        orderNumber: generateOrderNumber(),
        user: req.user?._id,
        items: orderItems,
        customer,
        deliveryAddress,
        deliveryMethod,
        paymentMethod,
        subtotal,
        deliveryCharge,
        total,
      }], { session })
      order = created
    })
  } finally {
    session.endSession()
  }

  // Fire-and-forget: the order is already durable in MongoDB at this
  // point (the transaction committed above). Email is a notification,
  // not part of the order's success path — it's never awaited here, so
  // SMTP latency or failure can never delay or break this response.
  sendNewOrderEmail(order).catch((err) => console.error('[email] Failed to send new-order email:', err.message))

  res.status(201).json({ order })
})

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json({ orders })
})

export const getOrderByNumber = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber })
  if (!order) return res.status(404).json({ message: 'Order not found.' })
  // Signed-in users may only view their own orders (or any order, if admin).
  // Guests can look up an order by its number for tracking — the order
  // number itself is the shared secret, same as most delivery trackers.
  if (req.user && req.user.role !== 'admin' && order.user && String(order.user) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not authorized to view this order.' })
  }
  res.json({ order })
})

// --- Admin ---

export const listAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.query
  const query = status ? { status } : {}
  const orders = await Order.find(query).sort({ createdAt: -1 })
  res.json({ orders })
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found.' })

  const previousStatus = order.status
  order.status = status
  await order.save() // schema validation (the same status enum) still runs on save, same as runValidators did before

  res.json({ order })

  // Only notify the customer when the status actually changed — an admin
  // re-submitting the same status is a no-op, not a real transition.
  // Fire-and-forget, same reasoning as the new-order email above.
  if (previousStatus !== status) {
    sendOrderStatusEmail(order, status).catch((err) => console.error('[email] Failed to send order-status email:', err.message))
  }
})
