export const animals = [
  { id: 'aardvark', name: 'Aardvark' },
  { id: 'cat', name: 'Cat' },
  { id: 'dog', name: 'Dog' },
  { id: 'kangaroo', name: 'Kangaroo' },
  { id: 'panda', name: 'Panda' },
  { id: 'snake', name: 'Snake' },
]

export const longOptions = Array.from({ length: 1500 }, (_, i) => ({
  id: `opt-${i + 1}`,
  name: `Option ${String(i + 1).padStart(4, '0')}`,
}))

export const fruitsBySection = [
  {
    title: 'Citrus',
    items: [
      { id: 'lemon', name: 'Lemon' },
      { id: 'lime', name: 'Lime' },
      { id: 'orange', name: 'Orange' },
    ],
  },
  {
    title: 'Berries',
    items: [
      { id: 'blueberry', name: 'Blueberry' },
      { id: 'raspberry', name: 'Raspberry' },
      { id: 'strawberry', name: 'Strawberry' },
    ],
  },
]
