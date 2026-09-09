// Mock product catalog for Nice Aquarium House.
// This mirrors the shape a future GET /api/products response would have,
// so the frontend can swap `services/productService.js` for a real fetch
// without touching any component.

let _id = 1
const nextId = () => `P${String(_id++).padStart(4, '0')}`

const fish = [
  { name: 'Guppy', scientificName: 'Poecilia reticulata', difficulty: 'Beginner', adultSize: '3–6 cm', lifespan: '2–3 years', temperature: '22–28°C', ph: '6.8–7.8', waterType: 'Freshwater', diet: 'Omnivore — flakes, brine shrimp', compatibility: 'Peaceful community fish', minimumTankSize: '40 L', price: 150, tags: ['beginner', 'colorful'] },
  { name: 'Betta (Male)', scientificName: 'Betta splendens', difficulty: 'Beginner', adultSize: '6–7 cm', lifespan: '2–4 years', temperature: '24–28°C', ph: '6.5–7.5', waterType: 'Freshwater', diet: 'Carnivore — pellets, bloodworms', compatibility: 'Keep alone or with calm tankmates', minimumTankSize: '20 L', price: 350, tags: ['beginner', 'colorful'] },
  { name: 'Neon Tetra', scientificName: 'Paracheirodon innesi', difficulty: 'Beginner', adultSize: '2.5 cm', lifespan: '5 years', temperature: '20–26°C', ph: '6.0–7.0', waterType: 'Freshwater', diet: 'Omnivore — micro pellets, flakes', compatibility: 'Peaceful, shoal of 6+', minimumTankSize: '40 L', price: 90, tags: ['schooling', 'beginner'] },
  { name: 'Angelfish', scientificName: 'Pterophyllum scalare', difficulty: 'Intermediate', adultSize: '15 cm', lifespan: '10 years', temperature: '24–29°C', ph: '6.5–7.5', waterType: 'Freshwater', diet: 'Omnivore', compatibility: 'Semi-aggressive, avoid tiny fish', minimumTankSize: '110 L', price: 450, tags: ['centerpiece'] },
  { name: 'Molly', scientificName: 'Poecilia sphenops', difficulty: 'Beginner', adultSize: '8 cm', lifespan: '3–5 years', temperature: '22–28°C', ph: '7.0–8.5', waterType: 'Freshwater', diet: 'Omnivore', compatibility: 'Peaceful community fish', minimumTankSize: '75 L', price: 180, tags: ['beginner'] },
  { name: 'Platy', scientificName: 'Xiphophorus maculatus', difficulty: 'Beginner', adultSize: '6 cm', lifespan: '3 years', temperature: '18–26°C', ph: '7.0–8.2', waterType: 'Freshwater', diet: 'Omnivore', compatibility: 'Peaceful community fish', minimumTankSize: '40 L', price: 160, tags: ['beginner', 'colorful'] },
  { name: 'Goldfish (Common)', scientificName: 'Carassius auratus', difficulty: 'Beginner', adultSize: '15–20 cm', lifespan: '10–15 years', temperature: '18–22°C', ph: '7.0–8.4', waterType: 'Freshwater, unheated', diet: 'Omnivore', compatibility: 'Cold-water tank only, no tropicals', minimumTankSize: '150 L', price: 220, tags: ['classic'] },
  { name: 'Discus', scientificName: 'Symphysodon aequifasciatus', difficulty: 'Advanced', adultSize: '18–20 cm', lifespan: '10–15 years', temperature: '28–30°C', ph: '6.0–7.0', waterType: 'Freshwater, soft water', diet: 'Carnivore — high protein', compatibility: 'Peaceful, needs stable water', minimumTankSize: '200 L', price: 2200, tags: ['premium', 'centerpiece'] },
  { name: 'Oscar', scientificName: 'Astronotus ocellatus', difficulty: 'Intermediate', adultSize: '30–35 cm', lifespan: '10–20 years', temperature: '23–27°C', ph: '6.0–7.5', waterType: 'Freshwater', diet: 'Carnivore', compatibility: 'Aggressive, large tankmates only', minimumTankSize: '300 L', price: 900, tags: ['centerpiece'] },
  { name: 'Dwarf Gourami', scientificName: 'Trichogaster lalius', difficulty: 'Beginner', adultSize: '8 cm', lifespan: '4 years', temperature: '22–28°C', ph: '6.0–7.5', waterType: 'Freshwater', diet: 'Omnivore', compatibility: 'Peaceful, calm tankmates', minimumTankSize: '75 L', price: 280, tags: ['colorful'] },
  { name: 'Corydoras Catfish', scientificName: 'Corydoras paleatus', difficulty: 'Beginner', adultSize: '6 cm', lifespan: '5 years', temperature: '22–26°C', ph: '6.5–7.5', waterType: 'Freshwater', diet: 'Omnivore — sinking pellets', compatibility: 'Peaceful bottom-dweller, shoal of 4+', minimumTankSize: '60 L', price: 200, tags: ['bottom-dweller', 'cleanup crew'] },
]

const marineFish = [
  { name: 'Clownfish', scientificName: 'Amphiprion ocellaris', difficulty: 'Beginner', adultSize: '8 cm', lifespan: '6–10 years', temperature: '24–27°C', ph: '8.1–8.4', waterType: 'Marine', diet: 'Omnivore', compatibility: 'Peaceful, pairs well with anemone', minimumTankSize: '75 L', price: 1600, tags: ['iconic'] },
  { name: 'Blue Tang', scientificName: 'Paracanthurus hepatus', difficulty: 'Intermediate', adultSize: '30 cm', lifespan: '8–20 years', temperature: '24–26°C', ph: '8.1–8.4', waterType: 'Marine', diet: 'Herbivore', compatibility: 'Needs open swimming space', minimumTankSize: '400 L', price: 3800, tags: ['centerpiece'] },
  { name: 'Royal Gramma', scientificName: 'Gramma loreto', difficulty: 'Beginner', adultSize: '8 cm', lifespan: '5–7 years', temperature: '23–27°C', ph: '8.1–8.4', waterType: 'Marine', diet: 'Carnivore', compatibility: 'Peaceful, likes hiding spots', minimumTankSize: '110 L', price: 2400, tags: ['colorful'] },
  { name: 'Yellow Watchman Goby', scientificName: 'Cryptocentrus cinctus', difficulty: 'Intermediate', adultSize: '9 cm', lifespan: '5 years', temperature: '23–27°C', ph: '8.1–8.4', waterType: 'Marine', diet: 'Carnivore', compatibility: 'Pairs with pistol shrimp', minimumTankSize: '110 L', price: 2100, tags: ['reef-safe'] },
  { name: 'Domino Damselfish', scientificName: 'Dascyllus trimaculatus', difficulty: 'Beginner', adultSize: '10 cm', lifespan: '10 years', temperature: '24–27°C', ph: '8.1–8.4', waterType: 'Marine', diet: 'Omnivore', compatibility: 'Hardy but territorial', minimumTankSize: '150 L', price: 1200, tags: ['hardy'] },
]

const plants = [
  { name: 'Java Fern', difficulty: 'Beginner', lighting: 'Low', co2: 'Not required', growthRate: 'Slow', placement: 'Midground', temperature: '20–28°C', ph: '6.0–7.5', height: '15–30 cm', price: 280, tags: ['low-light', 'easy'] },
  { name: 'Anubias Nana', difficulty: 'Beginner', lighting: 'Low', co2: 'Not required', growthRate: 'Slow', placement: 'Foreground/Midground', temperature: '22–28°C', ph: '6.0–7.5', height: '5–10 cm', price: 320, tags: ['low-light', 'easy'] },
  { name: 'Amazon Sword', difficulty: 'Beginner', lighting: 'Medium', co2: 'Beneficial', growthRate: 'Medium', placement: 'Background', temperature: '22–28°C', ph: '6.5–7.5', height: '30–50 cm', price: 350, tags: ['centerpiece'] },
  { name: 'Java Moss', difficulty: 'Beginner', lighting: 'Low', co2: 'Not required', growthRate: 'Medium', placement: 'Foreground/Hardscape', temperature: '20–28°C', ph: '5.5–8.0', height: '2–5 cm', price: 220, tags: ['low-light', 'moss'] },
  { name: 'Dwarf Baby Tears', difficulty: 'Advanced', lighting: 'High', co2: 'Required', growthRate: 'Fast', placement: 'Foreground carpet', temperature: '20–25°C', ph: '6.0–7.0', height: '2–5 cm', price: 450, tags: ['carpet', 'advanced'] },
  { name: 'Vallisneria', difficulty: 'Beginner', lighting: 'Medium', co2: 'Not required', growthRate: 'Fast', placement: 'Background', temperature: '18–28°C', ph: '6.5–8.0', height: '30–60 cm', price: 250, tags: ['easy'] },
  { name: 'Cryptocoryne Wendtii', difficulty: 'Beginner', lighting: 'Low', co2: 'Not required', growthRate: 'Slow', placement: 'Foreground/Midground', temperature: '22–28°C', ph: '6.0–7.5', height: '10–20 cm', price: 300, tags: ['low-light'] },
  { name: 'Water Wisteria', difficulty: 'Beginner', lighting: 'Medium', co2: 'Beneficial', growthRate: 'Fast', placement: 'Background', temperature: '22–28°C', ph: '6.5–7.5', height: '30–45 cm', price: 260, tags: ['easy', 'fast-growing'] },
  { name: 'Red Root Floater', difficulty: 'Intermediate', lighting: 'Medium-High', co2: 'Not required', growthRate: 'Medium', placement: 'Floating', temperature: '22–28°C', ph: '6.0–7.5', height: 'Surface', price: 380, tags: ['floating'] },
  { name: 'Artificial Aquascape Plant Set', difficulty: 'None', lighting: 'Any', co2: 'Not required', growthRate: '—', placement: 'Anywhere', temperature: 'Any', ph: 'Any', height: '15–25 cm', price: 550, tags: ['artificial', 'low-maintenance'] },
]

const aquariums = [
  { name: 'Nano Cube 20L', subcategory: 'Nano Aquariums', dimensions: '30 × 30 × 25 cm', capacity: '20 L', glassThickness: '4 mm', type: 'Rimless', standIncluded: false, price: 3200 },
  { name: 'Rimless Ultra Clear 60L', subcategory: 'Rimless Aquariums', dimensions: '60 × 35 × 35 cm', capacity: '60 L', glassThickness: '6 mm', type: 'Rimless', standIncluded: false, price: 8500 },
  { name: 'Planted Tank Starter 80L', subcategory: 'Planted Aquariums', dimensions: '70 × 35 × 40 cm', capacity: '80 L', glassThickness: '8 mm', type: 'Rimmed', standIncluded: false, price: 11500 },
  { name: 'Community Tank 110L', subcategory: 'Community Tanks', dimensions: '90 × 40 × 35 cm', capacity: '110 L', glassThickness: '8 mm', type: 'Rimmed', standIncluded: true, price: 18500 },
  { name: 'Marine Reef-Ready 150L', subcategory: 'Marine Aquariums', dimensions: '100 × 45 × 40 cm', capacity: '150 L', glassThickness: '10 mm', type: 'Rimless, drilled', standIncluded: true, price: 42000 },
  { name: 'Complete Beginner Set 45L', subcategory: 'Aquarium Sets', dimensions: '60 × 30 × 30 cm', capacity: '45 L', glassThickness: '5 mm', type: 'Kit — tank, filter, light, lid', standIncluded: false, price: 6800 },
  { name: 'Custom Aquascape 200L', subcategory: 'Custom Aquariums', dimensions: '120 × 45 × 45 cm', capacity: '200 L', glassThickness: '10 mm', type: 'Custom-built to order', standIncluded: true, price: 65000 },
  { name: 'Mini Bowl 8L', subcategory: 'Nano Aquariums', dimensions: '25 × 20 × 20 cm', capacity: '8 L', glassThickness: '3 mm', type: 'Bowl', standIncluded: false, price: 1400 },
]

const food = [
  { name: 'Tropical Flakes', foodType: 'Flakes', fishType: 'Tropical community fish', weight: '100 g', feedingInstructions: 'Feed 2× daily, what fish clear in 2 min', price: 380 },
  { name: 'Betta Pellets', foodType: 'Pellets', fishType: 'Betta', weight: '75 g', feedingInstructions: '4–6 pellets, 1–2× daily', price: 420 },
  { name: 'Goldfish Sticks', foodType: 'Pellets', fishType: 'Goldfish', weight: '200 g', feedingInstructions: 'Feed 2× daily, small amounts', price: 350 },
  { name: 'Frozen Bloodworms', foodType: 'Frozen Food', fishType: 'Most tropical fish', weight: '100 g cube pack', feedingInstructions: 'Thaw before feeding, 2–3× weekly', price: 480 },
  { name: 'Brine Shrimp (Frozen)', foodType: 'Frozen Food', fishType: 'Fry & small fish', weight: '100 g cube pack', feedingInstructions: 'Thaw before feeding', price: 460 },
  { name: 'Live Tubifex Worms', foodType: 'Live Food', fishType: 'Most freshwater fish', weight: '50 g', feedingInstructions: 'Rinse before feeding, feed sparingly', price: 150 },
  { name: 'Marine Pellets', foodType: 'Marine Fish Food', fishType: 'Marine fish', weight: '100 g', feedingInstructions: 'Feed small amounts 2× daily', price: 650 },
  { name: 'Algae Wafers', foodType: 'Granules', fishType: 'Plecos & bottom feeders', weight: '150 g', feedingInstructions: '1 wafer per fish, daily', price: 320 },
  { name: 'Shrimp & Snail Food', foodType: 'Shrimp Food', fishType: 'Shrimp & snails', weight: '50 g', feedingInstructions: 'Small pinch every 2 days', price: 380 },
  { name: 'Color Enhancing Flakes', foodType: 'Flakes', fishType: 'Tropical community fish', weight: '100 g', feedingInstructions: 'Feed 2× daily', price: 420 },
]

const filtration = [
  { name: 'AquaFlow Internal Filter 300', subcategory: 'Internal Filters', flowRate: '300 L/h', tankSize: 'Up to 60 L', price: 1450 },
  { name: 'AquaFlow HOB Filter 500', subcategory: 'Hang-On-Back Filters', flowRate: '500 L/h', tankSize: 'Up to 100 L', price: 2600 },
  { name: 'CanisterPro 1000 External Filter', subcategory: 'Canister Filters', flowRate: '1000 L/h', tankSize: 'Up to 250 L', price: 8900 },
  { name: 'Soft Sponge Filter (Air-driven)', subcategory: 'Sponge Filters', flowRate: 'Gentle, air-pump driven', tankSize: 'Fry & shrimp tanks up to 40 L', price: 480 },
]
const lighting = [
  { name: 'FullSpectrum LED Bar 45cm', subcategory: 'LED Lights', spectrum: 'Full spectrum, 6500K', size: '45 cm', price: 2200 },
  { name: 'GrowBright Planted Tank Light', subcategory: 'Plant Lights', spectrum: 'Red/blue enhanced for plant growth', size: '60 cm', price: 3400 },
  { name: 'ReefGlow Marine LED', subcategory: 'Marine Lights', spectrum: 'Blue/white, coral-safe', size: '60 cm', price: 6500 },
]
const heating = [
  { name: 'ThermoSafe Heater 100W', subcategory: 'Aquarium Heaters', wattage: '100 W', tankSize: 'Up to 100 L', price: 1350 },
  { name: 'ThermoSafe Heater 200W', subcategory: 'Aquarium Heaters', wattage: '200 W', tankSize: '100–250 L', price: 1950 },
  { name: 'Digital Temperature Controller', subcategory: 'Temperature Controllers', wattage: 'Controls up to 300W heater', tankSize: 'Any', price: 2800 },
  { name: 'Stick-On LCD Thermometer', subcategory: 'Thermometers', wattage: '—', tankSize: 'Any', price: 120 },
]
const airWater = [
  { name: 'Whisper Air Pump Mini', subcategory: 'Air Pumps', flowRate: 'Single outlet', price: 650 },
  { name: 'Whisper Air Pump Dual', subcategory: 'Air Pumps', flowRate: 'Dual outlet', price: 980 },
  { name: 'Ceramic Air Stone Set (5pc)', subcategory: 'Air Stones', flowRate: 'Fine bubble', price: 250 },
  { name: 'WaveMaker Circulation Pump', subcategory: 'Wave Makers', flowRate: '2000 L/h, adjustable', price: 3200 },
]
const maintenance = [
  { name: 'Gravel Vacuum Cleaner', subcategory: 'Gravel Vacuum', size: 'Standard, 120 cm hose', price: 850 },
  { name: 'Magnetic Algae Scraper', subcategory: 'Algae Scraper', size: 'Fits glass up to 10 mm', price: 700 },
  { name: 'Soft Silicone Fish Net (Medium)', subcategory: 'Fish Nets', size: '15 cm', price: 220 },
  { name: 'Aquarium Cleaning Tool Kit', subcategory: 'Cleaning Tools', size: '5-piece set', price: 950 },
]

const hardscape = [
  { name: 'Premium Aquasoil 3L', subcategory: 'Aquarium Soil', color: 'Dark brown', size: '3 L bag', price: 950 },
  { name: 'Natural River Gravel', subcategory: 'Gravel', color: 'Mixed earth tones', size: '2 kg bag', price: 380 },
  { name: 'Fine White Aquarium Sand', subcategory: 'Sand', color: 'White', size: '4 kg bag', price: 550 },
  { name: 'Dragon Stone (per kg)', subcategory: 'Rocks', color: 'Grey', size: 'Sold per kg', price: 480 },
  { name: 'Spider Wood Piece (Medium)', subcategory: 'Driftwood', color: 'Natural driftwood', size: '20–30 cm', price: 900 },
  { name: 'Decorative River Stones (Set)', subcategory: 'Decorative Stones', color: 'Polished mixed', size: '1 kg set', price: 420 },
]

const decorations = [
  { name: 'Sunken Ship Ornament', subcategory: 'Ornaments', size: '20 cm', price: 850 },
  { name: 'Ceramic Hideaway Cave', subcategory: 'Ornaments', size: '15 cm', price: 480 },
  { name: 'Ocean Backdrop Poster (60cm)', subcategory: 'Backgrounds', size: '60 × 30 cm', price: 350 },
  { name: 'Rainforest Backdrop Poster (90cm)', subcategory: 'Backgrounds', size: '90 × 45 cm', price: 480 },
  { name: 'Bubble Air Ornament', subcategory: 'Ornaments', size: 'Small, air-pump driven', price: 380 },
]

const waterCare = [
  { name: 'Tap Water Conditioner 250ml', subcategory: 'Water Conditioners', use: 'Removes chlorine & heavy metals instantly', price: 480 },
  { name: 'Beneficial Bacteria Booster', subcategory: 'Beneficial Bacteria', use: 'Speeds up tank cycling', price: 650 },
  { name: 'pH Up Solution', subcategory: 'pH Adjusters', use: 'Raises pH gradually', price: 380 },
  { name: 'pH Down Solution', subcategory: 'pH Adjusters', use: 'Lowers pH gradually', price: 380 },
  { name: '5-in-1 Water Test Kit', subcategory: 'Test Kits', use: 'Tests pH, ammonia, nitrite, nitrate, GH', price: 1450 },
  { name: 'Aquarium Salt (Freshwater)', subcategory: 'Minerals', use: 'Supports fish immune health', price: 250 },
]

function build(list, category, tile, extra = {}) {
  return list.map((p, i) => ({
    id: nextId(),
    slug: `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
    category,
    tile,
    brand: extra.brand || 'Nice Aquarium House',
    rating: +(3.9 + ((i * 7) % 11) / 10).toFixed(1),
    reviewCount: 8 + ((i * 13) % 140),
    stock: (i % 5 === 0) ? 0 : 6 + ((i * 3) % 40),
    isNew: i % 6 === 0,
    isBestSeller: i % 4 === 1,
    discountPrice: i % 3 === 0 ? Math.round(p.price * 0.85 / 10) * 10 : null,
    isLive: extra.isLive || false,
    ...p,
  }))
}

export const products = [
  ...build(fish, 'freshwater-fish', 'fish', { isLive: true }),
  ...build(marineFish, 'marine-fish', 'marine', { isLive: true }),
  ...build(plants, 'live-plants', 'plant'),
  ...build(aquariums, 'aquariums', 'tank'),
  ...build(food, 'fish-food', 'food'),
  ...build(filtration, 'filtration', 'equipment'),
  ...build(lighting, 'lighting', 'equipment'),
  ...build(heating, 'heating', 'equipment'),
  ...build(airWater, 'filtration', 'equipment'),
  ...build(maintenance, 'cleaning', 'equipment'),
  ...build(hardscape, 'hardscape', 'hardscape'),
  ...build(decorations, 'decorations', 'decor'),
  ...build(waterCare, 'water-care', 'water'),
]

export const isFishCategory = (categorySlug) =>
  categorySlug === 'freshwater-fish' || categorySlug === 'marine-fish'

export const getProductBySlug = (slug) => products.find((p) => p.slug === slug)
export const getProductsByCategory = (categorySlug) => products.filter((p) => p.category === categorySlug)
export const getRelatedProducts = (product, limit = 4) =>
  products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, limit)
export const featuredProducts = products.filter((p) => p.isBestSeller).slice(0, 8)
export const newArrivals = products.filter((p) => p.isNew).slice(0, 8)
