import mongoose from "mongoose";

const UserPostSchema = new mongoose.Schema({
    video: { type: String, default: "" },
    picture: { type: String, default: "" },
    textpost: { type: String, default: "" },
    textunder: { type: String, default: "" },
    color: { type: String, default: "" },
    status: { type: String, default: "public" },

    reposts: [{
        personid: { type: String },
        personname: { type: String },
        personpicture: { type: String },
        profilelink: { type: String },
        dateoflike: { type: Date, default: Date.now }
    }],
    likes: [
        {
            personid: { type: String },
            personname: { type: String },
            personpicture: { type: String },
            profilelink: { type: String },
            emoji: { type: String },
            dateoflike: { type: Date, default: Date.now }
        }
    ],

    comments: [
        {
            personid: { type: String },
            personname: { type: String },
            personpicture: { type: String },
            profilelink: { type: String },
            comment: { type: String },
            responseoncomment: [
                {
                    responsepersonname: { type: String },
                    responsepersonpicture: { type: String },
                    responseprofilelink: { type: String },
                    message: { type: String },
                    responsecomment: [
                        {
                            mymessage: { type: String },
                            yourmessage: { type: String }
                        }
                    ]
                }
            ],
            dateofcomment: { type: Date, default: Date.now }
        }
    ],

}, { timestamps: true });


export default UserPostSchema