const express = require("express");
const User = require("../db/userModel");
const Photo = require("../db/photoModel");
const router = express.Router();

const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized - Please login' });
  }
  next();
};

// Đăng nhập
router.post('/admin/login', async (req, res) => {
  try {
    const { login_name, password } = req.body;
    if (!login_name || !password) {
      return res.status(400).json({ error: 'Login name and password are required' });
    }
    const user = await User.findOne({ login_name });
    if (!user || user.password !== password) {
      return res.status(400).json({ error: 'Invalid login name or password' });
    }
    req.session.user = {
      _id: user._id,
      login_name: user.login_name,
      first_name: user.first_name,
      last_name: user.last_name,
      location: user.location,
      description: user.description,
      occupation: user.occupation
    };
    res.status(200).json({
      _id: user._id,
      login_name: user.login_name,
      first_name: user.first_name,
      last_name: user.last_name
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Đăng xuất
router.post('/admin/logout', (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({ error: 'No user is currently logged in' });
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.status(200).json({ message: 'Logout successful' });
  });
});

// Đăng ký
router.post("/", async (req, res) => {
  const { login_name, password, first_name, last_name, location, description, occupation } = req.body;
  if (!login_name || !password || !first_name || !last_name) {
    return res.status(400).send("Thiếu thông tin bắt buộc");
  }
  const existing = await User.findOne({ login_name });
  if (existing) {
    return res.status(400).send("Tên đăng nhập đã tồn tại");
  }
  const user = new User({ login_name, password, first_name, last_name, location, description, occupation });
  await user.save();
  res.status(201).json({ login_name: user.login_name, _id: user._id });
});



router.use(requireLogin);

// Lấy danh sách user
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "_id first_name last_name");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
});

// Lấy thông tin user
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id, "_id first_name last_name location description occupation");
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error fetching user details" });
  }
});

// Lấy ảnh của user
router.get("/:id/photos", async (req, res) => {
  try {
    const photos = await Photo.find({ user_id: req.params.id });
    const populatedPhotos = await Promise.all(
      photos.map(async (photo) => {
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
        return {
          _id: photo._id,
          user_id: photo.user_id,
          file_name: photo.file_name,
          date_time: photo.date_time,
          comments: populatedComments
        };
      })
    );
    res.status(200).json(populatedPhotos);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user photos" });
  }
});

// Lấy comment của user
router.get("/:id/comments", async (req, res) => {
  try {
    const photos = await Photo.find({ "comments.user_id": req.params.id });
    let comments = [];
    for (const photo of photos) {
      for (const cmt of photo.comments) {
        if (cmt.user_id && cmt.user_id.toString() === req.params.id) {
          comments.push({
            _id: cmt._id,
            comment: cmt.comment,
            date_time: cmt.date_time,
            photo_id: photo._id,
            file_name: photo.file_name,
          });
        }
      }
    }
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user comments" });
  }
});

module.exports = router;