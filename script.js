// --- Supabase Config ---
const SUPABASE_URL = "https://jhedjiolhqdxmqjknipz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- UI Elements ---
const map = L.map("map").setView([12.9716, 77.5946], 13);
const shopsList = document.getElementById("shopsList");
const preview = document.getElementById("preview");
const addBtn = document.getElementById("addBtn");
const addForm = document.getElementById("addForm");

// --- Load Map ---
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

// --- Get User Location ---
navigator.geolocation.getCurrentPosition(
  (pos) => {
    map.setView([pos.coords.latitude, pos.coords.longitude], 15);
  },
  () => {
    console.warn("Using default location.");
  }
);

// --- Load Shops from Supabase ---
async function loadShops() {
  try {
    const { data, error } = await client.from("shops").select("*");
    if (error) throw error;

    data.forEach((shop) => {
      L.marker([shop.lat, shop.lng])
        .addTo(map)
        .bindPopup(`<b>${shop.shop_name}</b><br>${shop.category}`);

      const item = document.createElement("div");
      item.className = "shop-card";
      item.innerHTML = `
        <h3>${shop.shop_name}</h3>
        <p><b>Owner:</b> ${shop.owner_name}</p>
        <p><b>Category:</b> ${shop.category}</p>
        <p><b>Contact:</b> ${shop.contact || "N/A"}</p>
        <p>${shop.description}</p>
        ${shop.image_url ? `<img src="${shop.image_url}" class="preview" />` : ""}
        <hr>
      `;
      shopsList.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading shops:", err.message);
    // Still allow map and page to function
  }
}

// --- Add Shop Button ---
addBtn.addEventListener("click", () => {
  addForm.style.display = addForm.style.display === "block" ? "none" : "block";
});

// --- Camera Access ---
const video = document.getElementById("camera");
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
  })
  .catch((err) => {
    console.warn("Camera unavailable:", err.message);
  });

let capturedImage = null;
function capturePhoto() {
  const canvas = document.getElementById("canvas");
  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);
  capturedImage = canvas.toDataURL("image/jpeg");
  preview.src = capturedImage;
  preview.style.display = "block";
}

// --- Save Shop to Supabase ---
async function saveShop() {
  const shopName = document.getElementById("shopName").value;
  const ownerName = document.getElementById("ownerName").value;
  const category = document.getElementById("shopCategory").value;
  const description = document.getElementById("description").value;
  const contact = document.getElementById("contact").value;

  if (!shopName || !ownerName || !category || !description) {
    alert("Please fill all required fields.");
    return;
  }

  let lat = null, lng = null;
  try {
    const position = await new Promise((res, rej) => {
      navigator.geolocation.getCurrentPosition(res, rej);
    });
    lat = position.coords.latitude;
    lng = position.coords.longitude;
  } catch {
    alert("Location not available.");
    return;
  }

  let image_url = null;

  if (capturedImage) {
    const fileName = `shop-${Date.now()}.jpg`;
    const file = dataURLtoFile(capturedImage, fileName);
    const { data, error: uploadError } = await client.storage
      .from("shops")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/jpeg",
      });
    if (uploadError) console.error(uploadError.message);
    else {
      const { publicURL } = client.storage.from("shops").getPublicUrl(fileName);
      image_url = publicURL;
    }
  }

  const { error } = await client.from("shops").insert([
    {
      shop_name: shopName,
      owner_name: ownerName,
      category,
      description,
      contact,
      lat,
      lng,
      image_url,
    },
  ]);

  if (error) {
    alert("Failed to save shop: " + error.message);
  } else {
    alert("Shop saved!");
    location.reload();
  }
}

// --- Convert Base64 to File ---
function dataURLtoFile(dataurl, filename) {
  let arr = dataurl.split(",");
  let mime = arr[0].match(/:(.*?);/)[1];
  let bstr = atob(arr[1]);
  let n = bstr.length;
  let u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

// --- Init ---
loadShops();
