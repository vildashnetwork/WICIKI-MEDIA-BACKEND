// routes/postRoutes.js
import express from "express";
import mongoose from "mongoose";
import Post from "../models/User/userpost/UserpostSchema.js";
import decodeTokenFromReq from "./auth_token/decode_token.js";
import User from "../models/User/User.js";

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
//         const getuserall = await User.findById(user.id);


//         const newPost = new Post({
//             getuserall: {
//                 id: new mongoose.Types.ObjectId(getuserall.id), // <-- use 'new' here
//                 name: getuserall.name || getuserall.email || "",
//                 picture: getuserall?.picture || "",
//                 profileLink: `http://localhost:5173/profile/${getuserall.name}`,
//             },
//             text,
//             image,
//             video,
//             location,
//             visibility,
//             tags: Array.isArray(tags) ? tags : [],
//             story: story || undefined,
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










// make sure you have User imported at top:
// import User from "../models/User/User.js"; // <-- adjust path to your real User model

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

        // ensure auth attached a user
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized: no user in request" });
        }

        // fetch full user from DB (optional but useful)
        const dbUser = await User.findById(req.user.id).lean();
        if (!dbUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Build the post's user field (must be `user` to match schema)
        const userField = {
            id: new mongoose.Types.ObjectId(dbUser._id), // use new with mongoose v7+
            name: dbUser.name || dbUser.email || "",
            picture: dbUser.picture || dbUser.avatar || "",
            profileLink: dbUser.profileLink || `/profile/${encodeURIComponent(dbUser.name || dbUser._id)}`
        };

        const newPost = new Post({
            user: userField,              // <-- IMPORTANT: use `user`, not `getuserall`
            text,
            image,
            video,
            location,
            visibility,
            tags: Array.isArray(tags) ? tags : [],
            story: story || undefined,
            media: Array.isArray(media) ? media : undefined
        });

        // contentType logic (unchanged)
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
        // include error message in dev, but keep generic for clients if you prefer
        return res.status(500).json({ error: "Failed to create post", details: err.message });
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






























// ---------------------------
// Like a post (toggle)
// POST /api/posts/:id/like
// body: { emoji?: "👍" }
// ---------------------------
router.post("/:id/like", requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post id" });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const userIdStr = req.user.id.toString();
        const existingIndex = (post.likes || []).findIndex(l => l.userId?.toString() === userIdStr);

        if (existingIndex >= 0) {
            // remove like (toggle off)
            post.likes.splice(existingIndex, 1);
            await post.save();
            return res.json({ message: "Like removed", liked: false, likesCount: post.likes.length });
        } else {
            // add like
            const emoji = typeof req.body.emoji === "string" ? req.body.emoji : "❤️";
            post.likes = post.likes || [];
            post.likes.push({ userId: new mongoose.Types.ObjectId(req.user.id), emoji });
            await post.save();
            return res.json({ message: "Post liked", liked: true, likesCount: post.likes.length });
        }
    } catch (err) {
        console.error("Post like error:", err);
        return res.status(500).json({ error: "Failed to toggle like" });
    }
});

// ---------------------------
// Add a comment to a post
// POST /api/posts/:id/comment
// body: { message: string }
// ---------------------------
router.post("/:id/comment", requireAuth, async (req, res) => {
    try {
        const postId = req.params.id;
        const { message } = req.body;

        if (!message || !String(message).trim()) return res.status(400).json({ error: "Comment message is required" });
        if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post id" });

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const commentObj = {
            user: {
                id: new mongoose.Types.ObjectId(req.user.id),
                name: req.user.name || req.user.email || "",
                picture: req.user.avatar || ""
            },
            message: String(message).trim(),
            likes: [],
            replies: [],
            createdAt: new Date()
        };

        post.comments = post.comments || [];
        post.comments.push(commentObj);
        await post.save();

        // return the newly added comment (it's the last item)
        const addedComment = post.comments[post.comments.length - 1];
        return res.status(201).json({ message: "Comment added", comment: addedComment, commentsCount: post.comments.length });
    } catch (err) {
        console.error("Add comment error:", err);
        return res.status(500).json({ error: "Failed to add comment" });
    }
});

// ---------------------------
// Like a comment (toggle)
// POST /api/posts/:postId/comment/:commentId/like
// ---------------------------
router.post("/:postId/comment/:commentId/like", requireAuth, async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ error: "Invalid post or comment id" });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        // find comment subdocument
        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        const userIdStr = req.user.id.toString();
        const existingIndex = (comment.likes || []).findIndex(uid => uid?.toString() === userIdStr);

        if (existingIndex >= 0) {
            // unlike
            comment.likes.splice(existingIndex, 1);
            await post.save();
            return res.json({ message: "Comment like removed", liked: false, commentLikesCount: comment.likes.length });
        } else {
            // like
            comment.likes = comment.likes || [];
            comment.likes.push(new mongoose.Types.ObjectId(req.user.id));
            await post.save();
            return res.json({ message: "Comment liked", liked: true, commentLikesCount: comment.likes.length });
        }
    } catch (err) {
        console.error("Comment like error:", err);
        return res.status(500).json({ error: "Failed to toggle comment like" });
    }
});

























// GET /api/posts/:id
// Returns a single post by id. If a valid token is present (attachUserFromToken runs on this router),
// the response will include `likedByMe` on the post and on each comment where applicable.
router.get("/:id", async (req, res) => {
    try {
        const postId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: "Invalid post id" });
        }

        // fetch the post (lean => plain object)
        const post = await Post.findById(postId).lean();
        if (!post) return res.status(404).json({ error: "Post not found" });

        // If attachUserFromToken set req.user, compute likedByMe flags
        const currentUserId = req.user?.id ? String(req.user.id) : null;

        // Normalize likes array shape: likes may be array of { userId } objects
        if (Array.isArray(post.likes)) {
            post.likesCount = post.likes.length;
            if (currentUserId) {
                post.likedByMe = post.likes.some((lk) => {
                    // support both { userId: ObjectId } and bare ObjectId entries
                    if (!lk) return false;
                    if (lk.userId) return String(lk.userId) === currentUserId;
                    return String(lk) === currentUserId;
                });
            } else {
                post.likedByMe = false;
            }
        } else {
            post.likesCount = 0;
            post.likedByMe = false;
        }

        // For comments, compute likedByMe and normalize each comment
        if (Array.isArray(post.comments)) {
            post.comments = post.comments.map((c) => {
                const comment = { ...c };
                // comment.likes may be array of ObjectId (user ids) or like objects
                let likesArr = Array.isArray(comment.likes) ? comment.likes : [];
                comment.likesCount = likesArr.length;
                if (currentUserId) {
                    comment.likedByMe = likesArr.some((lk) => {
                        if (!lk) return false;
                        // if likes are stored as ObjectId strings or objects
                        if (typeof lk === "object" && lk._id) {
                            // rare case of full docs
                            return String(lk._id) === currentUserId;
                        }
                        return String(lk) === currentUserId;
                    });
                } else {
                    comment.likedByMe = false;
                }
                return comment;
            });
        } else {
            post.comments = [];
        }

        return res.json({ post });
    } catch (err) {
        console.error("Get post by id error:", err);
        return res.status(500).json({ error: "Failed to fetch post", details: err.message });
    }
});



export default router;
