// routes/update.js (your router file)
import express from "express";
import decodeTokenFromReq from "./auth_token/decode_token.js";
import User from "../models/User/User.js";

const router = express.Router();

const normalizeInterests = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);

  // If it's a JSON string like '["A","B"]'
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
    } catch (e) {

      return v.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  return [];
};

const normalizeBool = (v, fallback = false) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v === "true" || v === "1";
  if (typeof v === "number") return v === 1;
  return Boolean(v) || fallback;
};

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

    const interestArray = normalizeInterests(Interest);

    const personalisedUpdate = {
      NickName: NickName ?? "",
      Gender: Gender ?? "",
      DOB: DOB ?? "",
      BIO: BIO ?? "",
      whoareyou: whoareyou ?? "",
      presentlocation: presentlocation ?? "",
      Interest: interestArray,
      companyname: companyname ?? "",
      profilevisibility: normalizeBool(profilevisibility, true),
      allowMessages: normalizeBool(allowMessages, true),
      showBirthday: normalizeBool(showBirthday, false),
      allowTagging: normalizeBool(allowTagging, true),
      ShowAllMentors: normalizeBool(ShowAllMentors, true),
      ShowUnknownGists: normalizeBool(ShowUnknownGists, true),
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        picture,
        personalised: personalisedUpdate
      },
      { new: true, runValidators: true, context: "query" }
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

router.get("/me", async (req, res) => {
  try {
    const result = decodeTokenFromReq(req);
    if (!result.ok) return res.status(result.status).json({ message: result.message });

    const payload = result.payload;
    const userId = payload.id || payload._id;
    if (!userId) return res.status(400).json({ message: "Token payload missing user id" });
    const user = await User.findById(userId).select("-password -__v");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });


  } catch (error) {
    console.error("GET /me error:", error);

    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const me = await User.findOne({ name })
    if (me) {
      res.status(200).json({ me })
    } else {
      res.status(404).json({ message: "user not found" })
    }

  } catch (error) {
    console.error("GET  error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
})

router.post("/update/work", async (req, res) => {
  try {
    const result = decodeTokenFromReq(req);
    if (!result.ok) return res.status(result.status).json({ message: result.message });

    const payload = result.payload;
    const userId = payload.id || payload._id;
    if (!userId) return res.status(400).json({ message: "Token payload missing user id" });

    const {
      proffession,
      Education,
      ProjectsCompleted,
      YearsOfExperience,
      SpokenLanguages,
      ProgrammingLanguages,
    } = req.body;

    const updateFields = {
      proffession: proffession ?? "",
      Education: Education ?? "",
      ProjectsCompleted: ProjectsCompleted ?? "",
      YearsOfExperience: YearsOfExperience ?? "",
      SpokenLanguages: Array.isArray(SpokenLanguages) ? SpokenLanguages : [],
      ProgrammingLanguages: Array.isArray(ProgrammingLanguages) ? ProgrammingLanguages : []
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true, context: "query" }
    ).select("-password -__v");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "Professional profile updated successfully",
      user: updatedUser
    });
  } catch (err) {
    console.error("POST /update/work error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
