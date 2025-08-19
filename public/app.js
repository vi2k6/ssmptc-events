async function login() {
  const id = document.getElementById("loginId").value;
  const password = document.getElementById("loginPass").value;
  const role = document.getElementById("loginRole").value;

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password, role }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("id", data.id);
      updateUI();
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error(err);
    alert("Login error");
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("id");
  updateUI();
}

function updateUI() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const id = localStorage.getItem("id");

  document.getElementById("loginSection").classList.toggle("hidden", !!token);
  document.getElementById("logoutSection").classList.toggle("hidden", !token);
  document.getElementById("adminPanel").classList.add("hidden");
  document.getElementById("ownerPanel").classList.add("hidden");

  if (token) {
    document.getElementById("userRole").textContent = role;
    document.getElementById("userId").textContent = id;

    if (role === "admin") {
      document.getElementById("adminPanel").classList.remove("hidden");
    } else if (role === "owner") {
      document.getElementById("adminPanel").classList.remove("hidden");
      document.getElementById("ownerPanel").classList.remove("hidden");
    }
  }
}

// ----------------- PUBLIC: Events -----------------
async function loadEvents() {
  try {
    const res = await fetch("/api/events");
    const data = await res.json();
    const container = document.getElementById("eventsList");
    container.innerHTML = "";

    ["upcoming", "present", "past"].forEach(type => {
      if (data[type].length > 0) {
        const section = document.createElement("div");
        section.innerHTML = `<h3>${type.toUpperCase()}</h3>`;
        data[type].forEach(ev => {
          const div = document.createElement("div");
          div.innerHTML = `<b>${ev.title}</b> (${ev.startTime} → ${ev.endTime})`;
          section.appendChild(div);
        });
        container.appendChild(section);
      }
    });
  } catch (err) {
    console.error(err);
    alert("Failed to load events");
  }
}

// ----------------- ADMIN FUNCTIONS -----------------
async function loadAdminEvents() {
  try {
    const res = await fetch("/api/admin/events", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });
    const data = await res.json();
    document.getElementById("adminContent").innerHTML = JSON.stringify(data, null, 2);
  } catch (err) {
    alert("Failed to load admin events");
  }
}

async function loadRegistrations() {
  try {
    const res = await fetch("/api/admin/registrations", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });
    const data = await res.json();
    document.getElementById("adminContent").innerHTML = JSON.stringify(data, null, 2);
  } catch (err) {
    alert("Failed to load registrations");
  }
}

// ----------------- OWNER FUNCTIONS -----------------
async function manageAdmins() {
  try {
    const res = await fetch("/api/owner/admins", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });
    const data = await res.json();
    document.getElementById("ownerContent").innerHTML = JSON.stringify(data, null, 2);
  } catch (err) {
    alert("Failed to load admins");
  }
}

// ----------------- INIT -----------------
document.addEventListener("DOMContentLoaded", () => {
  updateUI();
  loadEvents();
});
