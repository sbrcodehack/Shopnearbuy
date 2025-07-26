// Supabase config
const supabase = supabase.createClient(
  'https://jhedjiolhqdxmqjknipz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZWRqaW9saHFkeG1xamtuaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzUzMjcsImV4cCI6MjA2OTExMTMyN30.z5aYCuIHuUb_GXqbGO8rMki-36f7SYT0PVAUeMvcS0Q'
);

let map = L.map('map').setView([20.59, 78.96], 5); // Default India

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Get user location
navigator.geolocation.getCurrentPosition(pos => {
  const { latitude, longitude } = pos.coords;
  map.setView([latitude, longitude], 15);
  L.marker([latitude, longitude]).addTo(map).bindPopup("You are here").openPopup();
}, () => alert("Location not allowed"));

// Camera setup
const camera = document.getElementById("camera");
const snapshot = document.getElementById("snapshot");
const captureBtn = document.getElementById("captureBtn");
let capturedImage = null;

navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(stream => {
  camera.srcObject = stream;
});

captureBtn.onclick = () => {
  snapshot.width = camera.videoWidth;
  snapshot.height = camera.videoHeight;
  snapshot.getContext('2d').drawImage(camera, 0, 0);
  capturedImage = snapshot.toDataURL("image/png");
  alert("Image captured");
};

// Toggle form
document.getElementById("toggleFormBtn").onclick = () => {
  const form = document.getElementById("formContainer");
  form.style.display = form.style.display === "none" ? "block" : "none";
};

// Save shop
document.getElementById("addForm").onsubmit = async e => {
  e.preventDefault();
  const shop = {
    name: document.getElementById("shopName").value,
    owner: document.getElementById("ownerName").value,
    desc: document.getElementById("desc").value,
    contact: document.getElementById("contact").value,
    category: document.getElementById("category").value,
    image_url: '',
    lat: map.getCenter().lat,
    lng: map.getCenter().lng
  };

  // Upload image if captured
  if (capturedImage) {
    const blob = await (await fetch(capturedImage)).blob();
    const fileName = `shop_${Date.now()}.png`;
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, blob, { contentType: 'image/png' });

    if (!error) {
      const { data: pubUrl } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      shop.image_url = pubUrl.publicUrl;
    }
  }

  // Save to Supabase
  await supabase.from('shops').insert([shop]);
  alert("Shop saved!");
  location.reload();
};

// Load all shops
async function loadShops() {
  const { data: shops } = await supabase.from('shops').select('*');

  document.getElementById("shopList").innerHTML = "";

  shops.forEach(s => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${s.name}</b> (${s.category})<br>${s.desc}<br>${s.owner}<br><img src="${s.image_url}" width="100"/>`;
    document.getElementById("shopList").appendChild(li);

    L.marker([s.lat, s.lng]).addTo(map).bindPopup(`${s.name}<br>${s.category}`);
  });
}

loadShops();
