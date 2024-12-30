// Connect to WebSocket server
const socket = new WebSocket('ws://localhost:5000');

// Load previous messages
socket.addEventListener('open', () => {
  console.log('WebSocket connected');
  // عند الاتصال بالخادم، يمكن إرسال طلب لتحميل الرسائل السابقة إذا لزم الأمر
});

// استقبال الرسائل من WebSocket
socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'previousMessages') {
    // تحميل الرسائل السابقة
    data.messages.forEach((msg) => {
      appendMessage(msg.sender, msg.message);
    });
  } else if (data.type === 'newMessage') {
    // استقبال رسالة جديدة
    appendMessage(data.sender, data.message);
  }
});

// Elements
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const shareBtns = document.querySelectorAll('.share-btn');

// Example product data
const products = [
  {
    id: 1,
    name: 'دفتر 40 ورقة',
    price: '10 جنيه',
    image: 'https://via.placeholder.com/150',
  },
  {
    id: 2,
    name: 'قلم حبر جاف',
    price: '5 جنيه',
    image: 'https://via.placeholder.com/150/FF0000',
  },
];

// Send message function
sendBtn.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (message !== '') {
    // إرسال الرسالة عبر WebSocket
    socket.send(
      JSON.stringify({
        type: 'newMessage',
        sender: 'أنت',
        message: message,
      })
    );

    // عرض الرسالة في المحادثة فورًا
    appendMessage('أنت', message);
    chatInput.value = '';
  }
});

// Handle file upload (supports images, videos, and office files)
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const fileName = file.name;
    const fileSize = formatFileSize(file.size);
    const fileURL = URL.createObjectURL(file);

    const fileType = file.type.split('/')[0]; // Type: image, video, application (e.g., .docx)
    
    let fileMessage = '';

    if (fileType === 'image') {
      fileMessage = `
        <div class="message-content">
          <p><strong>تم رفع صورة:</strong> ${fileName} (حجم الملف: ${fileSize})</p>
          <img src="${fileURL}" alt="${fileName}" style="width: 200px; height: 200px;" />
        </div>
      `;
    } else if (fileType === 'video') {
      fileMessage = `
        <div class="message-content">
          <p><strong>تم رفع فيديو:</strong> ${fileName} (حجم الملف: ${fileSize})</p>
          <video controls style="width: 300px;">
            <source src="${fileURL}" type="${file.type}" />
            Your browser does not support the video tag.
          </video>
        </div>
      `;
    } else if (fileType === 'application') {
      const fileExtension = fileName.split('.').pop().toLowerCase();
      if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension)) {
        fileMessage = `
          <div class="message-content">
            <p><strong>تم رفع ملف ${fileExtension.toUpperCase()}:</strong> ${fileName} (حجم الملف: ${fileSize})</p>
            <a href="${fileURL}" download="${fileName}" class="download-btn">تحميل الملف</a>
          </div>
        `;
      } else {
        alert('الملف غير مدعوم.');
        return;
      }
    } else {
      alert('نوع الملف غير مدعوم.');
      return;
    }

    appendMessage('أنت', fileMessage);
  } else {
    alert('يرجى اختيار ملف!');
  }
});

// Share product in chat
shareBtns.forEach((btn, index) => {
  btn.addEventListener('click', () => {
    const product = products[index];
    const productInfo = `
      <div class="message-content">
        <p>تم مشاركة المنتج: ${product.name}</p>
        <img src="${product.image}" alt="${product.name}" style="width: 100px; height: 100px; border-radius: 8px;" />
        <p>${product.name} - ${product.price}</p>
      </div>
    `;
    appendMessage('منتج', productInfo);

    // إرسال معلومات المنتج عبر WebSocket
    socket.send(
      JSON.stringify({
        type: 'newMessage',
        sender: 'منتج',
        message: `تم مشاركة المنتج: ${product.name}`,
      })
    );
  });
});

// Function to format file size
function formatFileSize(bytes) {
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;

  if (bytes < kb) {
    return `${bytes} بايت`;
  } else if (bytes < mb) {
    return `${(bytes / kb).toFixed(2)} كيلوبايت`;
  } else if (bytes < gb) {
    return `${(bytes / mb).toFixed(2)} ميجابايت`;
  } else {
    return `${(bytes / gb).toFixed(2)} جيجابايت`;
  }
}

// Append message to chat box
function appendMessage(sender, message) {
  const messageElem = document.createElement('div');
  messageElem.classList.add('message');

  // Add the message content
  messageElem.innerHTML = `
    <strong>${sender}:</strong>
    <div class="message-text">${message}</div>
    <div class="message-actions">
      <button class="edit-btn">تعديل</button>
      <button class="delete-btn">مسح</button>
    </div>
  `;

  chatBox.appendChild(messageElem);

  // Add event listener for edit button
  const editBtn = messageElem.querySelector('.edit-btn');
  editBtn.addEventListener('click', () => editMessage(messageElem));

  // Add event listener for delete button
  const deleteBtn = messageElem.querySelector('.delete-btn');
  deleteBtn.addEventListener('click', () => deleteMessage(messageElem));

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Edit message function
function editMessage(messageElem) {
  const messageTextElem = messageElem.querySelector('.message-text');
  const currentText = messageTextElem.textContent;
  const newText = prompt('قم بتعديل الرسالة:', currentText);

  if (newText !== null && newText.trim() !== '') {
    messageTextElem.textContent = newText;
  }
}

// Delete message function
function deleteMessage(messageElem) {
  if (confirm('هل أنت متأكد من مسح هذه الرسالة؟')) {
    messageElem.remove();
  }
}

// Fetch products and display in chat
fetch('/products')
  .then((response) => response.json())
  .then((products) => {
    const productsContainer = document.getElementById('products-container');
    products.forEach((product) => {
      const productElem = document.createElement('div');
      productElem.classList.add('product');
      productElem.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}">
        <p>${product.name} - ${product.price} جنيه</p>
        <button class="share-btn">شارك في المحادثة</button>
      `;
      productsContainer.appendChild(productElem);
    });
  });
