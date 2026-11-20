// Heated / garage / porch sf for each public example (from the model files).
export const EXAMPLE_AREAS = {
  'smith-01': { heated: 2869, garage: 843, porch: 415, buildType: 'home' },
  'smith-02': { heated: 2765, garage: 730, porch: 1257, buildType: 'home' },
  'smith-03': { heated: 3063, garage: 1367, porch: 1024, buildType: 'home' },
  'smith-04': { heated: 4518, garage: 980, porch: 2269, buildType: 'home' },
  'smith-05': { heated: 2837, garage: 541, porch: 970, buildType: 'home' },
  'smith-06': { heated: 3109, garage: 833, porch: 595, buildType: 'home' },
  'smith-07': { heated: 2640, garage: 816, porch: 936, buildType: 'home' },
  'smith-08': { heated: 2798, garage: 805, porch: 481, buildType: 'home' },
  'smith-09': { heated: 3359, garage: 733, porch: 1731, buildType: 'home' },
  'smith-10': { heated: 1853, garage: 768, porch: 591, buildType: 'home' },
  'smith-11': { heated: 2479, garage: 528, porch: 599, buildType: 'home' },
  'smith-12': { heated: 2156, garage: 663, porch: 621, buildType: 'home' },
  'tiny-01': { heated: 310, garage: 0, porch: 0, buildType: 'tiny' },
  'tiny-02': { heated: 500, garage: 0, porch: 70, buildType: 'tiny' },
  'tiny-03': { heated: 540, garage: 0, porch: 128, buildType: 'tiny' },
  'tiny-04': { heated: 384, garage: 0, porch: 144, buildType: 'tiny' },
  'aframe-01': { heated: 950, garage: 0, porch: 280, buildType: 'aframe' },
  'aframe-02': { heated: 1450, garage: 0, porch: 640, buildType: 'aframe' },
  'aframe-03': { heated: 2150, garage: 576, porch: 480, buildType: 'aframe' },
  'single-wide-01': { heated: 1216, garage: 0, porch: 32, buildType: 'trailer' },
  'double-wide-01': { heated: 1568, garage: 0, porch: 48, buildType: 'trailer' },
};

export function areasForExample(id) {
  const a = EXAMPLE_AREAS[id];
  return a ? { heated: a.heated, garage: a.garage, porch: a.porch, buildType: a.buildType } : null;
}
