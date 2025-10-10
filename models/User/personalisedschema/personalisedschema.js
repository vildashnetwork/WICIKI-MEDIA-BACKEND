// personalisedschema/personalisedschema.js
import mongoose from "mongoose";

const personalisedschema = new mongoose.Schema({
  NickName: { type: String, default: "" },
  Gender: { type: String, default: "" },
  DOB: { type: String, default: "" },
  BIO: { type: String, default: "" },
  whoareyou: { type: String, default: "" },
  presentlocation: { type: String, default: "" },

  // Changed to array of strings
  Interest: { type: [String], default: [] },

  companyname: { type: String, default: "" },

  // Consistent boolean fields
  profilevisibility: { type: Boolean, default: true },
  showBirthday: { type: Boolean, default: false },
  allowMessages: { type: Boolean, default: true },
  allowTagging: { type: Boolean, default: true },
  ShowAllMentors: { type: Boolean, default: true },
  ShowUnknownGists: { type: Boolean, default: true },
});

export default personalisedschema;
