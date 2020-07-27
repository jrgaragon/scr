const sharp = require("sharp");
class ImageUtility {
    async resize(image) {
        let q = 90;
        let sharpImage = sharp(image);
        let imageBuffer;
        let metadata = await sharpImage.metadata();

        if (metadata.height > 1000) {
            imageBuffer = await sharpImage.resize({
                fit: sharp.fit.contain,
                height: 1000
            }).webp({
                quality: q
            }).toBuffer();
        } else {
            imageBuffer = await sharpImage.webp({
                quality: q
            }).toBuffer();
        }

        if (imageBuffer.length < image.length) {
            return imageBuffer;
        } else {
            console.log(`Not worth it -  [${image.length/1000}x${imageBuffer.length/1000}] - [${metadata.width}x${metadata.height}]`);
            return image;
        }
    }
}

module.exports = ImageUtility;