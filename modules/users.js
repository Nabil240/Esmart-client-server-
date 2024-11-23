import { ObjectId } from "mongodb";
import { jwtTokenCreate } from "./jwt.js";

export const getUserInformation = (usersCollection) => {
  return async(req, res) => {
    const email = req.user.email; 

    const query = {email : email}; 

    try{  
      const userInfoResult = await usersCollection.findOne(query); 
      return res.status(200).send(userInfoResult); 

    }

    catch(err){
      return res.status(404).send({message : 'not found'})
    }

  }
}


//only all normal users loaded
export const getAllUsers = (usersCollection) => {
  return async (req, res) => {
    const {dataLoad = 10, search} = req.query;  
    let query = { type: "user" };

    if(search){
      const searchQuery = {
        $or : [
          {email : {$regex : search, $options : 'i'}},
          {phone : {$regex : search, $options : 'i'}}
        ]
      } 

      if(ObjectId.isValid(search)){
        searchQuery.$or.push({_id : new ObjectId(search)})
      }

      query = {$and : [query, searchQuery]}
    }

   

    try{
      const usersResults = await usersCollection.find(query).limit(Number(dataLoad)).sort({createdAt : -1}).toArray();
      const totalResults = await usersCollection.countDocuments(query)

    return  res.status(200).send({users : usersResults, totalResults});
    }
    catch(err){
      return res.status(400).send({message : 'Operation Failed!'})
    }
  };
};



//only all manager, admin, moderator loaded
export const getAllAdmin = (usersCollection) => {
  return async (req, res) => {
    const {dataLoad = 10, search} = req.query; 
    let query = { type: { $ne: "user" } };
    if(search){
      const searchQuery = {
        $or : [
          {email : {$regex : search, $options : 'i'}},
          {phone : {$regex : search, $options : 'i'}}
        ]
      } 

      if(ObjectId.isValid(search)){
        searchQuery.$or.push({_id : new ObjectId(search)})
      }

      query = {$and : [query, searchQuery]}
    }

    try{
      const usersResults = await usersCollection
      .aggregate([
        { $match: query },
        {
          $addFields: {
            sortOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", "manager"] }, then: 1 },
                  { case: { $eq: ["$type", "admin"] }, then: 2 },
                  { case: { $eq: ["$type", "moderator"] }, then: 3 },
                ],
                default: 4,
              },
            },
          },
        },
        { $sort: { sortOrder: 1} },
      ]).limit(Number(dataLoad))
      .toArray();
      const totalResults = await usersCollection.countDocuments(query); 

     return res.status(200).send({users : usersResults, totalResults});
    }
    catch(err){
      return res.status(400).send({message : 'Operation Failed'})
    }
  };
};

// single user post in users collection or user sign UP
export const postSingleUser = (usersCollection) => {
  return async (req, res) => {
    const { email, type, isBaned } = req.body;
    const newUserToken = { email: email, type: type, isBaned: isBaned };

    const newUser = req.body;
    newUser.createdAt = new Date(); 

    const query = { email: newUser.email };

    try{
      const alreadyExists = await usersCollection.findOne(query);

    if (alreadyExists) {
      const alreadyExistsUserToken = {
        email: newUser.email,
        type: alreadyExists.type,
        isBaned: alreadyExists.isBaned,
      };
      
      const updateDoc = {
        $set: {
          lastSignInTime: newUser.lastSignInTime,
          activity: newUser.activity,
          type: alreadyExists.type,
          isBaned: alreadyExists.isBaned,
        },
      };
      const token = jwtTokenCreate(alreadyExistsUserToken);

      await usersCollection.updateOne(query, updateDoc, { upsert: true });
      return res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .status(200)
        .send({ message: "user already exists" });
    }

    const token = jwtTokenCreate(newUserToken);
    const result = await usersCollection.insertOne(newUser);
    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .status(200)
      .send({
        message: "user created successfully",
        insertedId: result.insertedId,
      });
    }
    catch (error) {
      return res.status(500).send({ message: "Internal server error" });
    }
  };
};

//single user lastlogin time store
export const patchStoreUserLastLoginTime = (usersCollection) => {
  return async (req, res) => {
    const { email, lastSignInTime } = req.body;
    const query = { email: email };

    try{
      const user = await usersCollection.findOne(query);

    if (!user) {
      return res.status(404).send({ message: "user not found" });
    }

    const updateDoc = {
      $set: { lastSignInTime: lastSignInTime, activity: true },
    };

    const options = { upsert: true };

    const result = await usersCollection.updateOne(query, updateDoc, options);
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "user not found" });
    }

    const userToken = {
      email: user.email,
      type: user.type,
      isBaned: user.isBaned,
    };
    const token = jwtTokenCreate(userToken);

    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .status(200)
      .send({ success: true, result });
    }
    catch(err){
      return res.status(400).send({message : 'User Loagin Failed!'})
    }
  };
};

// user last logout time store .

export const patchStoreUserLastLogOutTime = (usersCollection) => {
  return async (req, res) => {
    const { email  } = req.query;

    const query = { email: email };

    
    if(email){
      const updateDoc = {
        $set: { lastSignOutTime: new Date(), activity: false },
      };
  
      const options = { upsert: true };
  
      const result = await usersCollection.updateOne(query, updateDoc, options);
      if (result.matchedCount === 0) {
        return res.status(404).send({ message: "user not found" });
      }
    }

    return res.clearCookie("token").send({ success: true });
  };
};

// user information update 
export const putUserInfoUpdate = (usersCollection) => {
  return async(req, res) => {
    const email = req.user.email; 

    const userInfo = req.body ; 



    // console.log('user email', email, 'user shippin info', userInfo) ;

    try{
      const filter = {email : email}; 
      const updateDoc = {
        $set: {
          ...userInfo
        }
      }

      const options = {upsert : true}; 

      const updateInfoResult = await usersCollection.updateOne(filter, updateDoc, options); 

      return res.status(200).send(updateInfoResult)

    }
    catch(error){
      return res.status(500).send({ message: 'Failed to update user info', error })
    }

    
  }
}

// user delete
export const deleteUserByID = (usersCollection) => {
  return async (req, res) => {
    const id = req.params.id;
    const tokenUserType = req.user.type;

    const query = { _id: new ObjectId(id) };
    try{
      const existingUser = await usersCollection.findOne(query); 

      if(!existingUser){
        return res.status(404).send({message : "User Not Found!"})
      }

      if(existingUser.email === req.user.email){
        return res.status(400).send({message : 'You cannot Delete your own Data!'}); 
      }

      if((existingUser.type === 'manager') && (tokenUserType === 'admin' || tokenUserType === 'moderator')){
        return res.status(403).send({message : 'Forbidden Access'})
      }

      if((tokenUserType === 'moderator') || (tokenUserType === 'user')){
        return res.status(403).send({message : "Forbidden Access"}); 
      }


      const result = await usersCollection.deleteOne(query);
      return  res.status(200).send(result);

    }
    catch(err){
      return res.status(400).send({message : 'Delete Fatching Failed!'})
    }
  };
};


// user type check 
export const getUserTypeCheck = (usersCollection) => {
  return async(req, res) => {
    const email = req.user.email; 
    const tokenType = req.user.type;
    const tokenIsBanned = req.user.isBaned; 

    const query = {email : email}; 
    try{
          
    const user = await usersCollection.findOne(query, {projection : {'type' : 1, 'isBaned' : 1}}); 
    if(!user){
      return res.status(401).send({message : "Unauthorize Access"})
    }
    
    const type = user.type ; 
    const isBaned = user.isBaned; 

    if(type !== tokenType || isBaned !== tokenIsBanned){
      return res.status(403).send({message : "Forbidden Access"});
    }
    
    
    return res.status(200).send({type : type, isBanned : isBaned})
  }
  catch(err){
    return res.status(500).send({ message: 'Error fetching user data' });
  }
}

}

// user role / type update || manager, admin, moderator or user
export const patchUserTypeUpdate = (usersCollection) => {
  return async(req, res) => {
    const {email, type} = req.body; 
    const {userCurrentCole = ''} = req.query; 
    const tokenUserType = req.user.type;
    const query = {email : email}; 

    if(email === req.user.email){
      return res.status(400).send({message : 'You cannot change your own role!'}); 
    }
    
    if(userCurrentCole === 'manager' && (tokenUserType === 'admin' || tokenUserType === 'moderator')){
      return res.status(403).send({message : 'Forbidden Access'})
    }

    if(type === 'manager' && (tokenUserType === 'admin' || tokenUserType === 'moderator')){
      return res.status(403).send({message : 'Forbidden Access'})
    }

    if(type === 'manager' && tokenUserType !== 'manager'){
      return res.status(403).send({message : 'Forbidden Access'})
    }

    if((type === 'manager' || type === 'admin' || type === 'moderator') && (tokenUserType === 'moderator' || tokenUserType === 'user') ){
      return res.status(403).send({message : "Forbidden Access"}); 
    }

   
    
    const updateDoc = {
      $set : {type : type }
    }
    const options = {upsert : true}
    try{
        
    const user = await usersCollection.updateOne(query, updateDoc, options)
    if(user.modifiedCount === 0){
      return res.status(400).send({message : 'Change failed', success : false})
    }
    if(user.modifiedCount){
      return res.status(200).send({success : true});
    }
    }
    catch(err){
      return res.status(400).send({message : "User Type Chaange Failed!"})
    }
  }
}

//user access update , access or banned
export const patchUserAccessUpdate = (usersCollection) => {
  return async(req, res) => {
    const {email, isBaned} = req.body; 
    const query = {email : email}
    const tokenUserType = req.user.type;


    if(email === req.user.email){
      return res.status(400).send({message : 'You cannot change your own Access!'}); 
    }

    try{
      const existingUser = await usersCollection.findOne(query); 

      if(existingUser.userCurrentCole === 'manager' && (tokenUserType === 'admin' || tokenUserType === 'moderator' || tokenUserType !== 'manager')){
        return res.status(403).send({message : 'Forbidden Access'})
      }
      
      const updateDoc = {
        $set : {isBaned : isBaned }
      }
      const options = {upsert : true}
      const user = await usersCollection.updateOne(query, updateDoc, options)
      if(user.modifiedCount === 0){
        return res.send({message : 'Ban failed', success : false})
      }
      if(user.modifiedCount){
        return res.send({success : true});
      }
    }
    catch(err){
      return res.status(400).send({message : "User Access Control Change Failed!"})
    }
  }
}