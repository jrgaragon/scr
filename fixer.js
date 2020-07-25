const utility = require("./utility/utility");
const openConnection = require("./utility/dal");
const Image = require("./models/image");
const MainGallery = require("./models/maingallery");
const SubGallery = require("./models/subgallery");
const Gallery = require("./models/gallery");


(async _ => {
   

    let promises = [];

    await openConnection(); 

    let results = await Gallery.find({$and: [{status: /ERROR\[[0-9]*\]/i}, {url: /.*carla.*/}]});
    console.log(results.length);
   

    for (let item of results) {    
        // let preNewUrl = item.url.replace(/([0-9]*\.JPG[0-9]*\.jpg)$/, '');
        // let imageName = item.url.match (/([0-9]*\.jpg)$/)[0];
        // let newUrl = `${preNewUrl}${imageName.toUpperCase()}`;
        console.log(item);        

        promises.push(Gallery.findOneAndUpdate({id: item.id }, {status: ''}));
    }

    await Promise.all(promises);
    console.log(results.length);
    console.log('done');

})();

function groupBy(objectArray, property) {
    return objectArray.reduce(function (acc, obj) {
      var key = obj[property];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
      return acc;
    }, {});
  }

//   function t1() {
//         let results = await Gallery.find({$and: [{url: /\d*\.JPG\d*\.jpg/i}, {url: /.*carla.*/}]});
//         console.log(results.length);
//         let urls = [];

//         for (let item of results) {    
//             let preNewUrl = item.url.replace(/([0-9]*\.JPG[0-9]*\.jpg)$/, '');
//             let imageName = item.url.match (/([0-9]*\.jpg)$/)[0];
//             let newUrl = `${preNewUrl}${imageName.toUpperCase()}`;
//             console.log(newUrl);        

//             promises.push(Gallery.findOneAndUpdate({id: item.id }, {url: newUrl}));
//         }
//   }
  


