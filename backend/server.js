
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: [
    "https://repulsive-wand-4jp9gvqp6j7w274x7-5173.app.github.dev",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;

const bookSchema = new mongoose.Schema({
  bookId: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1 }
}, { timestamps: true });

const Book = mongoose.model("Book", bookSchema);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    database: mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected"
  });
});

app.get("/api/books", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const filter = search ? {
      $or: [
        { bookId: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ]
    } : {};

    res.json(await Book.find(filter).sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/books/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Không tìm thấy sách" });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/books", async (req, res) => {
  try {
    const { bookId, title, author, category, year } = req.body;

    if (
      !bookId?.trim() || !title?.trim() || !author?.trim() ||
      !category?.trim() || year === undefined || year === ""
    ) {
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin sách" });
    }

    const numericYear = Number(year);
    if (!Number.isInteger(numericYear) || numericYear < 1) {
      return res.status(400).json({ message: "Năm xuất bản không hợp lệ" });
    }

    const book = await Book.create({
      bookId: bookId.trim(),
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      year: numericYear
    });

    res.status(201).json(book);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Mã sách đã tồn tại" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/books/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const { bookId, title, author, category, year } = req.body;

    if (
      !bookId?.trim() || !title?.trim() || !author?.trim() ||
      !category?.trim() || year === undefined || year === ""
    ) {
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin sách" });
    }

    const numericYear = Number(year);
    if (!Number.isInteger(numericYear) || numericYear < 1) {
      return res.status(400).json({ message: "Năm xuất bản không hợp lệ" });
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      {
        bookId: bookId.trim(),
        title: title.trim(),
        author: author.trim(),
        category: category.trim(),
        year: numericYear
      },
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({ message: "Không tìm thấy sách" });
    }

    res.json(book);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Mã sách đã tồn tại" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});

app.delete("/api/books/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Không tìm thấy sách" });
    }

    res.json({ message: "Xóa sách thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

async function startServer() {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000
      });
      console.log("MongoDB connected");
    } else {
      console.warn("MONGODB_URI chưa được cấu hình");
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
}

startServer();
