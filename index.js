const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zfxxtgs.mongodb.net/blog`;
const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose
  .connect(url, connectionParams)
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.error(`Error connecting to the database:\n${err}`);
  });

const UserSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    upvotes: {
      type: Number,
      default: 1,
    },
    topic: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "Anonymous",
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "blogs" }
);
const User = mongoose.model("blog", UserSchema);

const CommentSchema = new mongoose.Schema({
  blogPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog",
  },
  author: {
    type: String,
    default: "Anonymous",
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Comment = mongoose.model("Comment", CommentSchema);

app.get("/", (req, res) => {
  res.send("App is working");
});

app.post("/register", async (req, res) => {
  try {
    const user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    if (result) {
      delete result.password;
      console.log(result);
      res.json(result); // Send the result object as JSON response
    } else {
      console.log("User already registered");
      res.status(400).send("User already registered"); // Send an appropriate error response
    }
  } catch (e) {
    console.error("Error saving data:", e);
    res.status(500).send("Something went wrong"); // Send an appropriate error response
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Something went wrong");
  }
});

app.put("/blog/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const blog = await User.findById(id); // Assuming `User` is the correct model name

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    blog.upvotes += 1;
    const updatedBlog = await blog.save();

    res.json(updatedBlog);
  } catch (error) {
    console.error("Error updating blog post:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Retrieve comments for a specific blog post
app.get("/commentsget/:blogPostId", async (req, res) => {
  const { blogPostId } = req.params;
  try {
    const comments = await Comment.find({ blogPostId });
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).send("Something went wrong");
  }
});
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const blog = await User.findById(id); // Assuming `User` is the correct model name
    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).send("Something went wrong");
  }
});

// Insert a comment for a specific blog post
app.post("/comments/:blogPostId", async (req, res) => {
  const { blogPostId } = req.params;
  const { author, content } = req.body;

  try {
    const comment = new Comment({
      blogPostId,
      author,
      content,
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    console.error("Error inserting comment:", error);
    res.status(500).send("Something went wrong");
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
