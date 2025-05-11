const express = require("express");
const User = require("../db/userModel");
const models = require("../modelData/models");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = models.userListModel();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

router.get("/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = models.userModel(userId);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching user details" });
  }
});

router.get("/:id/photos", async (req, res) => {
  const userId = req.params.id;
  try {
    const photos = models.photoOfUserModel(userId);
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user photos" });
  }
});

router.get("/:id/comments", async (req, res) => {
  const userId = req.params.id;
  try {
    const allPhotos = [];
    models.userListModel().forEach(u => {
      allPhotos.push(...models.photoOfUserModel(u._id));
    });

    let comments = [];
    allPhotos.forEach((photo) => {
      if (photo.comments) {
        photo.comments.forEach((cmt) => {
          if (cmt.user && cmt.user._id === userId) {
            comments.push({
              _id: cmt._id,
              comment: cmt.comment,
              date_time: cmt.date_time,
              photo_id: photo._id,
              file_name: photo.file_name,
            });
          }
        });
      }
    });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user comments" });
  }
});

module.exports = router;