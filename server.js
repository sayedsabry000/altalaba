// إدخال الرسائل
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");

// إرسال الرسائل
sendBtn.addEventListener("click", () => {
  const message = chatInput.value.trim();

  if (message) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.textContent = message;

    chatBox.appendChild(messageDiv);
    chatInput.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
const multer = require('multer');
const path = require('path');

// Configure multer
const upload = multer({
  dest: path.join(__dirname, 'uploads/'),
});

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (file) {
    res.json({ fileName: file.originalname });
  } else {
    res.status(400).send('No file uploaded');
  }
});

