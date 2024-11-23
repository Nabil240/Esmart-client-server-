import { ObjectId } from "mongodb";

export const getAllCartsRead = (cartsCollection) => {
  return async (req, res) => {
    const email = req.user.email;

   try{
    const cartsResults = await cartsCollection
    .aggregate([
      { $match: { email: email } },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
          totalPrice: { $sum: { $multiply: ["$quantity", "$productPrice"] } },
          carts: { $push: "$$ROOT" },
        },
      },
    ])
    .toArray();

  if (cartsResults.length === 0) return res.send([]);

  return res.status(200).send({
    totalQuantity: cartsResults[0].totalQuantity,
    totalPrice: cartsResults[0].totalPrice,
    carts: cartsResults[0].carts,
  });
   }
   catch(err){
    return res.status(400).send({message : "Carts Loading Failed!"})
   }
  };
};

export const postNewAddToCarts = (cartsCollection) => {
  return async (req, res) => {
    const cartInfo = req.body;

   try{
       const insertCartsResult = await cartsCollection.insertOne(cartInfo);
       return res.status(200).send(insertCartsResult);

   }
   catch(err){
    return res.status(400).send({message : 'Operation Failed!'})
   }

  };
};

export const updateAddToCarts = (cartsCollection) => {
  return async (req, res) => {
    const id = req.params.id;
    const { quantity } = req.body;

    const query = { _id: new ObjectId(id) };

    const updateDoc = {
      $set: {
        quantity: quantity,
      },
    };

   try{
    const updateResult = await cartsCollection.updateOne(query, updateDoc);
    return res.status(200).send(updateResult);
   }
   catch(err){
    return res.status(400).send({message : "Cart Update Failed"})
   }
  };
};

export const deleteOneCart = (cartsCollection) => {
  return async (req, res) => {
    const id = req.params.id;

    const query = { _id: new ObjectId(id) };

   try{
    const deleteResult = await cartsCollection.deleteOne(query);
    return res.status(200).send(deleteResult);
   }
   catch(err){
    return res.status(400).send({message : "Delete Operation Failed!"})
   }
  };
};
