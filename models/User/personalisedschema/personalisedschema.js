import mongoose from "mongoose";

const personalisedschema = new mongoose.Schema({
    // profile: { type: String },
    NickName: { type: String },
    Gender: { type: String },
    DOB: { type: String },
    BIO: { type: String },
    whoareyou: {type: String},
    presentlocation: {type: String},
    Interest: { type: String },
    companyname: {type:  String},


    profilevisibility: { type: Boolean },
    showbirthday: { type: Boolean },
    allowMessages: {type: String},
    showBirthday: {type: String},
    allowTagging: {type:  String},
    ShowAllMentors: {type: String},
    ShowUnknownGists: {type: String}

})



export default personalisedschema