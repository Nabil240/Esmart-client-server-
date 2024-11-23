import { ObjectId } from "mongodb";

//all banner display or get
export const getBannerImage = (bannersCollection) => {
  return async (req, res) => {
    try {
      const cursor = await bannersCollection.find().toArray();
      return res.status(200).send(cursor);
    } catch (err) {
      return res.status(500).send({ message: "Not Found", err });
    }
  };
};

// new banner add or post
export const postBannerUpload = (bannersCollection) => {
  return async (req, res) => {
    const bannerImages = req.body;

    try {
      let existingBanner = await bannersCollection.findOne();

      if (!existingBanner) {
        existingBanner = {
          banners: bannerImages,
        };
        await bannersCollection.insertOne(existingBanner);
      } else {
        existingBanner.banners.push(...bannerImages);
        await bannersCollection.updateOne(
          { _id: existingBanner._id },
          {
            $set: { banners: existingBanner.banners },
          }
        );
      }
      return res.status(200).send({ insertedId: true });
    } catch (err) {
      return res.status(500).json({ message: "Server error", err });
    }
  };
};

// update a banner
export const putBannerImages = (bannersCollection) => {
  return async (req, res) => {
    const id = req.params.id;
    const existingImages = req.body;

    try {
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          banners: existingImages,
        },
      };

      const options = { upsert: true };

      const updateBanner = await bannersCollection.updateOne(
        query,
        updateDoc,
        options
      );
      return res.status(200).send(updateBanner);
    } catch (err) {
      return res.status(500).send({ message: "Update Failed", err });
    }
  };
};


