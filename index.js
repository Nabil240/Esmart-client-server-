import express, { query } from "express";
import cors from "cors";
import "dotenv/config";


import { MongoClient, ServerApiVersion } from "mongodb";
import { deleteProduct, getAllProductReadForAdmin, getAllProducts, getForYouProducts, getHotPicksProducts, getProductRatingCheck, getProductSearch, getReletedProducts, getSigleProductReadForAdmin,  getSignleProductRead,  patchProductRatingSubmit,  postAddNewProduct, putUpdateProduct } from "./modules/products.js";
import {
  deleteUserByID,
  getAllAdmin,
  getAllUsers,
  getUserInformation,
  getUserTypeCheck,
  patchStoreUserLastLoginTime,
  patchStoreUserLastLogOutTime,
  patchUserAccessUpdate,
  patchUserTypeUpdate,
  postSingleUser,
  putUserInfoUpdate,
} from "./modules/users.js";
import cookieParser from "cookie-parser";
import { jwtTokenClear } from "./modules/jwt.js";
import { deleteImageFromCloudinary, googleCaptchaVerify } from "./modules/module.js";
import { isAdminOrManager, isAnyAdmin, isBaned, isUserBlocked, limiter, verifyEmail, verifyToken } from "./modules/middlewares.js";
import { deleteCategoryOne, getAllCategories, postNewCategories, putCategoryUpdate } from "./modules/categories.js";
import { getBannerImage, postBannerUpload, putBannerImages } from "./modules/banner.js";
import { deleteOneCart, getAllCartsRead, postNewAddToCarts, updateAddToCarts } from "./modules/carts.js";
import { deleteSingleOrder, getAllCanceledOrders, getAllCompleteOrders, getAllOrdersForAdmin, getALLOrdersRead, getAllPendingOrders, getAllTransaction, getProcessingOrdersForAdmin, patchUpdateOrderStatus, postOrdersSubmit } from "./modules/orders.js";
import { postCancelPayment, postFailedPayemt, postInitiatePayment, postSuccessPayment } from "./modules/payment.js";
import { deleteCoupons, getAllAvailableCoupons, getAllCouponsForAdmin, getSingleCoupon, patchUpdateCoupons, postNewCoupons, postUserApplyCoupon, } from "./modules/coupons.js";
import { deleteFavoriteClearAll, deleteFavoriteProduct, getAllFavoriteProduct, getCheckFavoriteProduct, postNewFavoriteProduct } from "./modules/favorite.js";
import { getAllOrderSummery, getExtendedSummary, getOrderAnalysis, getRevenueSummery } from "./modules/controllers.js";

var app = express();
var port = process.env.PORT || 5000;

//middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://mern-1cda9.web.app"],   //added after upload in firebase
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials : true
  })
);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());




// mongodb start here
// online
const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASS}@cluster0.1wh24.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// offline
// const uri = "mongodb://localhost:27017";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    
     await client.connect();                 // before uploaded in firebase just make it Comment 

    const productsCollection = client.db("shopEsmartDb").collection("products");
    const usersCollection = client.db("shopEsmartDb").collection("users");
    const categoriesCollection = client.db("shopEsmartDb").collection("categories");
    const bannersCollection = client.db("shopEsmartDb").collection("banners");
    const cartsCollection = client.db("shopEsmartDb").collection("carts");
    const ordersCollection = client.db("shopEsmartDb").collection("orders");
    const couponsCollection = client.db("shopEsmartDb").collection("coupons");
    const favoritesCollection = client.db("shopEsmartDb").collection("favorites");

    // jwt json web token releted api  
    app.post('/logout', jwtTokenClear()); 


    //products releted api
    
    app.get('/products', getAllProducts(productsCollection));
    app.get('/products-search', getProductSearch(productsCollection));
    app.get('/products-hotPicks', getHotPicksProducts(productsCollection));
    app.get('/products-releted', getReletedProducts(productsCollection));
    app.get('/products-foryou', getForYouProducts(productsCollection));
    app.get('/products/admin',verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, getAllProductReadForAdmin(productsCollection));
    app.get('/products/:id', getSignleProductRead(productsCollection) );
    app.get('/products-review-check/:id', verifyToken, isBaned, verifyEmail, getProductRatingCheck(productsCollection) );
    app.get('/products/admin/:id', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, getSigleProductReadForAdmin(productsCollection));
    app.post('/products/addnew', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, postAddNewProduct(productsCollection) );
    app.patch('/products-review', verifyToken, isBaned, verifyEmail, patchProductRatingSubmit(productsCollection))
    app.put('/products/update/:id', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, putUpdateProduct(productsCollection));
    app.delete('/products/delete/:id', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, deleteProduct(productsCollection));
    

    //categories releted api
    app.get('/categories', getAllCategories(categoriesCollection));
    app.post("/categories/addnew", verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, postNewCategories(categoriesCollection) );
    app.put('/categories/update/:id', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, putCategoryUpdate(categoriesCollection, productsCollection));
    app.delete('/categories/delete/:id', verifyToken, isBaned, verifyEmail, isUserBlocked, isAdminOrManager, deleteCategoryOne(categoriesCollection, productsCollection));


    //coupons releted api
    app.get('/coupons', verifyToken, isBaned, verifyEmail, getAllAvailableCoupons(couponsCollection) ); 
    app.get('/coupons/admin',verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, getAllCouponsForAdmin(couponsCollection) ); 
    app.get('/coupons/:id', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, getSingleCoupon(couponsCollection) ); 
    app.post('/coupons', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, postNewCoupons(couponsCollection) );
    app.post('/coupons-apply', verifyToken, isBaned, verifyEmail, postUserApplyCoupon(couponsCollection));
    app.patch('/coupons/:id', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, patchUpdateCoupons(couponsCollection) ); 
    app.delete('/coupons-delete/:id', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, deleteCoupons(couponsCollection) ); 
    
    //banner Releted api
    app.get('/banners', getBannerImage(bannersCollection)) ;
    app.post('/site-settings/banners', verifyToken, isBaned, verifyEmail, isUserBlocked, isAdminOrManager, postBannerUpload(bannersCollection)); 
    app.put('/site-settings/banners/:id', verifyToken, isBaned, verifyEmail, isUserBlocked, isAdminOrManager, putBannerImages(bannersCollection)); 
   

    //users releted api
    app.get("/usersInfo", verifyToken, isBaned, verifyEmail, getUserInformation(usersCollection));
    app.get("/users", verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, getAllUsers(usersCollection));
    app.get("/users/admin", verifyToken, isBaned, verifyEmail, isUserBlocked, isAdminOrManager, getAllAdmin(usersCollection));
    app.post("/users",limiter, postSingleUser(usersCollection));
    app.patch("/users/login", limiter, patchStoreUserLastLoginTime(usersCollection));
    app.patch("/users/logout", patchStoreUserLastLogOutTime(usersCollection));
    app.put("/usersInfo", verifyToken, isBaned, verifyEmail, putUserInfoUpdate(usersCollection));
    app.post("/users/type", verifyToken, isBaned, verifyEmail, getUserTypeCheck(usersCollection));
    app.patch('/users/type/update', verifyToken, isBaned, verifyEmail, isUserBlocked, isAdminOrManager, patchUserTypeUpdate(usersCollection) );
    app.patch('/users/access/update', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, patchUserAccessUpdate(usersCollection) );
    app.delete("/users/:id",verifyToken, isBaned, verifyEmail, isUserBlocked, isAdminOrManager, deleteUserByID(usersCollection));


    //carts releted api 
    app.get('/carts', verifyToken, isBaned, verifyEmail, getAllCartsRead(cartsCollection)); 
    app.post('/carts', verifyToken, isBaned, verifyEmail, postNewAddToCarts(cartsCollection)); 
    app.patch('/carts/:id', verifyToken, isBaned, verifyEmail, updateAddToCarts(cartsCollection)); 
    app.delete('/carts/:id', verifyToken, isBaned, verifyEmail, deleteOneCart(cartsCollection)); 


    //favorite releted api
    app.get('/favorites', verifyToken, isBaned, verifyEmail, getAllFavoriteProduct(favoritesCollection, productsCollection)); 
    app.get('/favorites-check',verifyToken, isBaned, verifyEmail, getCheckFavoriteProduct(favoritesCollection)); 
    app.post('/favorites', verifyToken, isBaned, verifyEmail, postNewFavoriteProduct(favoritesCollection)); 
    app.delete('/favorites', verifyToken, isBaned, verifyEmail, deleteFavoriteProduct(favoritesCollection));
    app.delete('/favorites-clear-all/:email', verifyToken, isBaned, verifyEmail, deleteFavoriteClearAll(favoritesCollection));


    //orders releted api 
    app.get('/orders', verifyToken, isBaned, verifyEmail, getALLOrdersRead(ordersCollection)); 
    app.get('/orders-pending', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, getAllPendingOrders(ordersCollection)); 
    app.get('/orders-all', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, getAllOrdersForAdmin(ordersCollection)); 
    app.get('/orders-processing', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, getProcessingOrdersForAdmin(ordersCollection)); 
    app.get('/orders-cancel', verifyToken, isBaned, verifyEmail, isUserBlocked, isAdminOrManager, getAllCanceledOrders(ordersCollection)); 
    app.get('/orders-complete', verifyToken, isBaned, verifyEmail, isUserBlocked, isAdminOrManager, getAllCompleteOrders(ordersCollection)); 
    app.get('/orders-transaction', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, getAllTransaction(ordersCollection)); 
    app.post('/orders', verifyToken, isBaned, verifyEmail, postOrdersSubmit(ordersCollection, cartsCollection, couponsCollection, client));
    app.patch('/orders-update/:id', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, patchUpdateOrderStatus(ordersCollection, productsCollection)); 
    app.delete('/orders-delete/:id', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, deleteSingleOrder(ordersCollection)); 


    //payment releted api
    app.post('/initiate-payment', verifyToken, isBaned, verifyEmail, postInitiatePayment(ordersCollection) ); 
    app.post('/success-payment', verifyToken, isBaned, postSuccessPayment(ordersCollection, cartsCollection, couponsCollection, client) );
    app.post('/cancel-payment', verifyToken, isBaned, postCancelPayment(ordersCollection) );
    app.post('/failed-payment', verifyToken, isBaned, postFailedPayemt(ordersCollection) );


    //dashboard controller releted api 
    app.get('/orders-summery', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, getAllOrderSummery(ordersCollection, usersCollection)); 
    app.get('/orders-analysis', verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, getOrderAnalysis(ordersCollection) );
    app.get('/revenue-summery', verifyToken, isBaned, verifyEmail, isUserBlocked, isAdminOrManager, getRevenueSummery(ordersCollection, productsCollection)); 
    app.get('/extended-summary', verifyToken, isBaned, verifyEmail, isUserBlocked, isAdminOrManager, getExtendedSummary(ordersCollection, productsCollection)); 


    // captcha releted api
    app.post("/captcha/verify", googleCaptchaVerify());


    //cloudinary releted api
    app.post('/delete-image',verifyToken, isBaned, verifyEmail, deleteImageFromCloudinary())
    app.post('/site-settings/banner/delete',verifyToken, isBaned, verifyEmail, isUserBlocked, isAnyAdmin, deleteImageFromCloudinary())


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } 
  finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//mongodb end here

app.get("/", (req, res) => {
  res.send("Server Active Now");
});

app.listen(port, () => {
  console.log("Server is Running on PORT : ", port);
});
