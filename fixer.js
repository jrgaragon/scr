const utility = require("./utility/utility");
const openConnection = require("./utility/dal");
const Image = require("./models/image");
const MainGallery = require("./models/maingallery");
const SubGallery = require("./models/subgallery");
const Gallery = require("./models/gallery");


const commit = false;

(async _ => {

  await openConnection();

  await t1(/.*melanie.*/, commit);
  await t2(/.*melanie.*/, commit);

  console.log('---DONE---');

})();

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