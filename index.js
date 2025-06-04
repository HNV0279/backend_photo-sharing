const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");

dbConnect();

app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true
}));

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie:{
      httpOnly: true,
    }
  })
)
app.use(express.json());
app.use("/api/user", UserRouter);
app.use("/api/photo", PhotoRouter);


app.listen(8081, () => {
  console.log("server listening on port 8081");
});
