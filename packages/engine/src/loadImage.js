// Load an image file (PNG, SVG, ...) and wait until it's ready to draw.
//
// Images load in the background: setting image.src starts the download, and
// the browser calls onload when it's done. Drawing the image before that
// draws nothing. Wrapping it in a Promise lets the caller simply write
//
//   const image = await loadImage('assets/map.svg');
//
// and continue once the image is ready.
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${url}`));
    image.src = url;
  });
}
