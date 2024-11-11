const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let pdfPath = null;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "uploads")));
app.use(fileUpload());

// Handle PDF upload
app.post("/upload", (req, res) => {
  const file = req.files.pdf;
  const filePath = path.join(__dirname, "uploads", file.name);
  file.mv(filePath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    pdfPath = filePath;
    res.send({ filePath });
  });
});

// Serve PDF
app.get("/pdf", (req, res) => {
  if (pdfPath) {
    res.sendFile(pdfPath);
  } else {
    res.status(404).send("PDF not found");
  }
});

// Admin page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// View page for the PDF (Viewer page)
app.get("/view", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "viewer.html"));
});

// WebSocket connection for real-time sync
io.on("connection", (socket) => {
  console.log("a user connected");

  // Only admin can emit page changes
  socket.on("page-change", (page) => {
    // Broadcast to all connected users
    socket.broadcast.emit("page-change", page);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
