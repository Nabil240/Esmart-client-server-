import "dotenv/config";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";

// user token verify
export const verifyToken = async (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  try {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.status(401).send({ message: "Unauthorized Access" });
      }
      req.user = decoded;
     
      next();
    });
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(400).send({ message: "Access Denied" });
  }
};

// user email verify
export const verifyEmail = async(req, res, next) => {
  const queryEmail = req.query.email; 
  const tokenEmail = req.user.email; 
  // console.log('req form interceptor', req.query.email)

  if(!queryEmail){
    return res.status(403).send({message : "Forbidden Access"}); 
  }

  if(queryEmail !== tokenEmail){
    return res.status(403).send({message : "Forbidden Access"});
  }

  next()
}

// user type Manager Check
export const isManager = async (req, res, next) => {
  if (req.user.type !== "manager") {
    return res.status(405).send({ message: "Not Allowed" });
  }
  next();
};

//user type admin check
export const isAdmin = async (req, res, next) => {
  if (req.user.type !== "admin") {
    return res.status(405).send({ message: "Not Allowed" });
  }
  next();
};

// user type moderator check
export const isModerator = async (req, res, next) => {
  if (req.user.type !== "moderator") {
    return res.status(405).send({ message: "Not Allowed" });
  }
  next();
};

// user type user check and user access block
export const isUserBlocked = async (req, res, next) => {
  if (req.user.type === "user") {
    return res.status(405).send({ message: "Not Allowed" });
  }
  next();
};

// user baned
export const isBaned = (req, res, next) => {
  if (req.user.isBaned) {
    return res.status(423).send({ message: "Access Locked" });
  }
  next();
};

//admin and manager check
export const isAdminOrManager = (req, res, next) => {
  if(req.user.type === 'admin' || req.user.type === 'manager'){
    return next();
  }
  return res.status(405).send({ message: "Not Allowed" });
}


//any admin role check
export const isAnyAdmin = (req, res, next) => {
    if(req.user.type === 'manager' || req.user.type === 'admin' || req.user.type === 'moderator'){
     return next()
    }
    return res.status(405).send({ message: "Not Allowed" });
}


// login limiter
export const limiter = rateLimit({
  windowMs: 5 * 60 * 100,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
