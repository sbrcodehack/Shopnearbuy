// Supabase credentials
const SUPABASE_URL = 'https://jhedjiolhqdxmqjknipz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZWRqaW9saHFkeG1xamtuaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzUzMjcsImV4cCI6MjA2OTExMTMyN30.z5aYCuIHuUb_GXqbGO8rMki-36f7SYT0PVAUeMvcS0Q';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Initialize map
const map = L.map('map').setView([12.9716, 77.5946], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);
console.log("🗺️ Map initialized");

// Camera setup
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    document.getElementById('camera').srcObject = stream;
    console.log("📷 Camera started");
  })
  .catch(error => console.error("🚫 Camera error:", error));

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
let capturedImage = null;

function capturePhoto() {
  const video = document.getElementById('camera');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);
  capturedImage = canvas.toDataURL('image/jpeg');
  document.getElementById('preview').src = capturedImage;
  console.log("📸 Photo captured");
}

document.getElementById('addBtn').addEventListener('click', () => {
  document.getElementById('addForm').style.display = 'block';
});

// Save shop to Supabase
async function saveShop() {
  console.log("💾 Save button clicked");

  const shopName = document.getElementById('shopName').value.trim();
  const ownerName = document.getElementById('ownerName').value.trim();
  const description = document.getElementById('description').value.trim();
  const category = document.getElementById('shopCategory').value.trim();
  const contact = document.getElementById('contact').value.trim();

  if (!shopName || !ownerName || !description || !category) {
    alert("Please fill all required fields.");
    console.warn("⚠️ Validation failed");
    return;
  }

  const { lat, lng } = map.getCenter();
  console.log("📍 Location:", lat, lng);

  let image_url = '';
  if (capturedImage) {
    console.log("📤 Uploading image to Supabase...");
    const imageName = `shop_${Date.now()}.jpg`;
    const { data: imageData, error: imageError } = await client.storage
      .from('images')
      .upload(imageName, dataURItoBlob(capturedImage), {
        contentType: 'image/jpeg',
      });

    if (imageError) {
      console.error("❌ Image upload failed:", imageError);
    } else {
      image_url = `${SUPABASE_URL}/storage/v1/object/public/images/${imageName}`;
      console.log("✅ Image uploaded:", image_url);
    }
  }

  console.log("📨 Sending shop data to Supabase...");
  const { data, error } = await client
    .from('shops')
    .insert([{
      shop_name: shopName,
      owner_name: ownerName,
      description,
      category,
      contact,
      lat,
      lng,
      image_url
    }]);

  if (error) {
    console.error("❌ Failed to save shop:", error);
    alert("Failed to save shop. Check console for error.");
  } else {
    console.log("✅ Shop saved to Supabase:", data);
    alert("Shop saved successfully!");
    fetchAndDisplayShops();
    document.getElementById('addForm').reset();
    document.getElementById('preview').src = '';
    document.getElementById('addForm').style.display = 'none';
  }
}

// Convert base64 to Blob for upload
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

// Fetch shops from Supabase and display
async function fetchAndDisplayShops() {
  console.log("🔄 Fetching shops from Supabase...");
  const { data: shops, error } = await client.from('shops').select('*');

  if (error) {
    console.error("❌ Error fetching shops:", error);
    return;
  }

  console.log("✅ Shops fetched:", shops.length);
  const list = document.getElementById('shopsList');
  list.innerHTML = '';

  shops.forEach(shop => {
    const item = document.createElement('div');
    item.className = 'shop-item';
    item.innerHTML = `
      <h3>${shop.shop_name}</h3>
      <p>${shop.description}</p>
      <p><b>Owner:</b> ${shop.owner_name}</p>
      <p><b>Category:</b> ${shop.category}</p>
      <p><b>Contact:</b> ${shop.contact || 'N/A'}</p>
      ${shop.image_url ? `<img src="${shop.image_url}" style="width:100%; max-width:300px;" />` : ''}
    `;
    list.appendChild(item);

    L.marker([shop.lat, shop.lng])
      .addTo(map)
      .bindPopup(`<b>${shop.shop_name}</b><br>${shop.description}`);
  });
}

fetchAndDisplayShops();
