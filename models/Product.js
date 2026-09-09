import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  imageUrl: { type: String, trim: true, default: '' }, // optional; falls back to the gradient ProductTile when empty
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, index: true }, // category slug
  subcategory: { type: String, trim: true },
  tile: { type: String, default: 'equipment' }, // gradient tile key used by the frontend's ProductTile
  brand: { type: String, default: 'Nice Aquarium House' },

  price: { type: Number, required: true, min: 0 },
  discountPrice: { type: Number, min: 0, default: null },

  stock: { type: Number, required: true, min: 0, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },

  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, min: 0, default: 0 },

  tags: [{ type: String }],
  specifications: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Live-fish-specific care fields (present when category is a fish category)
  isLive: { type: Boolean, default: false },
  scientificName: String,
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'None'] },
  adultSize: String,
  lifespan: String,
  temperature: String,
  ph: String,
  waterType: String,
  diet: String,
  compatibility: String,
  minimumTankSize: String,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

productSchema.index({ name: 'text', description: 'text', scientificName: 'text' })

export default mongoose.model('Product', productSchema)
