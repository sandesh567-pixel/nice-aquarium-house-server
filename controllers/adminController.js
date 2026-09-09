import Order from '../models/Order.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const LOW_STOCK_THRESHOLD = 5

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalSalesAgg, orderCount, customerCount, productCount, lowStockCount] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Product.countDocuments({ stock: { $lte: LOW_STOCK_THRESHOLD, $gt: 0 } }),
  ])

  res.json({
    totalSales: totalSalesAgg[0]?.total || 0,
    orders: orderCount,
    customers: customerCount,
    products: productCount,
    lowStock: lowStockCount,
  })
})
