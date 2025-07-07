// Updated script.js with reconnect, voucher, and login support

const packages = [
  { label: "1 Hour", price: 10, speed: "1Mbps", duration: 1 },
  { label: "2 Hours", price: 20, speed: "3Mbps", duration: 2 },
  { label: "4 Hours", price: 30, speed: "3Mbps", duration: 4 },
  { label: "6 Hours", price: 40, speed: "3Mbps", duration: 6 },
  { label: "8 Hours", price: 50, speed: "3Mbps", duration: 8 },
  { label: "24 Hours", price: 60, speed: "3Mbps", duration: 24 },
  { label: "Weekly", price: 200, speed: "3Mbps", duration: 168 },
  { label: "Monthly", price: 800, speed: "3Mbps", duration: 720 },
];

let selectedPackage = null;
const container = document.querySelector(".packages");
const timerEl = document.getElementById("time-remaining");
const timerBox = document.querySelector(".timer");

packages.forEach(pkg => {
  const div = document.createElement("div");
  div.classList.add("package");
  div.innerHTML = `
    <h3>${pkg.label} – Ksh ${pkg.price}</h3>
    <p>Unlimited data • 1 Device • ${pkg.speed} Speed</p>
  `;
  div.onclick = () => {
    selectedPackage = pkg;
    document.querySelectorAll(".package").forEach(p => p.classList.remove("active"));
    div.classList.add("active");
  };
  container.appendChild(div);
});

function startSession(durationMinutes) {
  timerBox.classList.remove("hidden");
  let timeLeft = durationMinutes * 60;
  const updateTime = () => {
    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;
    if (timeLeft <= 0) {
      clearInterval(countdown);
      alert("Your session has expired. Please pay again to reconnect.");
      window.location.reload();
    }
    timeLeft--;
  };
  updateTime();
  const countdown = setInterval(updateTime, 1000);
}

function detectLocation() {
  const loc = document.querySelector(".location");
  fetch("https://ipapi.co/json")
    .then(res => res.json())
    .then(data => {
      loc.textContent = `You're connecting from ${data.city}, ${data.country_name}`;
    })
    .catch(() => {
      loc.textContent = "Location unavailable";
    });
}

detectLocation();

document.getElementById("payBtn").onclick = () => {
  const phone = document.getElementById("phone").value.trim();
  const coupon = document.getElementById("coupon").value.trim();

  if (!selectedPackage || !phone) {
    alert("Please select a package and enter your phone number.");
    return;
  }

  axios.post("../backend/api/process_payment.php", {
    phone,
    amount: selectedPackage.price,
    label: selectedPackage.label,
    coupon
  })
  .then(res => {
    if (res.data.success) {
      alert("Payment initiated. Please confirm on your phone.");
      startSession(selectedPackage.duration * 60);
    } else {
      alert("Payment failed: " + res.data.message);
    }
  })
  .catch(err => {
    console.error(err);
    alert("An error occurred. Please try again.");
  });
};

document.getElementById("logout").onclick = () => {
  axios.post("../backend/api/logout_user.php").then(() => {
    alert("You have been disconnected.");
    window.location.reload();
  });
};

// Reconnect with M-Pesa code
const reconnectBtn = document.getElementById("reconnectBtn");
if (reconnectBtn) {
  reconnectBtn.onclick = () => {
    const code = document.getElementById("reconnectCode").value.trim();
    if (!code) return alert("Please enter your M-Pesa code.");
    axios.post("../backend/api/reconnect.php", { code })
      .then(res => {
        alert(res.data.message);
        if (res.data.success) startSession(res.data.duration * 60);
      })
      .catch(() => alert("Error reconnecting. Please contact support."));
  };
}

// Voucher code activation
const voucherBtn = document.getElementById("voucherBtn");
if (voucherBtn) {
  voucherBtn.onclick = () => {
    const voucher = document.getElementById("voucherCode").value.trim();
    if (!voucher) return alert("Please enter a voucher code.");
    axios.post("../backend/api/voucher_redeem.php", { voucher })
      .then(res => {
        alert(res.data.message);
        if (res.data.success) startSession(res.data.duration * 60);
      })
      .catch(() => alert("Voucher error. Contact admin."));
  };
}

// Username + Password login
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.onclick = () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!username || !password) return alert("Enter username and password.");
    axios.post("../backend/api/login_user.php", { username, password })
      .then(res => {
        alert(res.data.message);
        if (res.data.success) startSession(res.data.duration * 60);
      })
      .catch(() => alert("Login failed. Try again."));
  };
}