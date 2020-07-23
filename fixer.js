const utility = require("./utility/utility");
const openConnection = require("./utility/dal");
const Image = require("./models/image");
const MainGallery = require("./models/maingallery");
const SubGallery = require("./models/subgallery");
const Gallery = require("./models/gallery");


(async _ => {
   

    let promises = [];

    await openConnection();

 //http://galleries8.petiteteenager.com/2/onlyopaques/pifbd11.JPG]

let t = await Gallery.find({$and: [{url: /[a-zA-Z]+[0-9]*\.JPG$/}, {url: /.*only.*/}]});
    console.log(t.length);

    for (let url of t) {
        // let fixed = url.replace(/\/[0-9]*\.JPG/, '/').replace(/jpg$/, 'JGP');
        // promises.push(Gallery.findOneAndUpdate({ url: fixed }, { status: '' }));
        //console.log(url)
        //url.status = '';
        console.log(url.url);
        //promises.push(url.save());
    }

    await Promise.all(promises);
    console.log(t.length);
    console.log('done');

})();


