const utility = require("./utility/utility");
const openConnection = require("./utility/dal");
const Image = require("./models/image");
const MainGallery = require("./models/maingallery");
const SubGallery = require("./models/subgallery");
const Gallery = require("./models/gallery");
const sharp = require("sharp");
const u = utility.getInstance();

const commit = false;

(async _ => {

  await openConnection();
  

  // await t1(/.*melanie.*/, commit);
  // await t2(/.*melanie.*/, commit);
  await t3();

  // let imagesCount = await Image.countDocuments();
  // let resultPerPage = 100;
  // let pages = Math.ceil(imagesCount / resultPerPage);
  // let promises = [];

  // console.log(`Count ${imagesCount}`)
  // console.log(`Pages: ${pages}`);
  // console.log(`Result per Pages: ${resultPerPage}`);

  // for (let i = 1; pages > 0; i++) {
  //   let images = await Image.find({
  //     imageName: /jpg$/i
  //   }).limit(resultPerPage).skip(resultPerPage * (i - 1));

  //   for (let image of images) {
  //     image.imageName = image.imageName.toLowerCase().replace('jpg', 'webp');
  //     console.log(`${image.url} - ${image.imageName}`);
  //     promises.push(image.save());
  //   }

  //   await Promise.all(promises); 
  //   imagesCount = await Image.find({
  //     imageName: /jpg$/i
  //   }).count();
  //   pages = Math.ceil(imagesCount / resultPerPage);
  //   console.log(`Pages: ${pages}`);

  //   await u.sleep(100);
  // }

  console.log('---DONE---');

})();

const t3 = async _ => {

  let imagesCount = await Image.find({
    imageName: /.*\.jpg/
  }).count();
  let resultPerPage = 100;
  let pages = Math.ceil(imagesCount / resultPerPage);
  let promises = [];

  console.log(`Count ${imagesCount}`)
  console.log(`Pages: ${pages}`);
  console.log(`Result per Pages: ${resultPerPage}`);

  for (let i = 1; i < pages; i++) {
    let images = await Image.find({
      imageName: /.*\.jpg/
    }).limit(resultPerPage).skip(resultPerPage * (i - 1));

    for (let image of images) {
      promises.push(t4(image));
    }

    await Promise.all(promises);
    await u.sleep(500);
  }

}

const t4 = async (image) => {
  let q = 90;
  let sharpImage = sharp(image.image);
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

  console.log(`${image.url}  [${image.size/1000}x${imageBuffer.length/1000}] - [${metadata.width}x${metadata.height}]`);

  if (imageBuffer.length < image.size) {

    image.imageName = image.imageName.replace('jpg', 'webp');
    console.log(image.imageName);
    image.size = imageBuffer.length;
    image.image = imageBuffer;

    if (commit) {
      image.save();
    }
  } else {
    console.log(`Not worth it -  ${image.url}  [${image.size/1000}x${imageBuffer.length/1000}] - [${metadata.width}x${metadata.height}]`);
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