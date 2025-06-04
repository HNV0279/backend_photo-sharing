const express = require("express");
const Photo = require("../db/photoModel");
const User = require("../db/userModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Lấy tất cả ảnh (nếu cần)
router.get("/", async (req, res) => {
  try {
    const photos = await Photo.find();
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching photos", error });
  }
});

// Lấy chi tiết 1 ảnh (nếu cần)
router.get("/:photoId", async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }
    // Populate comments with user info
    const populatedComments = await Promise.all(
      (photo.comments || []).map(async (cmt) => {
        const user = await User.findById(cmt.user_id, "_id first_name last_name");
        return {
          _id: cmt._id,
          comment: cmt.comment,
          date_time: cmt.date_time,
          user: user ? {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name
          } : null
        };
      })
    );
    res.status(200).json({
      _id: photo._id,
      user_id: photo.user_id,
      file_name: photo.file_name,
      date_time: photo.date_time,
      comments: populatedComments
    });
    console.log({
      _id: photo._id,
      user_id: photo.user_id,
      file_name: photo.file_name,
      date_time: photo.date_time,
      comments: populatedComments
    })
  } catch (error) {
    res.status(500).json({ message: "Error fetching photo", error });
  }
});

router.post("/commentsOfPhoto/:photo_id", async (req, res) => {
  try {
    // Kiểm tra đăng nhập
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: "Comment cannot be empty" });
    }
    const photo = await Photo.findById(req.params.photo_id);
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }
    const newComment = {
      comment,
      date_time: new Date(),
      user_id: req.session.user._id
    };
    photo.comments.push(newComment);
    await photo.save();

    // Populate user info cho comment vừa thêm
    const user = await User.findById(req.session.user._id, "_id first_name last_name");
    const populatedComment = {
      _id: photo.comments[photo.comments.length - 1]._id,
      comment: newComment.comment,
      date_time: newComment.date_time,
      user: user ? {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name
      } : null
    };

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ error: "Error adding comment" });
  }
});

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "../../frontend/public/images");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
const upload = multer({ storage: storage });

// Upload ảnh mới
router.post("/new", upload.single("photo"), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const photo = await Photo.create({
      file_name: req.file.filename,
      date_time: new Date(),
      user_id: req.session.user._id,
      comments: [],
    });
    res.status(201).json({
      _id: photo._id,
      file_name: photo.file_name,
      date_time: photo.date_time,
      user_id: photo.user_id,
    });
  } catch (error) {
    res.status(500).json({ error: "Error uploading photo" });
  }
});

module.exports = router;
