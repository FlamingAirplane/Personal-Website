// Big photos are the main thing that slows a site down, so pictures are
// scaled down to a sensible width in the browser before they are uploaded.

const MAX_WIDTH = 1600;
const SHRINKABLE = ['image/jpeg', 'image/png', 'image/webp'];

/** The picture itself, or a copy scaled down to at most 1600 pixels wide. GIFs and SVGs are left alone. */
export async function prepareImage(file: File): Promise<Blob> {
  if (!SHRINKABLE.includes(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width <= MAX_WIDTH) {
      bitmap.close();
      return file;
    }
    const scale = MAX_WIDTH / bitmap.width;
    const canvas = document.createElement('canvas');
    canvas.width = MAX_WIDTH;
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const scaled = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, file.type, 0.88));
    return scaled && scaled.size < file.size ? scaled : file;
  } catch {
    return file;
  }
}
