## Links to Deployment and Code
- **Live Link (Client-side hosted on Firebase):** [Live Link](https://shopesmart-51ca8.web.app/dashboard)
- **Server-side hosted on Vercel:** [Server Link](https://shop-esmart-server.vercel.app/)
- **Client-side GitHub repository:** [Client Repo](https://github.com/MozzammelRidoy/shop-esmart-client)
- **Server-side GitHub repository:** [Server Repo](https://github.com/MozzammelRidoy/shop-esmart-server)


# E-commerce Project Backend Overview (Shop esmart)

**Shop esmart** is a fast, secure, and scalable e-commerce platform built with **Node.js**, **Express.js**, and **MongoDB Atlas**. It offers a developer-friendly, reusable solution for managing various e-commerce operations with a focus on security, performance, and maintainability. The platform utilizes advanced features like **MongoDB Aggregation Pipelines**, **Transaction Operations**, and efficient **CRUD** functionalities. Key features include role management, real-time analytics, and admin-specific controls. With its **RESTful API** architecture, it ensures smooth interactions between the client and server, enabling seamless workflows such as product management, order processing, and user authentication. The code is optimized for readability and future enhancements.

---

## Technologies Used

- **Node.js (ES Modules)**: Utilized for modern JavaScript features, making the backend more readable and developer-friendly.
- **Express.js**: A flexible and scalable framework for efficiently handling API routes.
- **MongoDB Atlas**: Used for database management, handling CRUD operations, and advanced features like Transactions and Aggregation Pipelines.
- **JWT (JSON Web Tokens)**: Implemented for secure authentication and authorization, managing user sessions and storing tokens in cookies.
- **Middleware**: Includes security and validation layers like `VerifyToken`, `isBanned`, `EmailVerify`, and `isAdmin`, enforcing role-based access control.
- **Google reCAPTCHA**: Integrated to prevent bot activity and ensure secure form submissions.
- **SSLCommerz**: Payment gateway for handling secure transactions on the platform.
- **Cloudinary**: Used for efficient image hosting, allowing fast and scalable image management.

---

## Key Backend Features

### CRUD Operations
Standard Create, Read, Update, and Delete operations are applied across various collections (e.g., `productsCollection`, `ordersCollection`, `usersCollection`) for efficient data management.

### Transactions and Aggregation Pipelines
Utilized for complex operations requiring multiple steps (e.g., order processing and payment workflows), ensuring data consistency and providing powerful, efficient querying of large datasets for reporting and analytics.

### Authorization and Security
- **JWT Authentication**: Used for secure user authentication and authorization.
- **Role-Based Access Control**: Features such as `isAdmin`, `isModerator`, `isManager`, etc., ensure that only authorized users can access specific routes or perform certain operations.
- **Middleware**: Critical security checks enhance route security by verifying banned users and blocked accounts.
- **Environment Variables**: Sensitive data such as tokens, database credentials, and API keys are stored in `.env` files to maintain security.
- **Rate Limiting and CORS**: Implemented to prevent API abuse and ensure secure cross-origin requests.

### Error Handling and Validation
- Comprehensive error handling for all routes ensures smooth backend operations, providing consistent feedback for clients and administrators.
- Custom validation logic for all user inputs ensures data integrity and prevents malicious input.

### Admin-Specific Features

#### Admin Dashboard
- **Order Analysis**: Real-time overview of orders (total, delivered, canceled, and returned) via interactive charts.
- **Order Summary**: Displays order statuses (pending, confirmed, on-courier, completed, canceled, and returned) along with user and transaction summaries.
- **Revenue Section**: Shows total revenue, profit, discounts, and more.
- **Extended Summaries**: Includes top-selling products, trending products, low-stock alerts, and category-wise sales in pie charts.
- **Ratings Overview**: Displays average site ratings.

#### Product Management
- **All Products**: Admins can view, delete, or update product information.
- **Add New Product**: Utilizing React Dropzone for file uploads and React Beautiful-DnD for reordering images, products are uploaded to Cloudinary and stored in the database.
- **Categories Management**: Admins can load, add, update, or delete categories.

#### Order Management
- Admins can verify pending orders, track shipments, and manage order statuses (confirmed, delivered, canceled, returned).

#### Transaction Management
- Admins can track and verify user payments to ensure valid transactions.

#### Coupon Management
- Admins can create, update, or delete coupons and track their usage.

#### Role Management
- Role-based access control allows admins to change user roles, ban/unban users, and manage permissions.

#### Site Settings
- Admins can update key information, such as home page banners.

#### Search Functionality
- Search across products, users, orders, and coupons using various criteria like name, code, tag, transaction ID (txID), and email.

---

## User Backend Operations and Integrations

- **Product Search & Filtering**: Handles complex queries to filter products by category, price range, and tags.
- **Pagination**: Efficient logic using MongoDB’s skip and limit for fast product pagination.
- **Favorites Management**: Stores users' favorite products for persistent storage and easy retrieval.
- **Order Processing**: Processes and tracks user orders through various stages using MongoDB’s transaction operations.
- **Coupon Validation**: Ensures valid coupon codes and checks user eligibility during checkout.

---

## Security Features
- **JWT Authentication**: Ensures only authorized users can access account information and proceed to checkout.
- **Sensitive Data Handling**: Secure transmission and management of sensitive information using SSL encryption and environment variables for API keys and secrets.

---

## Backend Strengths

- **Performance & Efficiency**: Fast data loading with optimized queries, reusable components, and clean, readable code.
- **Security**: Strong emphasis on secure authentication, validation, and user role management.
- **Advanced MongoDB Operations**: Utilizes transactions and aggregation pipelines for data consistency and complex queries.
- **Developer-Friendly**: Modern ES module usage ensures a clean codebase and better collaboration.

---

## Future Development Plans

- **Real-time Chat Feature**: Implement a chat feature using Socket.IO for real-time user support.
- **Behavior Tracking**: Track user behavior to create personalized experiences and product suggestions.
- **Dynamic Product Recommendations**: Provide tailored product suggestions based on user behavior.
- **Real-time Data Processing**: Incorporate capabilities for live updates, chat interactions, and instant notifications.

---

## Links to Deployment and Code
- **Live Link (Client-side hosted on Firebase):** [Live Link](https://shopesmart-51ca8.web.app/dashboard)
- **Server-side hosted on Vercel:** [Server Link](https://shop-esmart-server.vercel.app/)
- **Client-side GitHub repository:** [Client Repo](https://github.com/MozzammelRidoy/shop-esmart-client)
- **Server-side GitHub repository:** [Server Repo](https://github.com/MozzammelRidoy/shop-esmart-server)

---

## Environment Variables Key

```plaintext
DB_USER_NAME =
DB_USER_PASS =
GOOGLE_RECAPTCHA_SECRET_KEY_V2 =
GOOGLE_RECAPTCHA_SECRET_KEY_V3 =
ACCESS_TOKEN_SECRET =
CLOUDINARY_CLOUD_NAME =
CLOUDINARY_API_KEY =
CLOUDINARY_API_SECRET =
SSLCOMMERZ_STORE_ID =
SSLCOMMERZ_STORE_PASSWORD =
SERVER_URL= 
CLIENT_URL= 
