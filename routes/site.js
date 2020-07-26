const utility = require("../utility/utility");
const Image = require("../models/image");
const MainGallery = require("../models/maingallery");
const SubGallery = require("../models/subgallery");
const Gallery = require("../models/gallery");
const sharp = require("sharp");
const u = utility.getInstance();

module.exports = app => {
  app.get("/petite/galleries", async (request, response) => {
    let filter = [{
        $lookup: {
          from: "images",
          localField: "thumbnail",
          foreignField: "id",
          as: "image",
        },
      },
      {
        $project: {
          id: 1,
          url: 1,
          image: {
            $arrayElemAt: ["$image", 0]
          }
        },
      },
    ];
    console.time('maingalleryQuery');
    let galleries = await MainGallery.aggregate(filter);
    console.timeEnd('maingalleryQuery');
    console.time('maingallery');
    let promises = [];

    for (let gallery of galleries) {
      if (gallery.image) {
        console.log(`Has Image: ${gallery.id}`);
        promises.push(
          (async _ => {
            let thumbnail = await sharp(gallery.image.image.buffer)
              .resize(180, 290)
              .toBuffer();

            return {
              id: gallery.id,
              url: gallery.url,
              name: gallery.url.split("/")[4].replace(/_/g, " "),
              thumbnail: `data:image/png;base64, ${thumbnail.toString(
                "base64"
              )}`,
            };
          })()
        );
      } else {
        promises.push(
          (async _ => ({
            id: gallery.id,
            url: gallery.url,
            name: gallery.url.split("/")[4].replace(/_/g, " "),
            thumbnail: "",
          }))()
        );
      }
    }

    let galleriesResult = [];

    try {
      galleriesResult = await Promise.all(promises);
      console.timeEnd('maingallery');
      response.send(galleriesResult.filter(g => g.name));
    } catch (e) {
      console.log(e);
      response
        .status(500)
        .send({
          status: "error",
          message: e.message,
          stack: e.stack
        });
    }
  });

  app.get("/petite/galleries/:id", async (request, response) => {
    let responseImages = [];
    let query = [{
        $match: {
          id: request.params.id
        },
      },
      {
        $lookup: {
          from: "galleries",
          localField: "url",
          foreignField: "gallery",
          as: "galleries",
        },
      },
      {
        $unwind: {
          path: "$galleries",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "images",
          localField: "url",
          foreignField: "gallery",
          as: "galleries.images",
        },
      },
      {
        $unwind: {
          path: "$galleries.images",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            id: "$id",
            url: "$url",
          },
          images: {
            $addToSet: "$galleries.images",
          },
        },
      },
      {
        $project: {
          id: "$_id.id",
          url: "$_id.url",
          images: 1,
        },
      },
    ];

    let subgallery = await SubGallery.aggregate(query);
    let parentGallery = subgallery[0];
    let promises = [];

    for (let g of parentGallery.images) {
      promises.push((async gallery => {
        if (gallery.image) {
          let thumbnail = await sharp(gallery.image.buffer)
            .resize(180, 290)
            .toBuffer();

          return {
            id: parentGallery.id,
            imageId: gallery.id,
            name: await u.GetFilename(parentGallery.url),
            image: `data:image/png;base64, ${thumbnail.toString("base64")}`,
          };
        } else {
          console.log(`Image not found: ${gallery.url}`);
        }
      })(g));
    }

    responseImages = await Promise.all(promises);
    response.send(responseImages.sort((a, b) => a.name - b.name));
  });

  app.get("/petite/subgalleries/:id", async (request, response) => {
    let query = [{
        $match: {
          id: request.params.id
        },
      },
      {
        $lookup: {
          from: "subgalleries",
          localField: "url",
          foreignField: "mainGallery",
          as: "subgalleries",
        },
      },
    ];

    let responseImages = [];
    let promises = [];
    let subGalleries = await MainGallery.aggregate(query);

    for (let subGallery of subGalleries[0].subgalleries) {
      let image = "";

      promises.push(
        (async gallery => {
        
          if (gallery.thumbnail) {
            let imagedbModel = await Image.findOne({
              id: gallery.thumbnail,
            });

            if (imagedbModel) {
              let thumbnail = await sharp(imagedbModel.image)
                .resize(180, 290)
                .toBuffer();

              image = `data:image/png;base64, ${thumbnail.toString("base64")}`;
            }
          }

          return {
            id: gallery.id,
            url: gallery.url,
            name: gallery.url
              .split("/")[4]
              .replace(/_/g, " ")
              .replace(/\-/g, " "),
            thumbnail: image,
            favorite: gallery.favorite
          };
        })(subGallery)
      );
    }

    responseImages = await Promise.all(promises);

    response.send(responseImages.sort((a, b) => {
      if (typeof a.favorite === 'undefined') a.favorite = false;
      if (typeof b.favorite === 'undefined') b.favorite = false;
      return b.favorite - a.favorite;
    }));
  });

  app.get("/petite/image/:id", (request, response) => {
    console.log(request.params.id);

    Image.findOne({
        id: request.params.id,
      },
      (err, img) => {
        if (err) response.status(500).send(err);

        response.send({
          image: `data:image/png;base64, ${img.image.toString("base64")}`,
        });
      }
    );
  });

  app.post("/petite/gallery/favorite/:id", async (request, response) => {
    console.log(request.params.id);

    let gallery = await SubGallery.findOne({
      id: request.params.id
    });

    if (typeof gallery.favorite === 'undefined') {
      gallery.favorite = false;
    }
    gallery.favorite = !gallery.favorite;
    await gallery.save();

    response.send({
      status: 'done',
      message: `Set as favorite ${gallery.id}`
    });

  });
};