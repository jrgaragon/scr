const utility = require("./utility/utility");
const openConnection = require("./utility/dal");
const Image = require("./models/image");
const MainGallery = require("./models/maingallery");
const SubGallery = require("./models/subgallery");
const Gallery = require("./models/gallery");
const sharp = require("sharp");
const {
  request
} = require("express");
const u = utility.getInstance();
const fs = require('fs');


const commit = false;

(async _ => {

  await openConnection();

  // await t1(/.*melanie.*/, commit);
  // await t2(/.*melanie.*/, commit);
  await t3('c7f36661-873f-41ef-afa7-734b569c7879');

  console.log('---DONE---');

})();

const t3 = async (imageId) => {

  let image = await Image.findOne({
    id: imageId
  });

  let q = 90;
  let sharpImage = sharp(image.image);
  let imageBuffer;
  let metadata = await sharpImage.metadata();

  console.log(`${image.url}  -  [${metadata.width}x${metadata.height}]`);

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

  if(imageBuffer.length < image.size) {
    image.size = imageBuffer.length;
    image.image = imageBuffer;

    image.save();
  }else {
    console.log('Not worth it');
  }

}

const t2 = async (filter, commit) => {
  let results = await Gallery.find({
    $and: [{
      status: /ERROR\[[0-9]*\]/i
    }, {
      url: filter
    }]
  });
  let promises = [];

  for (let item of results) {
    let preNewUrl = item.url.replace(/([0-9]*\.JPG[0-9]*\.jpg)$/, '');
    let imageName = item.url.match(/([0-9]*\.jpg)$/)[0];
    let newUrl = `${preNewUrl}${imageName.toUpperCase()}`;

    console.log(newUrl);

    if (commit) {
      promises.push(Gallery.findOneAndUpdate({
        id: item.id
      }, {
        url: newUrl,
        status: ''
      }));
    }
  }

  console.log(results.length);
  return Promise.all(promises);
}

const t1 = async (filter, commit) => {
  let results = await Gallery.find({
    $and: [{
      url: /\d*\.JPG\d*\.jpg/i
    }, {
      url: filter
    }]
  });

  console.log(results.length);

  let promises = [];

  for (let item of results) {
    let preNewUrl = item.url.replace(/([0-9]*\.JPG[0-9]*\.jpg)$/, '');
    let imageName = item.url.match(/([0-9]*\.jpg)$/)[0];
    let newUrl = `${preNewUrl}${imageName.toUpperCase()}`;
    console.log(newUrl);

    if (commit) {
      promises.push(Gallery.findOneAndUpdate({
        id: item.id
      }, {
        url: newUrl
      }));
    }
  }

  return Promise.all(promises);
}