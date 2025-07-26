// Supabase initialization
const SUPABASE_URL = 'https://jhedjiolhqdxmqjknipz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZWRqaW9saHFkeG1xamtuaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzUzMjcsImV4cCI6MjA2OTExMTMyN30.z5aYCuIHuUb_GXqbGO8rMki-36f7SYT0PVAUeMvcS0Q';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let map;
const preview = document.getElementById('preview');
const addForm = document.getElementById('addForm');
const addBtn = document.getElementById('addBtn');
const video = document.getElementById('camera');
const canvas = document.getElementById('canvas');
const shopsList = document.getElementById('shopsList');
let stream;

// Initialize map using user's current location
function initMap() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        map = L.map('map').setView([lat, lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        L.marker([lat, lng]).addTo(map).bindPopup('You are here').openPopup();
        loadShops();
      },
      error => {
        alert("Location access denied. Using default location.");
        fallbackMap();
      }
    );
  } else {
    alert("Geolocation not supported.");
    fallbackMap();
  }
}

function fallbackMap() {
  const lat = 12.9716;
  const lng = 77.5946;
  map = L.map('map').setView([lat, lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  loadShops();
}

// Start camera
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
  } catch (err) {
    alert('Camera access denied or not available.');
    console.error(err);
  }
}

// Capture photo
function capturePhoto() {
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);
  const dataURL = canvas.toDataURL('image/jpeg');
  preview.src = dataURL;
}

// Toggle form
addBtn.addEventListener('click', () => {
  const isVisible = addForm.style.display === 'block';
  addForm.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) startCamera();
});

// Save shop to Supabase with schema-compliant fields
async function saveShop() {
  const name = document.getElementById('shopName').value.trim();
  const owner = document.getElementById('ownerName').value.trim();
  const desc = document.getElementById('description').value.trim();
  const category = document.getElementById('shopCategory').value;
  const contact = document.getElementById('contact').value.trim();
  const imageDataUrl = preview.src;

  if (!name || !owner || !desc || !category || !imageDataUrl) {
    alert("Please fill all required fields and capture a photo.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    const { error } = await supabase.from('shops').insert([{
      shop_name: name,
      owner_name: owner,
      description: desc,
      category: category,
      contact: contact,
      lat: lat,
      lng: lng,
      image_url: imageDataUrl
    }]);

    if (error) {
      console.error("Insert error:", error.message);
      alert("Failed to save shop.");
    } else {
      alert("Shop added successfully!");
      loadShops();
      addForm.reset();
      preview.src = '';
      addForm.style.display = 'none';
      if (stream) stream.getTracks().forEach(track => track.stop());
    }
  });
}

// Load shops from DB
async function loadShops() {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error loading shops:", error.message);
    return;
  }

  renderShops(data);
}

// Render shops on page and map
function renderShops(shops) {
  shopsList.innerHTML = '';
  shops.forEach(shop => {
    const div = document.createElement('div');
    div.className = 'shop';
    div.innerHTML = `
      <h3>${shop.shop_name} (${shop.category})</h3>
      <p><strong>Owner:</strong> ${shop.owner_name}</p>
      <p>${shop.description}</p>
      ${shop.contact ? `<p><strong>Contact:</strong> ${shop.contact}</p>` : ''}
      <img class="preview" src="${shop.image_url}" alt="Shop Image" />
      <p style="font-size: 0.8em; color: gray;">Added on: ${new Date(shop.created_at).toLocaleString()}</p>
    `;
    shopsList.appendChild(div);

    if (map && shop.lat && shop.lng) {
      L.marker([shop.lat, shop.lng]).addTo(map)
        .bindPopup(`<b>${shop.shop_name}</b><br>${shop.description}`);
    }
  });
}

// Search
document.getElementById('search').addEventListener('input', async e => {
  const q = e.target.value.toLowerCase();
  const { data, error } = await supabase.from('shops').select('*');
  if (!error) {
    const filtered = data.filter(s =>
      s.shop_name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
    renderShops(filtered);
  }
});

// Load on window ready
window.onload = () => {
  initMap();
};
