const apiBase = location.origin;
let token = "";

const authStatus = document.getElementById("authStatus");
const grantStatus = document.getElementById("grantStatus");
const userList = document.getElementById("userList");

async function login() {
  authStatus.textContent = "";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!email || !password) {
    authStatus.textContent = "Enter email and password.";
    return;
  }
  const res = await fetch(`${apiBase}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.ok) {
    authStatus.textContent = data.error || "Login failed";
    return;
  }
  token = data.token;
  document.getElementById("auth").classList.add("hidden");
  document.getElementById("panel").classList.remove("hidden");
  authStatus.textContent = "";
  refreshUsers();
}

async function refreshUsers() {
  const q = document.getElementById("search").value.trim();
  const res = await fetch(`${apiBase}/api/admin/users?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.ok) {
    userList.textContent = data.error || "Failed to load users.";
    return;
  }
  userList.innerHTML = "";
  data.users.forEach((u) => {
    const div = document.createElement("div");
    div.className = "user";
    div.textContent = `${u.name} (${u.email}) - ${u.role} | Coins ${u.coins} | Gems ${u.gems}`;
    userList.appendChild(div);
  });
}

async function grant() {
  grantStatus.textContent = "";
  const email = document.getElementById("targetEmail").value.trim();
  const coins = parseInt(document.getElementById("grantCoins").value || "0", 10);
  const gems = parseInt(document.getElementById("grantGems").value || "0", 10);
  if (!email) {
    grantStatus.textContent = "Enter target email.";
    return;
  }
  const res = await fetch(`${apiBase}/api/admin/grant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email, coins, gems }),
  });
  const data = await res.json();
  if (!data.ok) {
    grantStatus.textContent = data.error || "Grant failed.";
    return;
  }
  grantStatus.textContent = "Granted successfully.";
  refreshUsers();
}


document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("refreshBtn").addEventListener("click", refreshUsers);
document.getElementById("grantBtn").addEventListener("click", grant);
