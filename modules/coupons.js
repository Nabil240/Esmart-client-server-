import { ObjectId } from "mongodb";

// all coupon read or load by email or for everyone
export const getAllAvailableCoupons = (couponsCollection) => {
  return async (req, res) => {
    const email = req.user.email;
    
    try {
      const query = { 
        $or : [
          {specific_user :{ $in : [email] }},
          {specific_user :{$eq : []}}
        ],
        coupon_status : true
       };

       const projection = {
        'usage.users' : 0,
        'total_limit' : 0,
        'total_count' : 0,
        'specific_user' : 0,
        'created_by' : 0, 
        'createdAt' : 0,
        'start_date' : 0,
        'coupon_status' : 0 
       }

       const couponResult = await couponsCollection.find(query,{ projection}).sort({createdAt : -1}).toArray();

       return res.status(200).send(couponResult);


    } catch (err) {
      return res.status(404).send({ message: "Coupon Not Found!" });
    }
  };
};

// get single coupon read
export const getSingleCoupon = (couponsCollection) => {
  return async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };

    try {
      const couponResult = await couponsCollection.findOne(query);

      return res.status(200).send(couponResult);
    } catch (err) {
      return res.status(404).send({ message: "Coupon Not Found!" });
    }
  };
};

export const getAllCouponsForAdmin = (couponsCollection) => {
  return async (req, res) => {
    const search = req.query.search;
    const query = {};
    if (search) {
      query.coupon_code = { $regex: search, $options: "i" };
    }
    try {
      const couponsResult = await couponsCollection.find(query).sort({createdAt : -1}).toArray();
      return res.status(200).send(couponsResult);
    } catch (err) {
      return res.status(404).send({ message: "Coupons Not Found!" });
    }
  };
};

// create a new coupon
export const postNewCoupons = (couponsCollection) => {
  return async (req, res) => {
    const coupons = req.body;
    coupons.createdAt = new Date();
    coupons.start_date = new Date(coupons.start_date);
    coupons.end_date = new Date(coupons.end_date);

    const existingCouponCode = await couponsCollection.findOne({
      coupon_code: coupons.coupon_code,
    });
    if (existingCouponCode) {
      return res
        .status(200)
        .send({ message: "This Coupon Alreadey Created!", exist: true });
    }

    try {
      const newCouponsResult = await couponsCollection.insertOne(coupons);

      return res.status(200).send(newCouponsResult);
    } catch (err) {
      return res.status(400).send({ message: "Coupon Create Failed!" });
    }
  };
};

// coupons update or edit,
export const patchUpdateCoupons = (couponsCollection) => {
  return async (req, res) => {
    const id = req.params.id;
    const updateCoupons = req.body;
    updateCoupons.start_date = new Date(updateCoupons.start_date);
    updateCoupons.end_date = new Date(updateCoupons.end_date);
    const query = { _id: new ObjectId(id) };

    const updateDoc = {
      $set: updateCoupons,
    };

    try {
      const updateCouponResult = await couponsCollection.updateOne(
        query,
        updateDoc
      );
      return res.status(200).send(updateCouponResult);
    } catch (err) {
      return res.status(400).send({ message: "Coupon Update Failed!" });
    }
  };
};

// delete a coupon

export const deleteCoupons = (couponsCollection) => {
  return async (req, res) => {
    const id = req.params.id;

    const filter = { _id: new ObjectId(id) };

    try {
      const deleteCoupon = await couponsCollection.deleteOne(filter);
      return res.status(200).send(deleteCoupon);
    } catch (err) {
      return res.status(400).send({ message: "Coupon Delete Failed!" });
    }
  };
};

// user coupon appy proccess
export const postUserApplyCoupon = (couponsCollection) => {
  return async (req, res) => {
    const { couponCode, totalPrice, shippingValue } = req.body;
    const email = req.user.email;

    // console.log(couponCode, totalPrice, email);

    try {
      const coupon = await couponsCollection.findOne({
        coupon_code: couponCode,
        coupon_status: true,
        start_date: { $lte: new Date() },
        end_date: { $gte: new Date() },
      });
     

      // Check if coupon exists
      if (!coupon) {
        return res.status(400).send({ message: "Invalid or Expired Coupon!" });
      }

      // Minimum Purchase Amount Check
      if (
        (coupon.min_purchase_amount) &&
        totalPrice < coupon.min_purchase_amount
      ) {
        return res
          .status(400)
          .send({
            message: `Minimum purchase amount of ${coupon.min_purchase_amount} is required.`,
          });
      }

      // Total Usage Limit Check (everyone combined)
      if ((coupon.total_limit)) {
        if(coupon.total_count >= coupon.total_limit){
        return res.status(400).send({ message: "Coupon usage limit has been reached!" })}
      }

      // User-specific Validation
      if (
        (coupon.specific_user.length > 0 ) &&
        !coupon.specific_user.includes(email)
      ) {
        return res
          .status(400)
          .send({ message: "This coupon is not valid for you." });
      }

      // Individual User Usage Limit Check
      if (coupon.usage.limit) {
        
        const user = coupon.usage.users.find((u) => u.email === email); 

       if(user){
          if (user.count >= coupon.usage.limit) {
            return res.status(400).send({
              message: `You have already used this coupon ${coupon.usage.limit} times.`,
            });
          }
        }
        
      }

      // Calculate Discount Amount
      let discountAmount;
      if (coupon.coupon_type === "percentage") {
        discountAmount = (totalPrice * coupon.discount_value) / 100;
      } else {
        discountAmount = coupon.discount_value;
      }

      // Ensure discount doesn't exceed max_discount

      if ((coupon.max_discount) && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }

      if(discountAmount > totalPrice){
        return res
        .status(400)
        .send({ message: "Discount Exceeds Order Total. Add more items to Proceed!" });
      }

      // Calculate Final Total after discount
      const finalAmount = totalPrice - discountAmount + shippingValue;

      return res.status(200).send({
        success: true,
        message: "Coupon Applied Successfully.",
        discountAmount,
        finalAmount,
      });
    } catch (error) {
      return res.status(400).send({ message: "Invalid or Expired Coupon." });
    }
  };
};
