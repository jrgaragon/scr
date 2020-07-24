const utility = require("../utility/utility");
const Image = require("../models/image");
const MainGallery = require("../models/maingallery");
const SubGallery = require("../models/subgallery");
const Gallery = require("../models/gallery");
const sharp = require("sharp");
const u = utility.getInstance();

module.exports = app => {
  app.get("/petite/galleries", async (request, response) => {
    let filter = [
      {
        $lookup: {
          from: "images",
          localField: "thumbnail",
          foreignField: "id",
          as: "image",
        },
      },
      {
        $project: { id: 1, url: 1, image: { $arrayElemAt: ["$image", 0] } },
      },
    ];

    let galleries = await MainGallery.aggregate(filter);

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
            thumbnail: '',
          }))()
        );
      }
    }

    let galleriesResult = [];

    try {
      galleriesResult = await Promise.all(promises);      
      response.send(galleriesResult.filter(g=> g.name));
    } catch (e) {
      console.log(e);
      response
        .status(500)
        .send({ status: "error", message: e.message, stack: e.stack });
    }
  });

  app.get("/petite/galleries/:id", async (request, response) => {
    let responseImages = [];

    let subGallery = await SubGallery.findOne({
      id: request.params.id,
    });

    if (subGallery) {
      let galleries = await Gallery.find({
        gallery: subGallery.url,
      });
      if (galleries) {
        for (let gallery of galleries) {
          let image = await Image.findOne({
            url: gallery.url,
          });

          if (image) {
            let thumbnail = await sharp(image.image)
              .resize(180, 290)
              .toBuffer();

            responseImages.push({
              id: gallery.id,
              imageId: image.id,
              name: await u.GetFilename(gallery.url),
              image: `data:image/png;base64, ${thumbnail.toString("base64")}`,
            });
          } else {
            console.log(`Image not found: ${gallery.url}`);
          }
        }
      } else {
        console.error(`Gallery not found ${subGallery.url}`);
      }
    } else {
      console.error(`Subgallery not found ${request.params.id}`);
    }

    response.send(responseImages.sort((a, b) => a.name - b.name));
  });

  app.get("/petite/subgalleries/:id", async (request, response) => {
    let responseImages = [];
    let mainGallery = await MainGallery.findOne({
      id: request.params.id,
    });
    let subGalleries = await SubGallery.find({
      mainGallery: mainGallery.url,
    });

    for (let subGallery of subGalleries) {
      let image = "";

      if (subGallery.thumbnail) {
        let imagedbModel = await Image.findOne({
          id: subGallery.thumbnail,
        });

        if (imagedbModel) {
          let thumbnail = await sharp(imagedbModel.image)
            .resize(180, 290)
            .toBuffer();

          image = `data:image/png;base64, ${thumbnail.toString("base64")}`;
        }
      }

      responseImages.push({
        id: subGallery.id,
        url: subGallery.url,
        name: subGallery.url
          .split("/")[4]
          .replace(/_/g, " ")
          .replace(/\-/g, " "),
        thumbnail: image,
      });
    }
    response.send(responseImages);
  });

  app.get("/petite/image/:id", (request, response) => {
    console.log(request.params.id);

    Image.findOne(
      {
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
};
