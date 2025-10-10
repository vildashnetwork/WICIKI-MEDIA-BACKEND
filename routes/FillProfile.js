import express from "express";
import decodeTokenFromReq from "./auth_token/decode_token.js";
import User from "../models/User/User.js";

const router = express.Router();

router.post("/update", async (req, res) => {
  try {
    const result = decodeTokenFromReq(req);
    if (!result.ok) return res.status(result.status).json({ message: result.message });

    const payload = result.payload;
    const userId = payload.id || payload._id;
    if (!userId) return res.status(400).json({ message: "Token payload missing user id" });

    const {
      picture,
      NickName,
      Gender,
      DOB,
      BIO,
      whoareyou,
      presentlocation,
      Interest,
      companyname,
      profilevisibility,
      allowMessages,
      showBirthday,
      allowTagging,
      ShowAllMentors,
      ShowUnknownGists
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        picture,
        personalised: {
          NickName,
          Gender,
          DOB,
          BIO,
          whoareyou,
          presentlocation,
          Interest,
          companyname,
          profilevisibility,
          allowMessages,
          showBirthday,
          allowTagging,
          ShowAllMentors,
          ShowUnknownGists
        }
      },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (err) {
    console.error("POST /update error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
