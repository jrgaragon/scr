const utility = require("../../utility/utility");
const Image = require("../../models/image");
const MainGallery = require("../../models/maingallery");
const SubGallery = require("../../models/subgallery");
const Gallery = require("../../models/gallery");
const sharp = require("sharp");
const u = utility.getInstance();

module.exports = app => {
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
        message: mainGallery.id,
      });
    } catch (e) {
      response
        .status(500)
        .send({ status: "error", message: e.message, stack: e.stack });
    }
  });

  app.post("/petite/admin/setSubImage/:imageId", async (request, response) => {
    try {
      const imageId = request.params.imageId;

      let image = await Image.findOne({ id: imageId });

      let subGallery = await SubGallery.findOne({ url: image.gallery });

      subGallery.thumbnail = image.id;
      await subGallery.save();

      response.send({
        status: "done",
        galleryId: subGallery.id,
        galleryUrl: subGallery.url,
        message: `Marked ${subGallery.id}`,
      });
    } catch (e) {
      response
        .status(500)
        .send({ status: "error", message: e.message, stack: e.stack });
    }
  });

  app.post("/petite/admin/download/:galleryId", async (request, response) => {
    let promises = [];
    let mainGallery = await MainGallery.findOne({
      id: request.params.galleryId,
    });
    let galleries = await SubGallery.find({ mainGallery: mainGallery.url });

    for (let gallery of galleries) {
      let images = await Gallery.find({ gallery: gallery.url });

      for (let image of images) {
        console.log(image.url);
        image.download = true;
        promises.push(image.save());
      }

      await Promise.all(promises);
    }
    console.log("done");
    response.send({status: 'done', message: `Marked ${request.params.galleryId}` });
  });

  app.delete("/petite/admin/delete/:imageId", async (request, response) => {
    await Image.deleteOne({ id: request.params.imageId });

    response.send({
      status: "done",
      message: `Image deleted: ${request.params.imageId}`,
    });
  });

  app.delete(
    "/petite/admin/deleteSubGallery/:galleryId",
    async (request, response) => {
      let subGallery = await SubGallery.findOne({
        id: request.params.galleryId,
      });

      console.log(request.params.galleryId);
      let galleries = await Gallery.find({ gallery: subGallery.url });

      await SubGallery.deleteOne({ id: request.params.galleryId });      

      for (gallery of galleries) {
        await Promise.all([
          Gallery.deleteOne({ id: gallery.id }),
          Image.deleteMany({ url: gallery.url }),
        ]);
      }

      response.send({
        status: "done",
        message: `Gallery deleted: ${request.params.galleryId}`,
      });
    }
  );
};
