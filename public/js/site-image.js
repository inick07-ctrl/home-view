// Prepare a panorama or aerial site photo for upload: resize in the browser,
// enforce a ~25 MB cap, and check that a 360° photo is roughly 2:1.
export const SITE_MAX_BYTES = 25 * 1024 * 1024;
const PANO_MAX_W = 4096;
const GROUND_MAX_W = 4096;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });
}

function toJpeg(img, w, h, quality) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Could not compress that image.'));
      else resolve(blob);
    }, 'image/jpeg', quality);
  });
}

export async function prepareSiteImage(file, kind) {
  const okType = /^image\/(jpeg|png|webp)$/i.test(file.type || '') || /\.(jpe?g|png|webp)$/i.test(file.name || '');
  if (!file || !okType) throw new Error('Please choose a JPG, PNG or WebP image.');
  const img = await loadImage(file);
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  if (!w || !h) throw new Error('That image has no size information.');
  if (kind === 'pano') {
    const ar = w / h;
    if (ar < 1.7 || ar > 2.4) {
      throw new Error('A 360° photo needs to be equirectangular (about twice as wide as it is tall, 2:1). This one is ' + w + '×' + h + '.');
    }
  }
  const maxW = kind === 'pano' ? PANO_MAX_W : GROUND_MAX_W;
  let tw = w, th = h;
  if (tw > maxW) { th = Math.round(th * (maxW / tw)); tw = maxW; }
  if (kind === 'pano' && th > maxW / 2) { tw = Math.round(tw * ((maxW / 2) / th)); th = Math.round(maxW / 2); }
  // Prefer a fresh JPEG so HEIC-unrelated pngs and huge originals shrink.
  let quality = 0.88;
  let blob = await toJpeg(img, tw, th, quality);
  while (blob.size > SITE_MAX_BYTES && quality > 0.6) {
    quality -= 0.08;
    blob = await toJpeg(img, tw, th, quality);
  }
  if (blob.size > SITE_MAX_BYTES) {
    const scale = Math.sqrt(SITE_MAX_BYTES / blob.size) * 0.95;
    tw = Math.max(1024, Math.round(tw * scale));
    th = Math.max(512, Math.round(th * scale));
    blob = await toJpeg(img, tw, th, 0.8);
  }
  if (blob.size > SITE_MAX_BYTES) throw new Error('That photo is still over 25 MB after shrinking. Please try a smaller image.');
  const name = (file.name || (kind === 'pano' ? 'panorama' : 'aerial')).replace(/\.[^.]+$/, '') + '.jpg';
  return { file: new File([blob], name, { type: 'image/jpeg' }), width: tw, height: th, contentType: 'image/jpeg' };
}
