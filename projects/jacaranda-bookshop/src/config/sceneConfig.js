const defaults = {
  background: null,
  interactive: false,
  motion: false,
  weather: 'clear',
  timeOfDay: 'evening',
  wind: 0.42,
  petals: true,
  reducedMotion: false,
  cameraPosition: [13, 10, 19],
  framingMargin: 1.07,
  maxPixelRatio: 1.75,
  shadowMapSize: 1024,
  bookshop: { position: [1.2, 0, -1.4], width: 5.4, depth: 3.6, wallHeight: 4.1 },
  trees: [
    { position: [-4.65, 0, 0.5], height: 6.7, crownWidth: 5.32, seed: 329, lean: -0.58, spread: 0.85, branchCount: 11, flowerDensity: 1.18 },
    { position: [-2.65, 0, -3.45], height: 6.35, crownWidth: 3.8, seed: 783, lean: 0.55, spread: 0.71, branchCount: 8, flowerColor: '#9f8ac6' },
    { position: [5.05, 0, -3.25], height: 5.1, crownWidth: 3.15, seed: 419, lean: 0.32, branchCount: 7, flowerDensity: 1.06, flowerColor: '#c4a5dc' },
  ],
}

export function resolveConfig(options) {
  const config = {
    ...defaults,
    ...options,
    bookshop: { ...defaults.bookshop, ...options.bookshop },
  }
  config.trees = config.trees.map((tree) => ({
    position: [0, 0, 0], height: 6, crownWidth: 4, ...tree,
  }))
  return config
}
