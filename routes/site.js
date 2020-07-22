const utility = require("../utility/utility");
const Image = require("../models/image");
const MainGallery = require("../models/maingallery");
const SubGallery = require("../models/subgallery");
const Gallery = require("../models/gallery");
const sharp = require("sharp");
const u = utility.getInstance();

module.exports = app => {
  app.get("/petite/galleries", async (request, response) => {
    let mainGalleries = await MainGallery.find({});
    let galleries = [];

    for (let mainGallery of mainGalleries) {
      let image = "";

      let imagedbModel = await Image.findOne({
        id: mainGallery.thumbnail,
      });

      if (imagedbModel) {
        let thumbnail = await sharp(imagedbModel.image)
          .resize(180, 290)
          .toBuffer();

        image = `data:image/png;base64, ${thumbnail.toString("base64")}`;
      }

      galleries.push({
        id: mainGallery.id,
        url: mainGallery.url,
        name: mainGallery.url.split("/")[4].replace(/_/g, " "),
        thumbnail: image,
      });
    }

    response.send(galleries.filter(g => g.name));
  });

  app.get("/petite/galleries/:id", async (request, response) => {
    let responseImages = [];

    let subGallery = await SubGallery.findOne({ id: request.params.id });

    if (subGallery) {
      let galleries = await Gallery.find({ gallery: subGallery.url });
      if (galleries) {
        for (let gallery of galleries) {
          let image = await Image.findOne({ url: gallery.url });

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

  app.get("/petite/subgalleries/:id", (request, response) => {
    MainGallery.findOne({ id: request.params.id }, (err, mainGallery) => {
      SubGallery.find({ mainGallery: mainGallery.url }, (err, subGalleries) => {
        response.send(
          subGalleries.map(subGallery => ({
            id: subGallery.id,
            url: subGallery.url,
            name: subGallery.url
              .split("/")[4]
              .replace(/_/g, " ")
              .replace(/\-/g, " "),
          }))
        );
      });
    });
  });

  app.get("/petite/image/:id", (request, response) => {
    console.log(request.params.id);

    Image.findOne({ id: request.params.id }, (err, img) => {
      if (err) response.status(500).send(err);

      response.send({
        image: `data:image/png;base64, ${img.image.toString("base64")}`,
      });
    });
  });

  app.post("/petite/admin/setMainImage/:imageId", async (request, response) => {
    try {
      const imageId = request.params.imageId;

      let image = await Image.findOne({ id: imageId });
      let subGallery = await SubGallery.findOne({ url: image.gallery });
      let mainGallery = await MainGallery.findOne({
        url: subGallery.mainGallery,
      });

      mainGallery.thumbnail = image.id;
      await mainGallery.save();

      response.send({
        status: "done",
        galleryId: mainGallery.id,
        galleryUrl: mainGallery.url,
      });
    } catch (e) {
      response
        .status(500)
        .send({ status: "error", message: e.message, stack: e.stack });
    }
  });
};
