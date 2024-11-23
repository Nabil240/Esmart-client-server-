import "dotenv/config";
import { ObjectId } from "mongodb";

// personal own order load for user / public api
export const getALLOrdersRead = (ordersCollection) => {
  return async (req, res) => {
    const email = req.user.email;
    const {order_status} = req.query; 
    

    const query = {email : email};

    if(order_status==='current_orders'){
      query.order_status = {$in : ['Pending', 'Shipped', 'Confirm','Processing']}
    }
    else if(order_status === 'history'){
      query.order_status = {$in : ['Complete','Delivered', 'Cancel', 'Return']}
    }

    const projection = {
      'carts.email' : 0,
      'carts.name' : 0,
      'carts.productCategory': 0,
      'carts.productName' : 0,
      'carts._id' : 0,
      'bank_tran_id' : 0,
      'ard_issuer_country': 0,
      'card_type' : 0,
      'payment_status': 0,
      'risk_title' : 0,
      'tran_date' : 0,
      'val_id' : 0,
      'verify_key': 0,
      'verify_sign' : 0
    }

    try {
      const ordersResult = await ordersCollection.find(query, {projection}).sort({createdAt : -1}).toArray();

      return res.status(200).send(ordersResult);
    } catch (err) {
      return res.status(404).send({ message: "Not Found" });
    }
  };
};

// user order submit or place by post
export const postOrdersSubmit = (ordersCollection, cartsCollection, couponsCollection, client) => {
  return async (req, res) => {
    const newOrder = req.body;
    const email = req.user.email;

    newOrder.createdAt = new Date();
    newOrder.order_status = "Pending";

    const session = client.startSession(); 


    try {
      session.startTransaction(); 

      const orderSubmitResult = await ordersCollection.insertOne(newOrder, {session});
      if (orderSubmitResult.insertedId) {
         const insertedId = orderSubmitResult.insertedId.toString(); 

        const query = { email: email };
       
        

            if (newOrder.couponCode) {
              const couponQuery = {
                coupon_code: newOrder.couponCode,
              };
              const coupon = await couponsCollection.findOne(couponQuery, {session}); 

              const user = coupon?.usage?.users?.find((u)=> u.email === email); 

              let couponDataUpdate = {}; 

              if(user){
                couponDataUpdate = {
                  $inc : {
                    total_count : 1,
                     "usage.users.$[elem].count": 1
                  }
                }
                await couponsCollection.updateOne(couponQuery, couponDataUpdate, {arrayFilters: [{ "elem.email": email }], session })
              }
              else{
                couponDataUpdate = {
                  $inc : {total_count : 1},
                  $push : {
                    "usage.users" : {email : email, count : 1}
                  }
                }
                await couponsCollection.updateOne(couponQuery, couponDataUpdate, {session})
              }

             }

        await cartsCollection.deleteMany(query, {session});

        await session.commitTransaction(); 
        session.endSession(); 

        return res.send({success : true, insertedId})
        
      }
    } catch (err) {
      await session.abortTranstion(); 
      session.endSession(); 

      return res.status(404).send({ message: "order Failed!" });
    }
  };
};



// pending orders read or load 

export const getAllPendingOrders = (ordersCollection) => {
  return async(req, res) => {
      const {search = '', dataLoad = 10} = req.query; 
      
      
      let query = {order_status : "Pending"}

      if(search){

        if(ObjectId.isValid(search)){
          query = {
            ...query,
            _id : new ObjectId(search)
          }
        }

        else{
          query = {
            ...query,
            $or : [
            
              {email : {$regex : search, $options : 'i'}},
              {phone : {$regex : search, $options : 'i'}},
              {TxID : {$regex : search, $options : 'i'}}
            ]
          }
        }
      }

      const projection = {
        '_id' : 1,
        'createdAt' : 1,
        'TxID' : 1,
        'card_issuer' : 1,
        'carts.product_id' : 1,
        'carts.productIamge' : 1,
        'carts.productPrice' : 1,
        'carts.quantity' : 1,
        'couponCode' : 1,
        'currency' : 1,
        'currency_amount' : 1,
        'discount' : 1,
        'due' : 1,
        'email' : 1,
        'name' : 1, 
        'phone' : 1,
        'payment' : 1, 
        'paymentMethod' : 1,
        'payment_status' : 1,
        'shippigMethod' : 1,
        'city' : 1,
        'shippingValue': 1,
        'totalPrice' : 1,
        'totalQuantity' : 1,
        'tran_date' : 1,
        'note' : 1,
        'finalAmount' : 1,

      }
      

    try{
        const ordersData = await ordersCollection.find(query, {projection}).limit(Number(dataLoad)).toArray(); 
        const totalResult = await ordersCollection.countDocuments(query);
      return res.status(200).send({ordersData, totalResult})
    }
    catch(err){
      return res.status(400).send({message : 'Failed to fetch orders'})
    }



  }

}


// all orders Read or load
export const getAllOrdersForAdmin = (ordersCollection) =>{
  return async(req, res)=>{

    const {search = '', dataLoad = 10} = req.query; 
      
      
    let query = {order_status : {$in : ['Confirm']}}

    if(search){

      if(ObjectId.isValid(search)){
        query = {
          ...query,
          _id : new ObjectId(search)
        }
      }

      else{
        query = {
          ...query,
          $or : [
          
            {email : {$regex : search, $options : 'i'}},
            {phone : {$regex : search, $options : 'i'}},
            {TxID : {$regex : search, $options : 'i'}},
            {order_status : {$regex : search, $options : 'i'}},
          ]
        }
      }
    }

    const projection = {
      '_id' : 1,
      'createdAt' : 1,
      'TxID' : 1,
      'card_issuer' : 1,
      'carts.product_id' : 1,
      'carts.productIamge' : 1,
      'carts.productPrice' : 1,
      'carts.quantity' : 1,
      'couponCode' : 1,
      'currency' : 1,
      'currency_amount' : 1,
      'discount' : 1,
      'due' : 1,
      'email' : 1,
      'name' : 1, 
      'phone' : 1,
      'payment' : 1, 
      'paymentMethod' : 1,
      'payment_status' : 1,
      'shippigMethod' : 1,
      'city' : 1,
      'shippingValue': 1,
      'totalPrice' : 1,
      'finalAmount':1,
      'totalQuantity' : 1,
      'tran_date' : 1,
      'note' : 1,
      'orderStatusUpdateBy' : 1,
      'shippingAddress' : 1,
      'country' : 1,
      'order_status' : 1,
      'orderStatusHistory' : 1,

    }
    
  
    
  try{
      const ordersData = await ordersCollection.find(query, {projection}).limit(Number(dataLoad)).sort({order_status : 1}).toArray(); 
      const totalResult = await ordersCollection.countDocuments(query);
      return res.status(200).send({ordersData, totalResult})
  }
  catch(err){
    return res.status(400).send({message : 'Failed to fetch orders'})
  }



  }
}
// all orders Read or load
export const getProcessingOrdersForAdmin = (ordersCollection) =>{
  return async(req, res)=>{

    const {search = '', dataLoad = 10} = req.query; 
      
      
    let query = {order_status : {$in : ['Processing', 'OnCurier']}}

    if(search){

      if(ObjectId.isValid(search)){
        query = {
          ...query,
          _id : new ObjectId(search)
        }
      }

      else{
        query = {
          ...query,
          $or : [
          
            {email : {$regex : search, $options : 'i'}},
            {phone : {$regex : search, $options : 'i'}},
            {TxID : {$regex : search, $options : 'i'}},
            {order_status : {$regex : search, $options : 'i'}},
          ]
        }
      }
    }

    const projection = {
      '_id' : 1,
      'createdAt' : 1,
      'TxID' : 1,
      'card_issuer' : 1,
      'carts.product_id' : 1,
      'carts.productIamge' : 1,
      'carts.productPrice' : 1,
      'carts.quantity' : 1,
      'couponCode' : 1,
      'currency' : 1,
      'currency_amount' : 1,
      'discount' : 1,
      'due' : 1,
      'email' : 1,
      'name' : 1, 
      'phone' : 1,
      'payment' : 1, 
      'paymentMethod' : 1,
      'payment_status' : 1,
      'shippigMethod' : 1,
      'city' : 1,
      'shippingValue': 1,
      'totalPrice' : 1,
      'finalAmount':1,
      'totalQuantity' : 1,
      'tran_date' : 1,
      'note' : 1,
      'orderStatusUpdateBy' : 1,
      'shippingAddress' : 1,
      'country' : 1,
      'order_status' : 1,
      'orderStatusHistory' : 1,

    }
    
  
    
  try{
      const ordersData = await ordersCollection.find(query, {projection}).limit(Number(dataLoad)).sort({order_status : 1}).toArray(); 
      const totalResult = await ordersCollection.countDocuments(query);
      return res.status(200).send({ordersData, totalResult})
  }
  catch(err){
    return res.status(400).send({message : 'Failed to fetch orders'})
  }



  }
}

// all cenceld or returned order load

export const getAllCanceledOrders = (ordersCollection) =>{
  return async(req, res)=>{

    const {search = '', dataLoad = 10} = req.query; 
      
      
    let query = {order_status : {$in : ['Cancel', 'Return']}}

    if(search){

      if(ObjectId.isValid(search)){
        query = {
          ...query,
          _id : new ObjectId(search)
        }
      }

      else{
        query = {
          ...query,
          $or : [
          
            {email : {$regex : search, $options : 'i'}},
            {phone : {$regex : search, $options : 'i'}},
            {TxID : {$regex : search, $options : 'i'}},
            {order_status : {$regex : search, $options : 'i'}},
          ]
        }
      }
    }

    const projection = {
      '_id' : 1,
      'createdAt' : 1,
      'TxID' : 1,
      'card_issuer' : 1,
      'carts.product_id' : 1,
      'carts.productIamge' : 1,
      'carts.productPrice' : 1,
      'carts.quantity' : 1,
      'couponCode' : 1,
      'currency' : 1,
      'currency_amount' : 1,
      'discount' : 1,
      'due' : 1,
      'email' : 1,
      'name' : 1, 
      'phone' : 1,
      'payment' : 1, 
      'paymentMethod' : 1,
      'payment_status' : 1,
      'shippigMethod' : 1,
      'city' : 1,
      'shippingValue': 1,
      'totalPrice' : 1,
      'finalAmount':1,
      'totalQuantity' : 1,
      'tran_date' : 1,
      'note' : 1,
      'orderStatusUpdateBy' : 1,
      'shippingAddress' : 1,
      'country' : 1,
      'order_status' : 1,
      'orderStatusHistory' : 1,
      'cancelAt' : 1,

    }
    
  
    
  try{
      const ordersData = await ordersCollection.find(query, {projection}).limit(Number(dataLoad)).sort({createdAt : -1}).toArray(); 
      const totalResult = await ordersCollection.countDocuments(query);
      return res.status(200).send({ordersData, totalResult})
  }
  catch(err){
    return res.status(400).send({message : 'Failed to fetch orders'})
  }

  }
}


// all complete order read or load
export const getAllCompleteOrders = (ordersCollection)=> {
  return async(req, res)=>{

    const {search = '', dataLoad = 10} = req.query; 
      
      
    let query = {order_status : {$in : ['Complete', 'Delivered']}}

    if(search){

      if(ObjectId.isValid(search)){
        query = {
          ...query,
          _id : new ObjectId(search)
        }
      }

      else{
        query = {
          ...query,
          $or : [
          
            {email : {$regex : search, $options : 'i'}},
            {phone : {$regex : search, $options : 'i'}},
            {TxID : {$regex : search, $options : 'i'}},
            {order_status : {$regex : search, $options : 'i'}},
          ]
        }
      }
    }

    const projection = {
      '_id' : 1,
      'createdAt' : 1,
      'TxID' : 1,
      'card_issuer' : 1,
      'carts.product_id' : 1,
      'carts.productIamge' : 1,
      'carts.productPrice' : 1,
      'carts.quantity' : 1,
      'couponCode' : 1,
      'currency' : 1,
      'currency_amount' : 1,
      'discount' : 1,
      'due' : 1,
      'email' : 1,
      'name' : 1, 
      'phone' : 1,
      'payment' : 1, 
      'paymentMethod' : 1,
      'payment_status' : 1,
      'shippigMethod' : 1,
      'city' : 1,
      'shippingValue': 1,
      'finalAmount':1,
      'totalPrice' : 1,
      'totalQuantity' : 1,
      'tran_date' : 1,
      'note' : 1,
      'orderStatusUpdateBy' : 1,
      'shippingAddress' : 1,
      'country' : 1,
      'order_status' : 1,
      'orderRevenue' : 1,
      'orderStatusHistory' : 1,
      'deleveredAt' : 1,
      'orderProfit' : 1,


    }
    
  
    
  try{
      const ordersData = await ordersCollection.find(query, {projection}).limit(Number(dataLoad)).sort({deleveredAt : -1}).toArray(); 
      const totalResult = await ordersCollection.countDocuments(query);
      return res.status(200).send({ordersData, totalResult})
  }
  catch(err){
    return res.status(400).send({message : 'Failed to fetch orders'})
  }

  }
}


// all order transection read or load
export const getAllTransaction = (ordersCollection) => {
  return async(req, res)=>{

    const {search = '', dataLoad = 10} = req.query; 
      
      
    let query = {payment_status : "VALID", payment : 'Paid'}

    if(search){

      if(ObjectId.isValid(search)){
        query = {
          ...query,
          _id : new ObjectId(search)
        }
      }

      else{
        query = {
          ...query,
          $or : [
          
            {email : {$regex : search, $options : 'i'}},
            {phone : {$regex : search, $options : 'i'}},
            {TxID : {$regex : search, $options : 'i'}},
            
          ]
        }
      }
    }

    const projection = {
      '_id' : 1,
      'createdAt' : 1,
      'TxID' : 1,
      'card_issuer' : 1,
      'couponCode' : 1,
      'currency' : 1,
      'currency_amount' : 1,
      'discount' : 1,
      'due' : 1,
      'email' : 1,
      'name' : 1, 
      'phone' : 1,
      'payment' : 1, 
      'paymentMethod' : 1,
      'payment_status' : 1,
      'totalPrice' : 1,
      'finalAmount':1,
      'totalQuantity' : 1,
      'tran_date' : 1,
      'order_status' : 1,
      'card_issuer_country' : 1,
      'card_type' : 1,
      'risk_title' : 1,
      'val_id' : 1,
      'verify_sign' : 1,
      'ssl_error' : 1,
      'card_brand' : 1,
      

    }
    
  
    
  try{
      const ordersData = await ordersCollection.find(query, {projection}).limit(Number(dataLoad)).sort({createdAt : -1}).toArray(); 
      const totalResult = await ordersCollection.countDocuments(query);
      return res.status(200).send({ordersData, totalResult})
  }
  catch(err){
    return res.status(400).send({message : 'Failed to fetch orders'})
  }

  }
}



// order status change 
export const patchUpdateOrderStatus = (ordersCollection, productCollection) =>{
  return async(req, res)=>{
    const id = req.params.id; 
    const {new_order_status, orderStatusChangedBy} = req.body; 

    const query = {_id : new ObjectId(id)}; 
    const order = await ordersCollection.findOne(query); 

    if(!order){
      return res.status(404).send({message : 'Order Not Found!'})
    }

    const {finalAmount, shippingValue, carts } = order; 
    const finalRevenue = finalAmount - (shippingValue || 0);

   
    const newStatusHistoryEntry = {
      status : new_order_status, 
      changedBy : orderStatusChangedBy,
      timestamp : new Date()
    }


    if(new_order_status==='Delivered'){
        // TODO: Deliverd Order then store more information. 

        let totalOrderProfit = 0; 

        for(let product of carts){ 
          const productData = await productCollection.findOne({_id : new ObjectId(product.product_id)}); 

          if(!productData){
            throw new Error(`Product not found for ID: ${product.product_id}`);
          }

          const productCostPrice = productData.costPrice || 0 ;
          const productSellPrice = productData.finalPrice; 
          const productQuantity = product.quantity; 

          const productProfit = ((productSellPrice - productCostPrice) * productQuantity ); 
          totalOrderProfit += productProfit; 

           await productCollection.updateOne(
            {_id : new ObjectId(product.product_id)},
            {$inc : {totalSold : product.quantity, stockQuantity : -product.quantity}}
          )
        }


        const updateDoc = {
          $set: {
            order_status : new_order_status,
            due : 0,
            orderRevenue : finalRevenue,
            deleveredAt : new Date(),
            orderProfit : totalOrderProfit - order.discount,

          },
          $push : {orderStatusHistory : newStatusHistoryEntry}
        }

        try{
            const updateOrderStatus = await ordersCollection.updateOne(query, updateDoc, {upsert : true}); 


            return res.status(200).send(updateOrderStatus); 
        }
        catch(err){
          return res.status(400).send({ message: 'Operation Failed!', error: err });
        }

    }
    else{
      const updateDoce = {
        $set : {order_status : new_order_status},
        $push : {orderStatusHistory : newStatusHistoryEntry}
      }
      if(new_order_status==='Cancel' || new_order_status==='Return'){
        updateDoce.$set.cancelAt = new Date(); 
      }
      
      try{
          const updateNewOrderStatus = await ordersCollection.updateOne(query, updateDoce, {upsert : true}); 
          return res.status(200).send(updateNewOrderStatus)
      }
      catch(err){
        return res.status(400).send({message : 'Operation Failed!'})
      }
    }

    
  }
}


// single order delete 
export const deleteSingleOrder = (ordersCollection) => {
  return async(req, res)=>{
    const id = req.params.id; 
    const query = {_id : new ObjectId(id)}; 

    try{
        const deleteResult = await ordersCollection.deleteOne(query); 
        return res.status(200).send(deleteResult); 
    }
    catch(err){
      return res.status(400).send({message : 'Operation Failed!'})
    }
  }
}