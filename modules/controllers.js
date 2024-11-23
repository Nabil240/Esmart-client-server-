

// order summery read, like : 
// total orders, pending, confirm, processing, delivered, cancel & return order, 

import { ObjectId } from "mongodb";

export const getAllOrderSummery = (ordersCollection, usersCollection) =>{
    return async(req, res)=>{

        const {startDate, endDate} = req.query; 

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);  

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); 

        const matchQuery = {
            createdAt : {$gte : start, $lte : end}
            
        }
         try{
                const totalOrders = await ordersCollection.countDocuments(matchQuery); 
                const pendingOrders = await ordersCollection.countDocuments({...matchQuery, order_status : 'Pending'}); 
                const confirmOrders = await ordersCollection.countDocuments({...matchQuery, order_status : 'Confirm'}); 
                const onCuriarOrders = await ordersCollection.countDocuments({...matchQuery, order_status : 'Processing'}); 
                const deliveredOrders = await ordersCollection.countDocuments({...matchQuery, order_status : "Delivered"}); 
                const cancelOrders = await ordersCollection.countDocuments({...matchQuery, order_status : "Cancel"}); 
                const returnOders = await ordersCollection.countDocuments({...matchQuery, order_status : "Return"}); 
                const totalUsers = await usersCollection.countDocuments({...matchQuery, type : "user"}); 
                const totalTransaction = await ordersCollection.countDocuments({...matchQuery, payment_status : "VALID"})

                const results = {totalOrders, pendingOrders, confirmOrders, onCuriarOrders, deliveredOrders, cancelOrders, returnOders, totalUsers, totalTransaction}
                return res.status(200).send({data : results}); 
        }
        catch(err){
            return res.status(400).send({ message: 'Error fetching order summary' })
        }
    }
}

// all order analysis. 
export const getOrderAnalysis = (ordersCollection) => {
    return async(req, res)=> {
        const {startDate, endDate} = req.query; 
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);  

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); 

        const matchQuery = {
            createdAt : {$gte : start, $lte : end}
            
        }

        try{
            const dailyOderAnalysis = await ordersCollection.aggregate([
                {
                    $match : matchQuery
                },
    
                {
                    $group : {
                        _id : {
                            
                            year : {$year :  {date: "$createdAt", timezone: "Asia/Dhaka"}},
                            month : {$month :  {date: "$createdAt", timezone: "Asia/Dhaka"}},
                            day : {$dayOfMonth : {date: "$createdAt", timezone: "Asia/Dhaka"}}
                        },
                        totalOrders : {$sum : 1},
                        deliveredOrders : {
                            $sum : {
                                $cond : [{$eq : ["$order_status", "Delivered"]}, 1, 0]
                            }
                        },
                        cancelOrders : {
                            $sum : {
                                $cond : [{$eq : ["$order_status", "Cancel"]}, 1, 0]
                            }
                        },
                        returnOrders : {
                            $sum : {
                                $cond : [{$eq : ["$order_status", "Return"]}, 1, 0]
                            }
                        }
    
                        
                    }
                }, 
                {
                    $project : {
                        _id : 0,
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: {
                                    $dateFromParts: {
                                        year: "$_id.year",
                                        month: "$_id.month",
                                        day: "$_id.day"
                                    }
                                }
                            }
                        },
                        totalOrders : 1,
                        deliveredOrders : 1, 
                        cancelOrders : 1,
                        returnOrders : 1
                    }
                }, 
                {
                    $sort : {date : 1}
                }
            ]).toArray();
    
            return  res.status(200).send({data : dailyOderAnalysis})
        }
        catch(err){
            return res.status(400).send({ message: 'Error fetching Orders Analysis' })
        }
       
    }
}


// revenue calculation , like : revenue, profit, coupon discount, product discount
export const getRevenueSummery = (ordersCollection, productsCollection)=>{
    return async(req, res)=>{
        const {startDate, endDate} = req.query; 

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);  

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); 

        const matchQuery = {
            createdAt : {$gte : start, $lte : end}
            
        }

        try{
                const revenueSummery = await Promise.all([
                    ordersCollection.aggregate([
                        {$match : {...matchQuery, order_status : 'Delivered'}},
                        {
                            $group : {
                                _id : null,
                                totalRevenue : {$sum : '$orderRevenue'},
                                totalProfit : {$sum : '$orderProfit'},
                                totalCouponDiscount : {$sum : '$discount'},
                            }
                        }
                    ]).toArray(),
                    productsCollection.aggregate([
                        {
                            $match : {...matchQuery}
                        }, 
                        {
                            $group : {
                                _id : null,
                                totalProductsDiscount : {$sum : '$discountAmount'}
                            }
                        }
                    ]).toArray()
                ])

                const {totalRevenue = 0, totalCouponDiscount = 0, totalProfit = 0} = revenueSummery[0][0] || {} ;

                const {totalProductsDiscount = 0} = revenueSummery[1][0] || {}; 

                const results = {totalRevenue, totalCouponDiscount, totalProfit, totalProductsDiscount}; 

                return res.status(200).send({data : results}); 



        }
        catch(err){
            return res.status(400).send({ message: 'Error fetching revenue summary' })
        }

    }
}


// extended summary : like top selling products, categorywise profit , trending product, low stock alets, total ratings

export const getExtendedSummary = (ordersCollection, productsCollection) => {
    return async(req, res)=>{
        const {startDate, endDate} = req.query ;
               const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);  

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); 

        const matchQuery = {
            createdAt : {$gte : start, $lte : end}
            
        }
       
        const projection = {
            '_id' : 1, 
            'images' : {$slice : 1},
            'totalSold' : 1,
            'finalPrice' : 1,
            'stockQuantity' : 1,
            'productCode' : 1,
            'averageRating' : 1,
            'totalRatingsCount' : 1
        }
        try{    

            const deliveredOrders = await ordersCollection.aggregate([
                {
                    $match : {
                        ...matchQuery, order_status : 'Delivered'
                    }
                }, 
                {
                    $unwind : '$carts'
                },
                {
                    $group : {
                        _id : '$carts.product_id',
                        totalQuantity : {$sum : '$carts.quantity'},
                        productCategory: { $first: '$carts.productCategory' }
                    }
                }
            ]).toArray() || []; 

            const productIds = deliveredOrders.map(order => new ObjectId(order._id)) || [] ;
            const topSellingProducts = await productsCollection.find({_id : {$in : productIds} }, {projection}).sort({totalSold : -1}).limit(10).toArray() || []; 
            const trendingProducts = await productsCollection.find({_id : {$in : productIds}}, {projection}).sort({totalRatingsCount : -1,  averageRating : -1, totalSold : -1}).limit(10).toArray() || []; 

            const lowStockAlerts = await productsCollection.find({stockQuantity : {$lte : 10}}, {projection}).sort({stockQuantity : 1}).limit(15).toArray() || []; 


            let categoryWiseSales = {}; 

            for(const order of deliveredOrders){
               const category = order.productCategory; 

                    if(categoryWiseSales[category]){
                        categoryWiseSales[category] += order.totalQuantity; 
                    }
                    else{
                        categoryWiseSales[category] = order.totalQuantity;
                    }
                
            }

         const siteWideRatings = await productsCollection.aggregate([
                {
                    $match : { _id : {$in : productIds},
                        totalRatingsCount: { $gt: 0 },
                        averageRating: { $gt: 0 }
                    }
                },
                {
                    $group : {
                        _id : null,
                        totalRatingsCount : {$sum : '$totalRatingsCount'},
                        totalRatingsPoint : {$sum : {$multiply : ['$averageRating', '$totalRatingsCount']}}
                    }
                },
                {
                    $project : {
                        _id : 0,
                        totalRatingsCount : 1, 
                        siteAverageRatings : {
                            $cond : {
                                if : {$gte : ['$totalRatingsCount',0]},
                                then : {$divide : ['$totalRatingsPoint', '$totalRatingsCount']},
                                else : 0
                            }
                        }
                    }
                }
            ]).toArray() || []; 

           
            const {totalRatingsCount = 0, siteAverageRatings = 0} = siteWideRatings[0] || {};
            

            const ratings = {totalRatingsCount, siteAverageRatings}; 
             const results = {topSellingProducts, trendingProducts, lowStockAlerts, categoryWiseSales, ratings};
            return res.status(200).send({data : results}); 
          }
        catch(err){
            return res.status(400).send({ message: 'Error fetching Extedned Summery'})
        }
    }
}

//another method.
// export const getExtendedSummary = (ordersCollection, productsCollection) => {
//     return async(req, res)=>{
//         const {startDate, endDate} = req.query ;
//         const matchQuery = {
//             createdAt : {$gte : new Date(startDate), $lte : new Date(endDate)}
//         }
       
//         const projection = {
//             '_id' : 1, 
//             'images' : {$slice : 1},
//             'totalSold' : 1,
//             'finalPrice' : 1,
//             'stockQuantity' : 1,
//             'productCode' : 1,
//             'averageRating' : 1,
//             'totalRatingsCount' : 1
//         }
       


//         try{

//             const topSellingProducts = await productsCollection.find({}, {projection}).sort({totalSold : -1}).limit(10).toArray(); 
//             const trendingProducts = await productsCollection.find({}, {projection}).sort({totalRatingsCount : -1,  averageRating : -1, totalSold : -1}).limit(10).toArray(); 

//             const lowStockAlerts = await productsCollection.find({stockQuantity : {$lte : 10}}, {projection}).sort({stockQuantity : 1}).limit(15).toArray(); 

//             const deliveredOrder = await ordersCollection.find({...matchQuery, order_status : 'Delivered'}).toArray(); 

//             let categoryWiseSales = {}; 

//             for(const order of deliveredOrder){
//                 for(const cartItem of order.carts){
                    

//                     const category = cartItem.productCategory; 

//                     if(categoryWiseSales[category]){
//                         categoryWiseSales[category] += cartItem.quantity; 
//                     }
//                     else{
//                         categoryWiseSales[category] = cartItem.quantity;
//                     }
//                 }
//             }

            

//             const siteWideRatings = await productsCollection.aggregate([
//                 {
//                     $match : { 
//                         totalRatingsCount: { $gt: 0 },
//                         averageRating: { $gt: 0 }
//                     }
//                 },
//                 {
//                     $group : {
//                         _id : null,
//                         totalRatingsCount : {$sum : '$totalRatingsCount'},
//                         totalRatingsPoint : {$sum : {$multiply : ['$averageRating', '$totalRatingsCount']}}
//                     }
//                 },
//                 {
//                     $project : {
//                         _id : 0,
//                         totalRatingsCount : 1, 
//                         siteAverageRatings : {
//                             $cond : {
//                                 if : {$gt : ['$totalRatingsCount',0]},
//                                 then : {$divide : ['$totalRatingsPoint', '$totalRatingsCount']},
//                                 else : 0
//                             }
//                         }
//                     }
//                 }
//             ]).toArray(); 

           
//             const {totalRatingsCount = 0, siteAverageRatings = 0} = siteWideRatings[0] || {}; 

//             const ratings = {totalRatingsCount, siteAverageRatings}; 
//              const results = {topSellingProducts, trendingProducts, lowStockAlerts, categoryWiseSales, ratings};
//             return res.status(200).send({data : results}); 
//           }
//         catch(err){
//             return res.status(400).send({ message: 'Error fetching Extedned Summery'})
//         }
//     }
// }