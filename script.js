let map = L.map('map').setView([12.9716, 77.5946], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const preview = document.getElementById('preview');
const addForm = document.getElementById('addForm');
const addBtn = document.getElementById('addBtn');
const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
let stream;

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
  } catch (err) {
    alert('Camera access denied or not available.');
    console.error(err);
  }
}

function capturePhoto() {
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  const dataURL = canvas.toDataURL('image/jpeg');
  preview.src = dataURL;
}

addBtn.addEventListener('click', () => {
  const isVisible = addForm.style.display === 'block';
  addForm.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) startCamera();
});

const demoShops = [
  {
    shopName: "Krishna Grocery",
    ownerName: "Ravi Kumar",
    category: "Grocery",
    description: "Fresh fruits and vegetables daily.",
    image: "https://via.placeholder.com/150",
    contact: "9876543210",
    lat: 12.9716,
    lng: 77.5946
  },
  {
    shopName: "Star Salon",
    ownerName: "Priya Mehra",
    category: "Salon",
    description: "Affordable haircuts and beauty treatments.",
    image: "https://via.placeholder.com/150",
    contact: "9988776655",
    lat: 12.9736,
    lng: 77.5966
  }
];

const shopsList = document.getElementById('shopsList');

function renderShops(shops) {
  shopsList.innerHTML = '';
  shops.forEach(shop => {
    let div = document.createElement('div');
    div.className = 'shop';
    div.innerHTML = `
      <h3>${shop.shopName} (${shop.category})</h3>
      <p><strong>Owner:</strong> ${shop.ownerName}</p>
      <p>${shop.description}</p>
      ${shop.contact ? `<p><strong>Contact:</strong> ${shop.contact}</p>` : ''}
      <img class="preview" src="${shop.image}" alt="Shop Image" />
    `;
    shopsList.appendChild(div);
    if (shop.lat && shop.lng) {
      L.marker([shop.lat, shop.lng]).addTo(map)
        .bindPopup(`<b>${shop.shopName}</b><br>${shop.description}`);
    }
  });
}

function saveShop() {
  const name = document.getElementById('shopName').value.trim();
  const owner = document.getElementById('ownerName').value.trim();
  const desc = document.getElementById('description').value.trim();
  const category = document.getElementById('shopCategory').value;
  const contact = document.getElementById('contact').value.trim();
  const image = preview.src;

  if (!name || !owner || !desc || !category || !image) {
    alert("Please fill all required fields and capture a photo.");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const newShop = { shopName: name, ownerName: owner, description: desc, category, contact, image, lat, lng };
    const shops = JSON.parse(localStorage.getItem('shops') || '[]');
    shops.push(newShop);
    localStorage.setItem('shops', JSON.stringify(shops));
    renderShops(shops);
    addForm.reset();
    preview.src = '';
    addForm.style.display = 'none';
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  });
}

document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const allShops = JSON.parse(localStorage.getItem('shops') || '[]').concat(demoShops);
  const filtered = allShops.filter(s =>
    s.shopName.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
  );
  renderShops(filtered);
});

window.onload = () => {
  const savedShops = JSON.parse(localStorage.getItem('shops') || '[]');
  renderShops(savedShops.length ? savedShops : demoShops);
};
