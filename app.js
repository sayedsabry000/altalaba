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
  const message = chatInput.value;
  if (message.trim() !== '') {
    appendMessage('أنت', message);
    chatInput.value = '';
    // TODO: Send message to server
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

// Handle upload button (manual upload trigger)
uploadBtn.addEventListener('click', () => {
  const file = fileInput.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        appendMessage('أنت', `تم رفع الملف: ${data.fileName}`);
        // Send file upload notification through socket (Optional)
        // socket.emit('message', `تم رفع ملف: ${data.fileName}`);
      })
      .catch((error) => console.error('Error uploading file:', error));
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
    
    // Send product info to the server or other users (using WebSocket)
    socket.emit('message', `تم مشاركة المنتج رقم ${index + 1}`);
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

// Connect to WebSocket server (Optional)
// const socket = io();
// socket.on('message', (data) => {
//   appendMessage('المكتبة', data);
// });
