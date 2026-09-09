// Top-level shop categories. `icon` keys map to lucide-react icons in utils/icons.jsx
// `tile` keys map to a gradient treatment in components/product/ProductTile.jsx
export const categories = [
  { slug: 'freshwater-fish', name: 'Freshwater Fish', icon: 'fish', tile: 'fish', blurb: 'Guppies, bettas, tetras & more' },
  { slug: 'marine-fish', name: 'Marine Fish', icon: 'fish', tile: 'marine', blurb: 'Clownfish, tangs, gobies' },
  { slug: 'live-plants', name: 'Live Plants', icon: 'leaf', tile: 'plant', blurb: 'Aquascaping & oxygenators' },
  { slug: 'aquariums', name: 'Aquariums', icon: 'frame', tile: 'tank', blurb: 'Tanks, nano to full setups' },
  { slug: 'hardscape', name: 'Hardscape', icon: 'mountain', tile: 'hardscape', blurb: 'Rocks, driftwood, substrate' },
  { slug: 'fish-food', name: 'Fish Food', icon: 'utensils', tile: 'food', blurb: 'Flakes, pellets, frozen' },
  { slug: 'filtration', name: 'Filtration', icon: 'waves', tile: 'equipment', blurb: 'Filters & media' },
  { slug: 'lighting', name: 'Lighting', icon: 'lightbulb', tile: 'equipment', blurb: 'LED & plant lights' },
  { slug: 'heating', name: 'Heaters', icon: 'thermometer', tile: 'equipment', blurb: 'Heaters & controllers' },
  { slug: 'water-care', name: 'Water Care', icon: 'flask-conical', tile: 'water', blurb: 'Conditioners & test kits' },
  { slug: 'cleaning', name: 'Cleaning', icon: 'brush', tile: 'equipment', blurb: 'Maintenance tools' },
  { slug: 'decorations', name: 'Decorations', icon: 'palette', tile: 'decor', blurb: 'Ornaments & backgrounds' },
]

export const getCategory = (slug) => categories.find((c) => c.slug === slug)
