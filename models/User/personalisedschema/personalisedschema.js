import mongoose from "mongoose";

const personalisedschema = new mongoose.Schema({
    profile: { type: String },
    NickName: { type: String },
    Gender: { type: String },
    DOB: { type: String },
    BIO: { type: String },
    Interest: { type: Boolean },
    profilevisibility: { type: Boolean },
    showbirthday: { type: Boolean }

})

export default personalisedschema