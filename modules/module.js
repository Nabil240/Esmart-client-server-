import axios from "axios";
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

//google captcha verification
export const googleCaptchaVerify = () => {
  return async (req, res) => {
    const { captchaToken } = req.body;
    
    if (!captchaToken) {
      return res.status(400).send({ message: "Captcha Token is Required" });
    }
    try {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_RECAPTCHA_SECRET_KEY_V2}&response=${captchaToken}`
      );
      

      if (response.data.success) {
       return res.status(200).send(response.data);
      } else {
        return res.status(400).send({ error: "Captcha Varification Failed!" });
      }
    } catch (err) {
      res.status(500).send({ error: "Captcha Varification Failed!" });
    }
  };
};

export const deleteImageFromCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return async (req, res) => {
    const { public_id } = req.body;

    try {
      const result = await cloudinary.uploader.destroy(public_id);
      if (result.result !== "ok") {
        return res.status(400).json({ error: "Failed to delete image" });
      }
      return res.status(200).json({ result : result.result, message: "Image deleted successfully" });
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  };
};
