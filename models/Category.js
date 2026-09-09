import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: 'fish' },
  tile: { type: String, default: 'equipment' },
  blurb: { type: String, trim: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

export default mongoose.model('Category', categorySchema)
