const utility = require("./utility/utility");
const openConnection = require("./utility/dal");
const Image = require("./models/image");
const MainGallery = require("./models/maingallery");
const SubGallery = require("./models/subgallery");
const Gallery = require("./models/gallery");
const express = require("express");
const config = require("./config");
const ScrapperPetite = require("./functions/petite");
const Log = require("./models/log")

const app = express();

app.use(express.json());
app.use(
  require("body-parser").urlencoded({
    extended: false,
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

require("./routes/site")(app);
require("./routes/admin/adminsite")(app);

app.get("/", (request, response) => {
  response.status(200).send(`App Running on Port ${config.server.port}`);
});

app.get("/scrapper/petite/maingallery", (request, response) => {
  let scrapper = new ScrapperPetite();
  const u = utility.getInstance();

  scrapper.scrapGallery(request.body).then(result => {
    console.log(result);

    Promise.all(
        result.map(page => {
          let mainGallery = new MainGallery({
            id: u.guid(),
            url: page.uri,
            section: "petite",
            status: "",
          });

          return mainGallery.save();
        })
      )
      .then(_ => {
        response.status(200).send({
          status: "done",
          size: result.length,
        });
      })
      .catch(err => {
        response.status(500).send({
          status: "error",
          messasge: err,
        });
      });
  });
});

app.get("/scrapper/petite/subGallery", (request, response) => {
  let scrapper = new ScrapperPetite();
  const u = utility.getInstance();
  MainGallery.find({}, async (err, gallery) => {
    console.log(gallery);
    if (err) {
      response.status(500).send({
        message: err,
      });
    }

    let galleries = gallery.map(g => {
      return {
        uri: g.url,
        xpath: request.body.xpathSubGallery,
      };
    });

    let chunks = await u.splitArray(galleries, request.body.chunkSize);

    console.log(`Chunk Size: ${chunks.length}`);

    for (let chunk of chunks) {
      let p = chunk.map(c => scrapper.getSubGallery(c));
      let results = await Promise.all(p);

      for (i of results) {
        await Promise.all(
          i.map(async r => {
            let exist = await SubGallery.exists({
              url: r.uri,
            });
            if (!exist) {
              let subGallery = new SubGallery({
                id: u.guid(),
                url: r.uri,
                section: "petite",
                status: "",
                mainGallery: r.mainUri,
              });

              return subGallery.save();
            }
          })
        );
      }

      await u.sleep(5000);
    }
    response.status(200).send({
      size: gallery.length,
    });
  });
});

app.get("/scrapper/petite/gallery", (request, response) => {
  const filter = config.filters.galleryFilter;

  let scrapper = new ScrapperPetite();
  const u = utility.getInstance();

  SubGallery.countDocuments(filter, async (err, c) => {
    console.log(`SubGallery Count: ${c}`);
    let pages = Math.ceil(c / request.body.pageSize);
    console.log(`Pages: ${pages}`);

    const resultsPerPage = request.body.pageSize;

    for (let i = 1; i < pages; i++) {
      let results = await SubGallery.find(filter)
        .limit(resultsPerPage)
        .skip(resultsPerPage * (i - 1));

      let gallerieUrls = results.map(r => {
        return scrapper.getGallery({
          uri: r.url,
          id: r.id,
          xpath: request.body.xpathGallery,
        });
      });

      let scrapResults = await Promise.all(gallerieUrls);

      if (scrapResults.length > 0) {
        for (scrapResult of scrapResults) {
          await Promise.all(
            scrapResult.map(async g => {
              let exist = await Gallery.exists({
                url: g.uri,
              });

              if (!exist) {
                console.log(g.uri);
                let gallery = new Gallery({
                  id: u.guid(),
                  url: g.uri,
                  section: "petite",
                  status: "",
                  gallery: g.gallery,
                });

                return gallery.save({}, (err, item) => {
                  SubGallery.findOne({
                      id: g.id,
                    },
                    (e, subGallery) => {
                      subGallery.status = "scrapped";
                      subGallery.save();
                    }
                  );
                });
              } else {
                console.log(`Exist - ${g.id} - ${g.uri}`);

                return SubGallery.findOne({
                    id: g.id,
                  },
                  (e, subGallery) => {
                    subGallery.status = "scrapped";
                    subGallery.save();
                  }
                );
              }
            })
          );
        }
        console.log("Sleeping 1000");
        await u.sleep(1);
      } else {
        console.log("Not");
      }
    }
    console.log(
      "----------------------------------------DONE----------------------------------------"
    );
  });
  response.status(200).send({});
});

app.get("/scrapper/petite/fix", (request, response) => {
  const u = utility.getInstance();
  Gallery.aggregate(
    [{
        $match: {
          fixed: {
            $eq: null,
          },
        },
      },
      {
        $group: {
          _id: "$gallery",
          count: {
            $sum: 1,
          },
        },
      },
    ],
    async function (err, results) {
      if (err) response.status(500).send(err);

      let chunks = await u.splitArray(results, request.body.chunkSize);

      console.log(`Chunks: ${chunks.length}`);

      for (chunk of chunks) {
        for (galleryItem of chunk) {
          let galleryImages = await Gallery.find({
            gallery: galleryItem._id,
          });

          let gallery = galleryImages.map(g => {
            return {
              url: g.url,
              gallery: g.gallery,
            };
          });

          let sequence = [];
          let cleanString = "";

          for (let item of gallery) {
            cleanString = item.url.replace(/[0-9]*\.jpg/g, "");
            let number = GetFilename(item.url);
            if (!isNaN(number)) {
              sequence[parseInt(number) - 1] = {
                index: parseInt(number),
                gallery: item.gallery,
                url: item.url,
              };
            }
          }

          let reference = sequence.filter(d => d)[0];

          for (let i = 0; i < sequence.length; i++) {
            if (!sequence[i]) {
              sequence[i] = {
                url: `${cleanString}${i + 1}.jpg`,
                gallery: reference.gallery,
                index: i + 1,
              };
            }
          }

          let mongoSave = sequence.map(async mongo => {
            let doc = await Gallery.findOne({
              url: mongo.url,
            });

            if (!doc) {
              let gallery = new Gallery({
                id: u.guid(),
                url: mongo.url,
                section: "petite",
                status: "",
                gallery: mongo.gallery,
                fixed: true,
              });
              return gallery.save({}, (err, g) => {
                console.log(g.url);
              });
            } else {
              doc.fixed = true;
              return doc.save({}, (err, g) => {
                console.warn(`EXIST [FIX]- ${g.url}`);
              });
            }
          });

          await Promise.all(mongoSave).then(results => {});
        }
        console.log("Sleep");
        await u.sleep(1000);
      }
    }
  );

  response.send({});
});

function GetFilename(url) {
  if (url) {
    var m = url.toString().match(/.*\/(.+?)\./);
    if (m && m.length > 1) {
      return m[1];
    }
  }
  return "";
}

app.get("/scrapper/petite/fixUrl", (request, response) => {
  const u = utility.getInstance();
  Gallery.aggregate(
    [{
        $match: {
          url: {
            $regex: /\/index\.htm.?[0-9]+\.jpg/i,
          },
        },
      },
      {
        $group: {
          _id: "$gallery",
          count: {
            $sum: 1,
          },
        },
      },
    ],
    async (err, results) => {
      if (err) response.status(500).send(err);

      let chunks = await u.splitArray(results, 100);

      for (chunk of chunks) {
        let promises = chunk.map(item => {
          return Gallery.find({
              gallery: item._id,
            },
            (err, galleryItem) => {
              galleryItem.map((item, index) => {
                let newValue = item.url.replace(
                  /\/index\.htm.?[0-9]+\.jpg/i,
                  `/${index + 1}.jpg`
                );
                console.log(`${item.url} - ${newValue}`);
                item.url = newValue;
                return item.save();
              });
            }
          );
        });

        await Promise.all(promises);
      }
    }
  );
  response.send({});
});

app.get("/scrapper/petite/images", async (request, response) => {
  const u = utility.getInstance();
  const scrapper = new ScrapperPetite();
  const filter = {
    $and: [{
      download: true
    }],
    $or: [{
      status: ""
    }, {
      status: null
    }],
  };

  //{$and: [{download: true}], $or: [ { status: { $ne: 'downloaded'}}, {status: null}, {status: ''}]}

  let galleryCount = await Gallery.countDocuments(filter);
  let pages = Math.ceil(galleryCount / request.body.pageSize);

  response.status(200).send({
    status: "done",
    message: `Processing: Pages[${pages}]`,
  });

  console.log(`Pages: ${pages}`);

  for (let i = 1; pages > 0; i++) {
    let results = await Gallery.find(filter).limit(request.body.pageSize);

    if (results.length === 0) {
      break;
    }

    let promises = results
      .filter(img => typeof img.url !== "undefined")
      .map(img => {
        return scrapper.scrapImage({
          uri: img.url,
          id: img.id,
          gallery: img.gallery,
        });
      });

    let imagesResult = await Promise.all(promises);
    let savePromises = [];

    for (let result of imagesResult) {
      if (result.status === 200) {
        console.log(result.uri);
        let imageId = u.guid();
        
        let imagedbObject = Image({
          id: imageId,
          image: result.image,
          imageName: `${GetFilename(result.uri)}.jpg`,
          url: result.uri,
          section: "petite",
          gallery: result.gallery,
          size: result.image.length,
        });    

        savePromises.push(
          SubGallery.findOneAndUpdate({
            $and: [{
              url: result.gallery
            }],
            $or: [{
              thumbnail: null
            }, {
              thumbnail: ''
            }]
          }, {
            thumbnail: imageId
          })
        );

        savePromises.push(imagedbObject.save());
        savePromises.push(Gallery.findOneAndUpdate({
          id: result.id,
        }, {
          status: "downloaded",
        }));

      } else {
        console.error(`ERROR[${result.uri}]`);
        savePromises.push(Gallery.findOneAndUpdate({
          id: result.id,
        }, {
          status: `ERROR[${result.status}]`,
        }));

        let log = new Log({
          id: u.guid(),
          url: result.uri,          
          fixed: false,
          status: ''  
        });

        savePromises.push(log.save())
      }
    }

    await Promise.all(savePromises);
    console.log(`[${i}] - Sleeping ${request.body.sleepTime}`);

    galleryCount = await Gallery.countDocuments(filter);
    pages = Math.ceil(galleryCount / request.body.pageSize);

    await u.sleep(request.body.sleepTime);
  }
});

app.listen(config.server.port, function () {
  openConnection().then(_ => {
    console.log(`App Listening on Port: ${config.server.port}`);
  });
});