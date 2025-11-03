// routes/postRoutes.js
import express from "express";
import mongoose from "mongoose";
import Post from "../models/User/userpost/UserpostSchema.js";
import decodeTokenFromReq from "./auth_token/decode_token.js";

const router = express.Router();


const CONTENT_TYPES = ["text", "image", "video", "gallery", "mixed", "story"];

function detectContentType({ text, image, video, story, media }) {
    if (story && story.mediaUrl) return "story";
    const hasImage = !!(image && String(image).trim());
    const hasVideo = !!(video && String(video).trim());
    const hasText = !!(text && String(text).trim());
    const hasMediaArray = Array.isArray(media) && media.length > 0;

    if (hasMediaArray && media.length > 1) return "gallery";
    if (hasImage && hasVideo) return "mixed";
    if (hasVideo) return "video";
    if (hasImage) return "image";
    if (hasText) return "text";
    return "text";
}

/* ---------------------------
   Auth middlewares
---------------------------- */

function attachUserFromToken(req, res, next) {
    try {
        const result = decodeTokenFromReq(req);
        if (!result.ok) {
            req.authError = { status: result.status, message: result.message };
            return next();
        }
        const payload = result.payload;
        req.user = {
            id: payload.id,
            email: payload.email,
            name: payload.name || payload.email || "",
            avatar: payload.avatar || "",
            profileLink: payload.profileLink || ""
        };
        return next();
    } catch (err) {
        console.error("attachUserFromToken error:", err);
        return next();
    }
}

function requireAuth(req, res, next) {
    if (!req.user) {
        if (req.authError) {
            return res.status(req.authError.status || 401).json({ error: req.authError.message || "Unauthorized" });
        }
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

function isOwner(post, userId) {
    if (!post || !post.user) return false;
    try {
        return post.user.id?.toString() === userId.toString();
    } catch (e) {
        return false;
    }
}

router.use(attachUserFromToken);

/* ---------------------------
   CREATE POST
   POST /api/posts
---------------------------- */
// router.post("/", requireAuth, async (req, res) => {
//     try {
//         const {
//             text = "",
//             image = "",
//             video = "",
//             location = "",
//             visibility = "public",
//             tags = [],
//             story,
//             media,
//             contentType: clientContentType
//         } = req.body;

//         const user = req.user;

//         const newPost = new Post({
//             user: {
//                 id: mongoose.Types.ObjectId(user.id),
//                 name: user.name || user.email || "",
//                 picture: user.avatar || "",
//                 profileLink: user.profileLink || ""
//             },
//             text,
//             image,
//             video,
//             location,
//             visibility,
//             tags: Array.isArray(tags) ? tags : [],
//             story: story || undefined,
//             // store media array if provided (optional field in schema)
//             media: Array.isArray(media) ? media : undefined
//         });

//         // Determine contentType: prefer client-provided if valid, otherwise detect
//         if (clientContentType && typeof clientContentType === "string" && CONTENT_TYPES.includes(clientContentType)) {
//             newPost.contentType = clientContentType;
//         } else {
//             newPost.contentType = detectContentType({
//                 text: newPost.text,
//                 image: newPost.image,
//                 video: newPost.video,
//                 story: newPost.story,
//                 media: newPost.media
//             });
//         }

//         await newPost.save();
//         return res.status(201).json({ message: "Post created", post: newPost });
//     } catch (err) {
//         console.error("Create post error:", err);
//         return res.status(500).json({ error: "Failed to create post" });
//     }
// });



router.post("/", requireAuth, async (req, res) => {
    try {
        const {
            text = "",
            image = "",
            video = "",
            location = "",
            visibility = "public",
            tags = [],
            story,
            media,
            contentType: clientContentType
        } = req.body;

        const user = req.user;

        const newPost = new Post({
            user: {
                id: new mongoose.Types.ObjectId(user.id), // <-- use 'new' here
                name: user.name || user.email || "",
                picture: user.avatar || "",
                profileLink: user.profileLink || ""
            },
            text,
            image,
            video,
            location,
            visibility,
            tags: Array.isArray(tags) ? tags : [],
            story: story || undefined,
            media: Array.isArray(media) ? media : undefined
        });

        // Determine contentType: prefer client-provided if valid, otherwise detect
        if (clientContentType && typeof clientContentType === "string" && CONTENT_TYPES.includes(clientContentType)) {
            newPost.contentType = clientContentType;
        } else {
            newPost.contentType = detectContentType({
                text: newPost.text,
                image: newPost.image,
                video: newPost.video,
                story: newPost.story,
                media: newPost.media
            });
        }

        await newPost.save();
        return res.status(201).json({ message: "Post created", post: newPost });
    } catch (err) {
        console.error("Create post error:", err);
        return res.status(500).json({ error: "Failed to create post" });
    }
});

/* ---------------------------
   EDIT POST
   PUT /api/posts/:id
---------------------------- */
router.put("/:id", requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post id" });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });
        if (!isOwner(post, req.user.id)) return res.status(403).json({ error: "Forbidden - not the owner" });

        // Allowed keys including contentType and media
        const allowed = ["text", "image", "video", "location", "visibility", "tags", "story", "media", "contentType"];
        for (const key of allowed) {
            if (key in req.body) post[key] = req.body[key];
        }

        // Validate client-supplied contentType if present; otherwise recalculate
        if ("contentType" in req.body) {
            const ct = req.body.contentType;
            if (typeof ct !== "string" || !CONTENT_TYPES.includes(ct)) {
                return res.status(400).json({ error: "Invalid contentType. Allowed: " + CONTENT_TYPES.join(", ") });
            }
            post.contentType = ct;
        } else {
            post.contentType = detectContentType({
                text: post.text,
                image: post.image,
                video: post.video,
                story: post.story,
                media: post.media
            });
        }

        post.updatedAt = new Date();
        await post.save();
        return res.json({ message: "Post updated", post });
    } catch (err) {
        console.error("Edit post error:", err);
        return res.status(500).json({ error: "Failed to edit post" });
    }
});

/* ---------------------------
   DELETE POST
---------------------------- */
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post id" });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });
        if (!isOwner(post, req.user.id)) return res.status(403).json({ error: "Forbidden - not the owner" });

        await post.deleteOne();
        return res.json({ message: "Post deleted" });
    } catch (err) {
        console.error("Delete post error:", err);
        return res.status(500).json({ error: "Failed to delete post" });
    }
});

/* ---------------------------
   REPOST toggle
---------------------------- */
router.post("/:id/repost", requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const quote = req.body.quote || "";
        if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post id" });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const userIdStr = req.user.id.toString();
        const existingIndex = (post.reposts || []).findIndex(r => r.personId?.toString() === userIdStr);

        if (existingIndex >= 0) {
            post.reposts.splice(existingIndex, 1);
            post.sharedCount = Math.max(0, (post.sharedCount || 0) - 1);
            await post.save();
            return res.json({ message: "Repost removed", reposted: false, sharedCount: post.sharedCount });
        } else {
            const repostObj = {
                personId: mongoose.Types.ObjectId(req.user.id),
                personName: req.user.name || req.user.email || "",
                personPicture: req.user.avatar || req.user.picture || "",
                profileLink: req.user.profileLink || "",
                dateOfRepost: new Date(),
                quote
            };
            post.reposts = post.reposts || [];
            post.reposts.push(repostObj);
            post.sharedCount = (post.sharedCount || 0) + 1;
            await post.save();
            return res.json({ message: "Post reposted", reposted: true, sharedCount: post.sharedCount });
        }
    } catch (err) {
        console.error("Repost error:", err);
        return res.status(500).json({ error: "Failed to toggle repost" });
    }
});












/* ---------------------------
   GET ALL POSTS
   GET /api/posts
   Optional query params:
     - contentType=text|image|video|gallery|mixed|story
     - visibility=public|friends|private
     - page=1
     - limit=20
---------------------------- */
router.get("/", async (req, res) => {
    try {
        const { contentType, visibility, page = 1, limit = 20 } = req.query;

        const filter = {};

        if (contentType && CONTENT_TYPES.includes(contentType)) {
            filter.contentType = contentType;
        }

        if (visibility) {
            filter.visibility = visibility;
        }

        // Sort newest first
        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean(); // lean() returns plain JS objects (faster)

        // Optional: add total count for pagination
        const total = await Post.countDocuments(filter);

        return res.json({ posts, page: Number(page), limit: Number(limit), total });
    } catch (err) {
        console.error("Get posts error:", err);
        return res.status(500).json({ error: "Failed to fetch posts" });
    }
});


export default router;
