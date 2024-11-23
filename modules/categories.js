import { ObjectId } from "mongodb";

//get all cetegoris load
export const getAllCategories = (categoriesCollection) => {
  return async (req, res) => {
    try{
      const cursor = await categoriesCollection.find().toArray();
    res.send(cursor);
    }
    catch(err){
      return res.status(500).send({ message: "Not Found", err });
    }
  };
};

// add new categories
export const postNewCategories = (categoriesCollection) => {
  return async (req, res) => {
    const { categoryName } = req.body;
    const addNewCategory = ["all", categoryName];

    const query = { categoryName: addNewCategory };

   try{
    const alreadeyAdded = await categoriesCollection.findOne(query);
    if (alreadeyAdded) {
      return res.status(200).send({
        success: false,
        message: "This category already added",
      });
    }
    const newAddCategory = await categoriesCollection.insertOne({
      categoryName: addNewCategory,
    });
    return res.status(200).send(newAddCategory);
   }
   catch(err){
    return res.status(404).send({message : "Category Creation Failed!"})
   }
  };
};

/////////////////////// Testing Incomplete.

//update specific category
export const putCategoryUpdate = (categoriesCollection, productsCollection) => {
  return async (req, res) => {
    try {
      const id = req.params.id;
      const { oldCategoryName, updateCategoryName } = req.body;

     
      if (!id || !oldCategoryName || !updateCategoryName) {
        return res.status(400).send({ message: "Invalid input data" });
      }

      await productsCollection.updateMany(
        { productCategory: oldCategoryName },
        { $set: { "productCategory.$": updateCategoryName } },
        
      );
      
      

      const query = { _id: new ObjectId(id), categoryName: oldCategoryName };
      const updateDoc = {
        $set: { "categoryName.$": updateCategoryName },
      };
      const options = {
        
        upsert: false
      };

      const categoryUpdateresult = await categoriesCollection.updateOne(
        query,
        updateDoc,
        options
      );

      if (categoryUpdateresult.matchedCount === 0) {
        return res.status(404).send({ message: "Category not found" });
      }
      return res.status(200).send(categoryUpdateresult);
    } catch (err) {
      return res.status(500).send({ message: "An error occurred", err });
    }
  };
};

// category datele
export const deleteCategoryOne = (categoriesCollection, productsCollection) => {
  return async (req, res) => {
    try{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      
      const category = await categoriesCollection.findOne(query)
     
     
      if (!id || !category) {
        return res.status(400).send({ message: "Invalid input data" });
      }

       await productsCollection.updateMany(
        { productCategory: category.categoryName },
        { $set: {productCategory : ['all', 'empty'] } },
        
      );
      
      
     

     
      const deleteResult = await categoriesCollection.deleteOne(query);
      return res.status(200).send(deleteResult);

    } 
    catch(err){
      return res.status(500).send({ message: "An error occurred", err });
    }
   
  };
};
