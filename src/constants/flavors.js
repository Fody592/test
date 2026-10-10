// The 19 syrup lines. `id` MUST match the pump number wired on the ESP32-S3.
// `tags` are sent to Gemini so it understands each flavor's character.
export const FLAVORS = [
  { id: 1,  name: 'Cherry',         color: '#e11d48', tags: ['sweet', 'fruity'] },
  { id: 2,  name: 'Vanilla',        color: '#fde68a', tags: ['sweet', 'creamy'] },
  { id: 3,  name: 'Blue Raspberry', color: '#2563eb', tags: ['sweet', 'tart', 'fruity'] },
  { id: 4,  name: 'Lemon-Lime',     color: '#a3e635', tags: ['sour', 'citrus', 'fresh'] },
  { id: 5,  name: 'Orange',         color: '#f97316', tags: ['sweet', 'citrus'] },
  { id: 6,  name: 'Cola',           color: '#78350f', tags: ['classic', 'spiced'] },
  { id: 7,  name: 'Strawberry',     color: '#f43f5e', tags: ['sweet', 'fruity'] },
  { id: 8,  name: 'Grape',          color: '#7c3aed', tags: ['sweet', 'fruity'] },
  { id: 9,  name: 'Peach',          color: '#fdba74', tags: ['sweet', 'fruity', 'tropical'] },
  { id: 10, name: 'Mango',          color: '#fbbf24', tags: ['sweet', 'tropical'] },
  { id: 11, name: 'Pineapple',      color: '#facc15', tags: ['sweet', 'tart', 'tropical'] },
  { id: 12, name: 'Watermelon',     color: '#fb7185', tags: ['sweet', 'fresh'] },
  { id: 13, name: 'Green Apple',    color: '#84cc16', tags: ['sour', 'fruity'] },
  { id: 14, name: 'Coconut',        color: '#f5f5f4', tags: ['creamy', 'tropical'] },
  { id: 15, name: 'Raspberry',      color: '#be185d', tags: ['tart', 'fruity'] },
  { id: 16, name: 'Lemonade',       color: '#fde047', tags: ['sour', 'citrus'] },
  { id: 17, name: 'Root Beer',      color: '#92400e', tags: ['classic', 'spiced', 'creamy'] },
  { id: 18, name: 'Caramel',        color: '#d97706', tags: ['sweet', 'rich'] },
  { id: 19, name: 'Mint',           color: '#34d399', tags: ['cool', 'fresh'] },
];

export const PUMP_COUNT = FLAVORS.length;
