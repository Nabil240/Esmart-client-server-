import { ObjectId } from "mongodb";

// all favorite product read or load
export const getAllFavoriteProduct = (
  favoritesCollection,
  productsCollection
) => {
  return async (req, res) => {
    const email = req.user.email; 
    const { dataLoad = 10 } = req.query;

    try {
      const favoriteProducts = await favoritesCollection
        .find({ email : email })
        .sort({ createdAt: -1 })
        .limit(Number(dataLoad))
        .toArray();

      const productIds = favoriteProducts.map(
        (item) => new ObjectId(item.product_id)
      );

      const favoriteResults = await productsCollection
        .aggregate([
          {
            $match: { _id: { $in: productIds } },
          },
          {
            $project: {
              _id: 1,
              productName: 1,
              finalPrice: 1,
              discountPercent: 1,
              averageRating: 1,
              totalRatingsCount: 1,
              images: 1,
              ratings : 1,
            },
          },
        ])
        .toArray();

      const totalResult = await favoritesCollection.countDocuments({ email });
      return res.status(200).send({ favoriteResults, totalResult });
    } catch (err) {
      return res.status(404).send({ message: "Result Not Found!" });
    }
  };
};

//favorite product check
export const getCheckFavoriteProduct = (favoritesCollection) => {
  return async (req, res) => {
    const {product_id} = req.query;
    const email = req.user.email;

    const query = {
      product_id,
      email: email,
    };

    try {
      const favoriteProduct = await favoritesCollection.findOne(query);
      if (favoriteProduct) {
        return res.status(200).send({ status: true });
      } else {
        return res.status(200).send({ status: false });
      }
    } catch (err) {
      return res.status(400).send({ message: "Server Error!" });
    }
  };
};

//add or post new favorite product
export const postNewFavoriteProduct = (favoritesCollection) => {
  return async (req, res) => {
    const { email, product_id } = req.body;

    try {
      const existingFavorite = await favoritesCollection.findOne({
        email,
        product_id,
      });
      if (existingFavorite) {
        return res
          .status(400)
          .send({ message: "Product already added to favorites" });
      }

      const postReults = await favoritesCollection.insertOne({
        email,
        product_id,
        createdAt: new Date(),
      });
      return res.status(200).send(postReults);
    } catch (err) {
      return res.status(404).send({ message: "Result Not Found!" });
    }
  };
};

//favorite product delete
export const deleteFavoriteProduct = (favoritesCollection) => {
  return async (req, res) => {
    const { email, product_id } = req.body;

    const query = { email, product_id };

    try {
      const deleteResult = await favoritesCollection.deleteOne(query);
      return res.status(200).send(deleteResult);
    } catch (err) {
      return res.status(400).send({ message: "Deletion Feaild!" });
    }
  };
};

//favorite product clear all
export const deleteFavoriteClearAll = (favoritesCollection) => {
  return async (req, res) => {
    const email = req.params.email;

    try {
      const deleteResult = await favoritesCollection.deleteMany({ email });
      return res.status(200).send(deleteResult);
    } catch (err) {
      return res.status(400).send({ message: "Operation Failed!" });
    }
  };
};
