const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { google } = require('googleapis');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// OAuth2 setup
const CLIENT_ID = "YOUR_CLIENT_ID";
const CLIENT_SECRET = "YOUR_CLIENT_SECRET";
const REDIRECT_URI = "http://localhost:3000/oauth2callback";
const REFRESH_TOKEN = "YOUR_REFRESH_TOKEN"; // Get this after first login

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const youtube = google.youtube({
  version: "v3",
  auth: oauth2Client
});

// Upload endpoint
app.post('/upload', upload.single('videoFile'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const filePath = req.file.path;

    const response = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: title,
          description: description
        },
        status: {
          privacyStatus: "public" // public, private, unlisted
        }
      },
      media: {
        body: fs.createReadStream(filePath)
      }
    });

    fs.unlinkSync(filePath); // delete temp file
    res.send(`✅ Video uploaded successfully: https://www.youtube.com/watch?v=${response.data.id}`);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Upload failed.");
  }
});

app.listen(3000, () => console.log("Server running at http://localhost:3000"));