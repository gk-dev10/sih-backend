import sharp from "sharp";

export async function isLikelyNSFWSimple(imagePath) {
  try {
    const { data, info } = await sharp(imagePath)
      .resize(64, 64)
      .raw()
      .toBuffer({ resolveWithObject: true });

    let skinPixelCount = 0;
    const totalPixels = info.width * info.height;

    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (
        r > 150 &&
        g > 100 &&
        g < 200 &&
        b > 70 &&
        b < 180 &&
        r > g &&
        r > b &&
        Math.abs(r - g) > 20
      ) {
        skinPixelCount++;
      }
    }

    const skinRatio = skinPixelCount / totalPixels;
    return skinRatio > 0.3;
  } catch (err) {
    console.error("Error in NSFW detection:", err);
    return false;
  }
}
