require('dotenv').config();  // تحميل المتغيرات البيئية من ملف .env

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws'); // مكتبة WebSocket
const twilio = require('twilio'); // مكتبة Twilio لإرسال الرسائل القصيرة

const app = express();
const PORT = 5000;  // 5000

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تقديم الملفات الثابتة من مجلد frontend
app.use(express.static(path.join(__dirname, '..', 'frontend'))); // تحديد المسار الصحيح للـ frontend

// مسار صفحة تسجيل الدخول
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html')); // المسار الكامل لملف login.html
});

// تغيير مسار الصفحة الرئيسية ليكون صفحة تسجيل الدخول افتراضيًا
app.get('/', (req, res) => {
  res.redirect('/login'); // التوجيه إلى صفحة login.html عند الدخول إلى الموقع
});

// التحقق من بيانات الدخول
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // هنا يمكن إضافة التحقق الفعلي من بيانات المستخدم من قاعدة بيانات أو ملف
  if (username === 'user' && password === 'password123') {  // مثال بسيط على التحقق
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }
});

// مسار الصفحة الرئيسية بعد تسجيل الدخول
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')); // المسار الكامل لملف index.html
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/maktabet_el_talaba', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, 'uploads/'),
});

// Twilio setup for SMS
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// Routes for messages and file uploads
app.post('/messages', async (req, res) => {
  const { sender, message } = req.body;
  try {
    const newMessage = new Message({ sender, message });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (file) {
    res.json({ fileName: file.originalname });
  } else {
    res.status(400).send('No file uploaded');
  }
});

// إنشاء خادم HTTP
const server = http.createServer(app);

// WebSocket setup
const wss = new WebSocketServer({ server });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  // Send existing messages to the new client
  Message.find()
    .sort({ timestamp: 1 })
    .then((messages) => {
      ws.send(JSON.stringify({ type: 'history', messages }));
    })
    .catch((error) => {
      console.error('Failed to fetch message history:', error);
    });

  // Handle incoming WebSocket messages
  ws.on('message', async (data) => {
    try {
      const parsedData = JSON.parse(data);
      const { sender, message } = parsedData;

      const newMessage = new Message({ sender, message });
      await newMessage.save();

      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(
            JSON.stringify({
              type: 'new-message',
              sender: newMessage.sender,
              message: newMessage.message,
              timestamp: newMessage.timestamp,
            })
          );
        }
      });
    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// بدء الخادم
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  imageUrl: String,
});

const Product = mongoose.model('Product', productSchema);

// Example products
Product.insertMany([
  { name: 'دفتر 40 ورقة', price: 10, imageUrl: 'https://via.placeholder.com/150' },
  { name: 'قلم حبر', price: 5, imageUrl: 'https://via.placeholder.com/150' },
]).then(() => console.log('Products added.'));
app.get('/products', (req, res) => {
  Product.find().then((products) => {
    res.json(products);
  });
});
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
app.post('/login', express.json(), (req, res) => {
  const { username } = req.body;

  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
  }

  User.findOne({ username }).then((user) => {
    if (user) {
      res.json({ message: 'مرحبًا مجددًا!', username });
    } else {
      const newUser = new User({ username });
      newUser.save().then(() => {
        res.json({ message: 'تم تسجيلك بنجاح!', username });
      });
    }
  });
});
