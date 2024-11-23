import "dotenv/config";
import jwt from "jsonwebtoken";

// create jwt token
export const jwtTokenCreate =  (user) => {
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "2h"});
  return token;
};

//remove or clear token
export const jwtTokenClear = () => {
  return async (req, res) => {
    res.clearCookie("token").send({ success: true });
  };
};
