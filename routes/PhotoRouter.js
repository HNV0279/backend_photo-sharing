const express = require("express");
const Photo = require("../db/photoModel");
const models = require("../modelData/models");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const photos = await Photo.find().populate("comments.user_id");
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching photos", error });
  }
});

router.get("/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const photos = await models.photoOfUserModel(userId);
    res.status(200).json(photos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user's photos", error });
  }
});

router.get("/:photoId", async (req, res) => {
  const photoId = req.params.photoId;
  try {
    const photo = await Photo.findById(photoId).populate("comments.user_id");
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }
    res.status(200).json(photo);
  } catch (error) {
    res.status(500).json({ message: "Error fetching photo", error });
  }
});

module.exports = router;