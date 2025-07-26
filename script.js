const form = document.getElementById('shopForm');
const logOutput = document.getElementById('logOutput');

// Supabase config
const SUPABASE_URL = 'https://jhedjiolhqdxmqjknipz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZWRqaW9saHFkeG1xamtuaXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MzUzMjcsImV4cCI6MjA2OTExMTMyN30.z5aYCuIHuUb_GXqbGO8rMki-36f7SYT0PVAUeMvcS0Q';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

function log(message) {
  console.log(message);
  logOutput.textContent += `\n${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const shop = {
    shop_name: document.getElementById('shop_name').value,
    owner_name: document.getElementById('owner_name').value,
    description: document.getElementById('description').value,
    category: document.getElementById('category').value,
    contact: document.getElementById('contact').value,
    lat: parseFloat(document.getElementById('lat').value),
    lng: parseFloat(document.getElementById('lng').value),
    image_url: document.getElementById('image_url').value
  };

  log('📥 Form Data Collected:');
  log(shop);

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/shops`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(shop)
    });

    const data = await res.json();

    if (res.ok) {
      log('✅ Data inserted into DB:');
      log(data);
      alert("Shop saved successfully!");
      form.reset();
    } else {
      log('❌ Error from Supabase:');
      log(data);
      alert("Error saving shop.");
    }
  } catch (error) {
    log('🚨 Exception while sending data:');
    log(error);
    alert("An error occurred.");
  }
});
