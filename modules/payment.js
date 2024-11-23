import "dotenv/config";

import { ObjectId } from "mongodb";
import SSLCommerzPayment from "sslcommerz-lts";

const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_password = process.env.SSLCOMMERZ_STORE_PASSWORD;

// const generateTransactionId = () => {
//   return "tran_" + Date.now();
// };

// payment initiate and order collect api
export const postInitiatePayment = (ordersCollection) => {
  return async (req, res) => {
    const TxID = "TxID-" + new ObjectId().toString().slice(-12);
    // console.log("Transaction ID ",TXID);

    const newOrder = req.body;

    const productName = newOrder.carts
      .map((product) => product.productName)
      .join(", ");
    const productCategory = newOrder.carts
      .map((product) => product.productCategory)
      .join(", ");

    const data = {
      total_amount: newOrder.paid,
      currency: "BDT",
      tran_id: TxID,
      success_url: `${process.env.SERVER_URL}/success-payment`,
      fail_url: `${process.env.SERVER_URL}/failed-payment`,
      cancel_url: `${process.env.SERVER_URL}/cancel-payment`,
      cus_name: newOrder.name,
      cus_email: newOrder.email,
      cus_phone: newOrder.phone,
      cus_add1: newOrder.shippingAddress,
      cus_city: newOrder.city,
      cus_country: newOrder.country,
      shipping_method: "NO",
      product_name: productName,
      product_category: productCategory,
      product_profile: "general",
     
    };

    try {
      const sslCommerz = new SSLCommerzPayment(store_id, store_password, false);
      sslCommerz.init(data).then(async (result) => {
        if (result.GatewayPageURL) {
          newOrder.createdAt = new Date();
          newOrder.TxID = TxID;
          newOrder.payment = "Pending";

          const ordersResult = await ordersCollection.insertOne(newOrder);

          if (ordersResult.insertedId) {
            return res.status(200).send({ url: result.GatewayPageURL });
          }
        }
      });
    } catch (err) {
      return res.status(400).send({ message: "Payment session failed", err });
    }
  };
};

// if payment success hit this api
export const postSuccessPayment = (
  ordersCollection,
  cartsCollection,
  couponsCollection,
  client
) => {
  return async (req, res) => {
    const successData = req.body;
    const email = req.user.email; 

    


    try {
      if (successData.status !== "VALID") {
        return res.status(400).send({ message: "unauthorize access" });
      }

      const sslcz = new SSLCommerzPayment(store_id, store_password, false);
      sslcz.validate({ val_id: successData.val_id }).then(async (result) => {
        if (result.status === "VALID") {

          const session = client.startSession(); 

          session.startTransaction();

         try{
          const query = { TxID: successData.tran_id };

          const updateDoc = {
            $set: {
              payment: "Paid",
              val_id: successData.val_id,
              card_type: successData.card_type,
              bank_tran_id: successData.bank_tran_id,
              payment_status: successData.status,
              tran_date: successData.tran_date,
              currency: successData.currency,
              card_issuer: successData.card_issuer,
              card_issuer_country: successData.card_issuer_country,
              verify_sign: successData.verify_sign,
              verify_key: successData.verify_key,
              currency_amount: successData.currency_amount,
              risk_title: successData.risk_title,
              order_status: "Pending",
              ssl_error : successData.error,
              card_brand : successData.card_brand,

            },
          };

          const options = { upsert: true };

          const paymentSuccessResult = await ordersCollection.updateOne(
            query,
            updateDoc,
            {session, ...options}
          );
          if (paymentSuccessResult.modifiedCount > 0) {
            
            // coupon inforomation update like total count, user count, user email. 

            const couponInfo =  await ordersCollection.findOne({TxID : successData.tran_id}, {session}); 

            if (couponInfo.couponCode) {
              const couponQuery = {
                coupon_code: couponInfo.couponCode,
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
                await couponsCollection.updateOne(couponQuery, couponDataUpdate, {session ,arrayFilters: [{ "elem.email": email }] })
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
            await cartsCollection.deleteMany({email : email}, {session});


             await session.commitTransaction();
             session.endSession();
            
            return res.redirect(
              `${process.env.CLIENT_URL}/payment-success?paid-amount=${successData.currency_amount}&TxID=${successData.tran_id}`
            );
          } else{
            await session.abortTransaction(); 
            session.endSession(); 
            return res
                .status(400)
                .send({ message: "Payment update failed" });
          }
         }
         catch(error){
          await session.abortTransaction(); 
          session.endSession();
          return res
              .status(500)
              .send({ message: "Transaction failed, rolled back" });
         }
        }

        else{
          return res.status(400).send({ message: "Invalid Payment" });
        }

      });
    } catch (err) {
      return res.status(400).send({ message: "unauthorize access" });
    }
  };
};

//if payment cancel hit this api
export const postCancelPayment = (ordersCollection) => {
  return async (req, res) => {
    const cancelData = req.body;

    try {
      if (cancelData.status === "CANCELLED") {
        const filter = { TxID: cancelData.tran_id };
        const orderDelete = await ordersCollection.deleteOne(filter);
        if (orderDelete.deletedCount > 0) {
          return res
            .status(200)
            .redirect(
              `${process.env.CLIENT_URL}/payment-cancel?status="cancel your payment"`
            );
        }
      }
    } catch (err) {
      return res.status(400).send({ message: "Payment Canceled!" });
    }
  };
};

// if payment failed hit this api
export const postFailedPayemt = (ordersCollection) => {
  return async (req, res) => {
    const failedData = req.body;

    try {
      if (failedData.status === "FAILED") {
        const filter = { TxID: failedData.tran_id };
        const orderDelete = await ordersCollection.deleteOne(filter);
        if (orderDelete.deletedCount > 0) {
          return res
            .status(200)
            .redirect(
              `${process.env.CLIENT_URL}/payment-failed?status="failed your payment"`
            );
        }
      }
    } catch (err) {
      return res.status(400).send({ message: "Payment Failed!" });
    }
  };
};

















// const query = { TxID: successData.tran_id };

// const updateDoc = {
//   $set: {
//     payment: "Paid",
//     val_id: successData.val_id,
//     card_type: successData.card_type,
//     bank_tran_id: successData.bank_tran_id,
//     payment_status: successData.status,
//     tran_date: successData.tran_date,
//     currency: successData.currency,
//     card_issuer: successData.card_issuer,
//     card_issuer_country: successData.card_issuer_country,
//     verify_sign: successData.verify_sign,
//     verify_key: successData.verify_key,
//     currency_amount: successData.currency_amount,
//     risk_title: successData.risk_title,
//     order_status: "Pending",
//   },
// };

// const options = { upsert: true };

// const paymentSuccessResult = await ordersCollection.updateOne(
//   query,
//   updateDoc,
//   options
// );
// if (paymentSuccessResult.modifiedCount > 0) {
  
//   // coupon inforomation update like total count, user count, user email. 

//   const couponInfo =  await ordersCollection.findOne({TxID : successData.tran_id}); 

//   if (couponInfo.couponCode) {
//     const couponQuery = {
//       coupon_code: couponInfo.couponCode,
//     };
//     const coupon = await couponsCollection.findOne(couponQuery); 

//     const user = coupon?.usage?.users?.find((u)=> u.email === email); 

//     let couponDataUpdate = {}; 

//     if(user){
//       couponDataUpdate = {
//         $inc : {
//           total_count : 1,
//            "usage.users.$[elem].count": 1
//         }

//       }
//       await couponsCollection.updateOne(couponQuery, couponDataUpdate, {arrayFilters: [{ "elem.email": email }] })
//     }
//     else{
//       couponDataUpdate = {
//         $inc : {total_count : 1},
//         $push : {
//           "usage.users" : {email : email, count : 1}
//         }
//       }
//       await couponsCollection.updateOne(couponQuery, couponDataUpdate)
//     }

    
//    }
//   await cartsCollection.deleteMany({email : email});

//   // return res.status(200).send({ success: true });
//   return res.redirect(
//     `${process.env.CLIENT_URL}/payment-success?paid-amount=${successData.currency_amount}&TxID=${successData.tran_id}`
//   );
// }
