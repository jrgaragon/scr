const scrapper = require("./scrapper");
const axios = require("axios");
const xpath = require("xpath-html");
const fs = require("fs");
const { RSA_NO_PADDING } = require("constants");
const utility = require("../utility/utility");
const { Console } = require("console");

class petite extends scrapper {
  constructor() {
    super({});
  }

  async scrap(config) {
    const u = utility.getInstance();
    try {
      let images = [];
      let nodes = await super.scrap(config);

      if (nodes) {
        let uriList = nodes.map(n => {
          if (n) {
            let imageName = n.getAttribute("href");

            return {
              uri: `${config.uri}${imageName}`,
              imageName: imageName,
            };
          }
        });

        let chunks = await u.splitArray(uriList, 5);

        console.log(`Image Chunk Size:${chunks.length}`);

        for (let chunk of chunks) {
          let uriListPromise = chunk.map(item => this.getImage(item.uri));

          let promiseResult = await Promise.all(uriListPromise);

          images.push(
            ...promiseResult.map(image => {
              let imageName = image.request.path.replace(/\//g, "_");
              let model = image.config.url.split("/")[4];

              return {
                name: imageName,
                data: image.data,
                uri: image.config.url,
                section: "petite",
                model: model,
              };
            })
          );
        }
        return images;
      } else {
        return [];
      }
    } catch (e) {
      console.error(`EXCEPTION ${e.message} - ${config.uri}`);
      return [];
    }
  }

  async scrapPetite(config) {
    let urls = await this.scrapSubGallery(config);
    const u = utility.getInstance();
    let images = [];

    let chunks = await u.splitArray(urls, 5);

    for (let chunk of chunks) {
      let p = chunk.map(u =>
        this.scrap({ uri: u, xpath: config.xpathGallery })
      );

      let image = await Promise.all(p);

      image.forEach(i => {
        images.push(...i);
      });

      console.log(images);
      console.log(`Sleeping: 5000`);
      await u.sleep(5000);
    }

    return images;
  }

  async scrapGallery(config) {
    let dtoConfig = {
      uri: config.uri,
      xpath: config.xpathMain,
    };

    let mainGallery = await super.scrap(dtoConfig);

    let uriList = mainGallery.map(n => {
      let url = n.getAttribute("href");
      return {
        uri: `${config.uri.replace("/index.html", "")}${url.slice(1)}`,
        imageName: url,
      };
    });

    return uriList;
  }

  async getGallery(config) {
    let urls = await super.scrap(config);

    return urls.map(s => {
      let t = s.getAttribute("href");
      t = `${config.uri.replace(/\/index\.htm.?/, "")}${t}`;
      if (t && this.isValidDomain(t)) {
        return { uri: t, gallery: config.uri, id: config.id };
      }
    })
    .filter(t => typeof t !== "undefined");
  }

  async getSubGallery(config) {
    const u = utility.getInstance();

    let subGallery = await super.scrap(config);

    console.log(`SubGallery Size: ${subGallery.length} - ${config.uri}`);

    return subGallery
      .map(s => {
        let t = s.getAttribute("href");
        if (t && this.isValidDomain(t)) {
          return { uri: t, mainUri: config.uri };
        }
      })
      .filter(t => typeof t !== "undefined");
  }

  async scrapSubGallery(config) {
    let subGalleries = await this.scrapGallery(config);
    const u = utility.getInstance();
    let sleepingTime = 5000;
    let urls = [];

    console.log(`Galleries: ${subGalleries.length}`);

    let chunks = await u.splitArray(subGalleries, 10);

    console.log(`Chunks: ${chunks.length}`);

    let count = 1;
    for (let chunk of chunks) {
      let scrapSubGalleryResult = await Promise.all(
        chunk.map(g =>
          super.scrap({ uri: g.uri, xpath: config.xpathSubGallery })
        )
      );

      urls.push(...(await this.getSubGalleryUrls(scrapSubGalleryResult)));

      console.log(`Urls Count: ${urls.length}`);
      console.log(`${count} - Sleeping: ${sleepingTime}`);
      await u.sleep(sleepingTime);
      count++;
    }

    console.log(`Urls: ${urls.length}`);
    return urls;
  }

  async getSubGalleryUrls(collection) {
    let urls = [];
    collection.forEach(item => {
      if (item) {
        let temp = item
          .map(a => {
            let u = a.getAttribute("href");
            if (u && this.isValidDomain(u)) {
              return u;
            }
          })
          .filter(t => typeof t !== "undefined");

        urls.push(...temp);
      }
    });
    return urls;
  }

  isValidDomain(url) {
    const domains = ["ptclassic", "petiteteenager", "petiteteenagerr"];

    for (let d of domains) {
      if (url.indexOf(d) > -1 && url.indexOf("movie") === -1) {
        return true;
      }
    }
    return false;
  }

  async scrapImage(config) {
    let image = await super.getImage(config.uri);
    return {
      image: image.data,
      id: config.id,
      gallery: config.gallery,
      status: image.status,
      uri: config.uri
    }
  }
}

module.exports = petite;
