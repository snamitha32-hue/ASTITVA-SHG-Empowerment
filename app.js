const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/* ==================== PERSISTENT STATE ==================== */
let leaderName = localStorage.getItem("astitva_leader") || "Suma P.";
let activeMemberIndex = 0;

let orders = JSON.parse(localStorage.getItem("astitva_orders")) || [
  { id: "AST-024", customer: "Nandini Stores", item: "Handmade jute bags", qty: 120, due: "22 Nov 2026", progress: 75, status: "In progress" },
  { id: "AST-023", customer: "Green Basket", item: "Cotton tote bags", qty: 80, due: "20 Nov 2026", progress: 45, status: "Needs attention" },
  { id: "AST-022", customer: "Mitra Boutique", item: "Embroidered pouches", qty: 60, due: "18 Nov 2026", progress: 100, status: "Completed" },
  { id: "AST-021", customer: "Sakhi Crafts", item: "Decorative torans", qty: 40, due: "25 Nov 2026", progress: 30, status: "In progress" }
];

let members = JSON.parse(localStorage.getItem("astitva_members")) || [
  { name: "Lakshmi K.", initials: "LK", skill: "Stitching", work: "3 active tasks", earnings: "₹4,850", status: "Approved" },
  { name: "Pavani R.", initials: "PR", skill: "Embroidery", work: "2 active tasks", earnings: "₹3,600", status: "Approved" },
  { name: "Namitha S.", initials: "NS", skill: "Packaging", work: "1 active task", earnings: "₹2,950", status: "Approved" },
  { name: "Asha M.", initials: "AM", skill: "Craft making", work: "No active tasks", earnings: "₹1,800", status: "Pending" },
  { name: "Geetha P.", initials: "GP", skill: "Stitching", work: "2 active tasks", earnings: "₹3,200", status: "Approved" },
  { name: "Rekha N.", initials: "RN", skill: "Quality check", work: "1 active task", earnings: "₹2,050", status: "Approved" }
];

let assignments = JSON.parse(localStorage.getItem("astitva_assignments")) || [
  { task: "Jute bag handles", memberIndex: 0, orderId: "AST-024", pieces: 40, progress: 75 },
  { task: "Cotton tote stitching", memberIndex: 1, orderId: "AST-023", pieces: 20, progress: 45 },
  { task: "Packaging & labelling", memberIndex: 2, orderId: "AST-022", pieces: 60, progress: 100 },
  { task: "Final quality check", memberIndex: 5, orderId: "AST-024", pieces: 120, progress: 30 }
];

let payouts = JSON.parse(localStorage.getItem("astitva_payouts")) || [
  { memberIndex: 0, tasks: "8 tasks", amount: "₹4,850", status: "Ready" },
  { memberIndex: 1, tasks: "6 tasks", amount: "₹3,600", status: "Ready" },
  { memberIndex: 2, tasks: "5 tasks", amount: "₹2,950", status: "Ready" },
  { memberIndex: 4, tasks: "5 tasks", amount: "₹3,200", status: "Ready" },
  { memberIndex: 5, tasks: "3 tasks", amount: "₹2,050", status: "Ready" }
];

let deskSplits = JSON.parse(localStorage.getItem("astitva_desk_splits")) || [
  { name: "Lakshmi", given: 75, finished: 70, returned: 4 },
  { name: "Savitha", given: 75, finished: 75, returned: 2 },
  { name: "Radha", given: 75, finished: 60, returned: 0 },
  { name: "Meena", given: 75, finished: 68, returned: 8 }
];

let activities = [
  { initials: "LK", name: "Lakshmi", text: "completed 12 jute bag handles", time: "12 minutes ago", tone: "green" },
  { initials: "PR", name: "Pavani", text: "updated progress on AST-023", time: "48 minutes ago", tone: "" },
  { initials: "AM", name: "Asha", text: "requested to join your group", time: "2 hours ago", tone: "orange" }
];

let notifications = [
  { id: 1, text: "Lakshmi K. completed 12 jute bag handles on AST-024.", time: "12 mins ago", unread: true },
  { id: 2, text: "Pavani R. updated progress on AST-023 (45%).", time: "48 mins ago", unread: true },
  { id: 3, text: "Asha M. requested to join your group.", time: "2 hours ago", unread: false }
];

let currentRole = "leader";
let currentPage = "overview";

function saveAll() {
  localStorage.setItem("astitva_leader", leaderName);
  localStorage.setItem("astitva_orders", JSON.stringify(orders));
  localStorage.setItem("astitva_members", JSON.stringify(members));
  localStorage.setItem("astitva_assignments", JSON.stringify(assignments));
  localStorage.setItem("astitva_payouts", JSON.stringify(payouts));
  localStorage.setItem("astitva_desk_splits", JSON.stringify(deskSplits));
}

function getInitials(name) {
  return (name || "U").trim().split(/\s+/).map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

function statusClass(s) {
  return s === "Completed" || s === "Approved" || s === "Ready"
    ? "completed"
    : s === "Needs attention" || s === "Pending"
    ? "attention"
    : "progress";
}

function progressMarkup(p) {
  return `<div class="progress-cell"><div class="progress-line"><span style="width:${p}%"></span></div><span class="progress-label">${p}% complete</span></div>`;
}

/* ==================== NOTIFICATIONS ==================== */
function pushNotification(text, actorName = leaderName) {
  notifications.unshift({ id: Date.now(), text, time: "Just now", unread: true });
  activities.unshift({
    initials: getInitials(actorName),
    name: actorName.split(" ")[0],
    text: text.replace(actorName, "").trim(),
    time: "Just now",
    tone: "green"
  });
  renderNotifications();
  renderActivity();
}

function renderNotifications() {
  const list = $("#notifList");
  const badge = $("#notifCount");
  if (!list || !badge) return;

  const unread = notifications.filter(n => n.unread).length;
  badge.textContent = unread;
  badge.style.display = unread > 0 ? "inline-grid" : "none";

  list.innerHTML = notifications.length
    ? notifications.map(n => `<div class="notif-item ${n.unread ? "unread" : ""}"><p>${n.text}</p><small>${n.time}</small></div>`).join("")
    : `<p class="muted" style="padding:14px;">No group notifications yet.</p>`;
}

/* ==================== 1. INLINE ORDER EDITING ==================== */
function updateOrderField(orderId, field, value) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  if (field === "qty" || field === "progress") {
    order[field] = Math.max(0, Number(value) || 0);
    if (field === "progress" && order.progress > 100) order.progress = 100;
  } else {
    order[field] = value;
  }

  saveAll();
  renderRecentOrders();
  if (field === "status") {
    pushNotification(`${leaderName} changed ${order.id} status to "${order.status}".`);
  }
}

function renderRecentOrders() {
  $("#recentOrdersBody").innerHTML = orders
    .slice(0, 4)
    .map(
      o => `<tr>
        <td class="order-id"><strong>${o.id}</strong></td>
        <td class="customer-cell">
          <input class="inline-input bold-input" type="text" value="${o.customer}" oninput="updateOrderField('${o.id}', 'customer', this.value)" />
          <input class="inline-input" style="margin-top:4px;font-size:0.78rem;" type="text" value="${o.item || ""}" oninput="updateOrderField('${o.id}', 'item', this.value)" />
        </td>
        <td><input class="inline-input" type="text" value="${o.due}" oninput="updateOrderField('${o.id}', 'due', this.value)" /></td>
        <td>${progressMarkup(o.progress)}</td>
        <td><span class="status ${statusClass(o.status)}">${o.status}</span></td>
      </tr>`
    )
    .join("");
  $("#orderNavCount").textContent = orders.length;
}

function renderOrders() {
  renderRecentOrders();
  const q = ($("#orderSearch")?.value || "").toLowerCase();
  const f = $("#statusFilter")?.value || "all";
  const filtered = orders.filter(
    o => (f === "all" || o.status === f) && [o.id, o.customer, o.item].join(" ").toLowerCase().includes(q)
  );

  $("#allOrdersBody").innerHTML = filtered.length
    ? filtered
        .map(
          o => `<tr>
            <td class="order-id"><strong>${o.id}</strong></td>
            <td><input class="inline-input bold-input" type="text" value="${o.customer}" oninput="updateOrderField('${o.id}', 'customer', this.value)" /></td>
            <td><input class="inline-input" type="text" value="${o.item || ""}" oninput="updateOrderField('${o.id}', 'item', this.value)" /></td>
            <td><input class="inline-input small-num" type="number" min="1" value="${o.qty}" oninput="updateOrderField('${o.id}', 'qty', this.value)" /></td>
            <td><input class="inline-input" type="text" value="${o.due}" oninput="updateOrderField('${o.id}', 'due', this.value)" /></td>
            <td><input class="inline-input small-num" type="number" min="0" max="100" value="${o.progress}" oninput="updateOrderField('${o.id}', 'progress', this.value)" />%</td>
            <td>
              <select class="inline-select" onchange="updateOrderField('${o.id}', 'status', this.value)">
                <option ${o.status === "In progress" ? "selected" : ""}>In progress</option>
                <option ${o.status === "Needs attention" ? "selected" : ""}>Needs attention</option>
                <option ${o.status === "Completed" ? "selected" : ""}>Completed</option>
              </select>
            </td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="7" class="empty-state">No matching orders found.</td></tr>`;
}

/* ==================== 2. INLINE MEMBER EDITING ==================== */
function updateMemberField(idx, field, value) {
  const m = members[idx];
  if (!m) return;

  m[field] = value;
  if (field === "name") {
    m.initials = getInitials(value);
    const avatarEl = document.getElementById(`member-avatar-${idx}`);
    if (avatarEl) avatarEl.textContent = m.initials;

    if (idx === activeMemberIndex) {
      const dashName = $("#memberDashName");
      if (dashName && document.activeElement !== dashName) dashName.textContent = value.split(" ")[0];
      if ($("#memberDashAvatar")) $("#memberDashAvatar").textContent = m.initials;
      if (currentRole === "member") {
        $("#sideUserName").textContent = value;
        $("#sideAvatar").textContent = m.initials;
        $("#topAvatar").textContent = m.initials;
      }
    }
    renderPayouts();
    renderWork();
  }
  saveAll();
}

function renderMembers() {
  const q = ($("#memberSearch")?.value || "").toLowerCase();
  const filtered = members
    .map((m, idx) => ({ ...m, idx }))
    .filter(m => [m.name, m.skill, m.status, m.work, m.earnings].join(" ").toLowerCase().includes(q));

  $("#membersBody").innerHTML =
    filtered
      .map(
        m => `<tr>
          <td>
            <div class="member-cell" style="display:flex;align-items:center;gap:10px;">
              <span class="avatar avatar-purple" id="member-avatar-${m.idx}">${m.initials}</span>
              <input class="inline-input bold-input" type="text" value="${m.name}" oninput="updateMemberField(${m.idx}, 'name', this.value)" />
            </div>
          </td>
          <td><input class="inline-input" type="text" value="${m.skill}" oninput="updateMemberField(${m.idx}, 'skill', this.value)" /></td>
          <td><input class="inline-input" type="text" value="${m.work}" oninput="updateMemberField(${m.idx}, 'work', this.value)" /></td>
          <td><input class="inline-input small-num" type="text" value="${m.earnings}" oninput="updateMemberField(${m.idx}, 'earnings', this.value)" /></td>
          <td>
            <select class="inline-select" onchange="updateMemberField(${m.idx}, 'status', this.value); renderMembers();">
              <option ${m.status === "Approved" ? "selected" : ""}>Approved</option>
              <option ${m.status === "Pending" ? "selected" : ""}>Pending</option>
            </select>
          </td>
          <td><button class="remove-row-btn" onclick="removeMember(${m.idx})" title="Remove member">×</button></td>
        </tr>`
      )
      .join("") || `<tr><td colspan="6" class="empty-state">No members found.</td></tr>`;

  $("#memberCount").textContent = members.length;
  $("#statMembers").textContent = members.filter(m => m.status === "Approved").length;
}

function removeMember(idx) {
  const removed = members.splice(idx, 1)[0];
  saveAll();
  renderMembers();
  renderPayouts();
  renderWork();
  if (removed) pushNotification(`${leaderName} removed ${removed.name} from the group.`);
}

/* ==================== 3. INLINE LEADER NAME EDITING ==================== */
function syncLeaderName(newName, sourceEl) {
  if (currentRole !== "leader") return;
  const clean = newName.trim() || "Leader";
  leaderName = clean;
  saveAll();

  const initials = getInitials(clean);
  $("#sideAvatar").textContent = initials;
  $("#topAvatar").textContent = initials;

  const sideEl = $("#sideUserName");
  const greetEl = $("#leaderGreetingName");
  if (sourceEl !== sideEl) sideEl.textContent = clean;
  if (sourceEl !== greetEl) greetEl.textContent = clean.split(" ")[0];
}

$("#sideUserName").addEventListener("input", e => {
  if (currentRole === "leader") {
    syncLeaderName(e.target.textContent, e.target);
  } else {
    updateMemberField(activeMemberIndex, "name", e.target.textContent);
  }
});

$("#leaderGreetingName").addEventListener("input", e => {
  syncLeaderName(e.target.textContent, e.target);
});

$("#memberDashName").addEventListener("input", e => {
  updateMemberField(activeMemberIndex, "name", e.target.textContent);
});

/* ==================== 4. INLINE WORK & PAYOUT EDITING ==================== */
function updateAssignmentField(idx, field, value) {
  const item = assignments[idx];
  if (!item) return;
  if (field === "progress" || field === "pieces" || field === "memberIndex") {
    item[field] = Math.max(0, Number(value) || 0);
  } else {
    item[field] = value;
  }
  saveAll();
  if (field === "progress") {
    const workerName = members[item.memberIndex]?.name || "Member";
    pushNotification(`${workerName} updated "${item.task}" to ${item.progress}%.`, workerName);
  }
}

function renderWork() {
  $("#workList").innerHTML = assignments
    .map(
      (a, idx) => `<div class="work-item" style="display:grid;grid-template-columns:2fr 1.2fr 1fr 0.7fr;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
        <input class="inline-input bold-input" type="text" value="${a.task}" oninput="updateAssignmentField(${idx}, 'task', this.value)" />
        <select class="inline-select" onchange="updateAssignmentField(${idx}, 'memberIndex', this.value)">
          ${members.map((m, mIdx) => `<option value="${mIdx}" ${a.memberIndex === mIdx ? "selected" : ""}>${m.name}</option>`).join("")}
        </select>
        <div style="display:flex;align-items:center;gap:6px;">
          <input class="inline-input small-num" type="number" value="${a.pieces}" oninput="updateAssignmentField(${idx}, 'pieces', this.value)" /> pcs
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          <input class="inline-input small-num" type="number" min="0" max="100" value="${a.progress}" oninput="updateAssignmentField(${idx}, 'progress', this.value)" />%
        </div>
      </div>`
    )
    .join("");

  $("#memberTasks").innerHTML = assignments
    .map((a, idx) => ({ ...a, idx }))
    .slice(0, 3)
    .map(
      a => `<div class="work-item" style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
        <div><strong>${a.task}</strong><small style="display:block;color:var(--muted);">${a.orderId} · ${a.pieces} pieces</small></div>
        <div style="display:flex;align-items:center;gap:8px;">
          <input class="inline-input small-num" type="number" min="0" max="100" value="${a.progress}" onchange="updateAssignmentField(${a.idx}, 'progress', this.value); renderWork();" />%
        </div>
      </div>`
    )
    .join("");
}

function updatePayoutField(idx, field, value) {
  if (!payouts[idx]) return;
  payouts[idx][field] = field === "memberIndex" ? Number(value) : value;
  saveAll();
}

function renderPayouts() {
  $("#payoutBody").innerHTML = payouts
    .map(
      (p, idx) => `<tr>
        <td>
          <select class="inline-select" onchange="updatePayoutField(${idx}, 'memberIndex', this.value)">
            ${members.map((m, mIdx) => `<option value="${mIdx}" ${p.memberIndex === mIdx ? "selected" : ""}>${m.name}</option>`).join("")}
          </select>
        </td>
        <td><input class="inline-input" type="text" value="${p.tasks}" oninput="updatePayoutField(${idx}, 'tasks', this.value)" /></td>
        <td><input class="inline-input bold-input small-num" type="text" value="${p.amount}" oninput="updatePayoutField(${idx}, 'amount', this.value)" /></td>
        <td>
          <select class="inline-select" onchange="updatePayoutField(${idx}, 'status', this.value)">
            <option ${p.status === "Ready" ? "selected" : ""}>Ready</option>
            <option ${p.status === "Released" ? "selected" : ""}>Released</option>
            <option ${p.status === "Pending" ? "selected" : ""}>Pending</option>
          </select>
        </td>
      </tr>`
    )
    .join("");
}

function renderActivity() {
  $("#activityList").innerHTML = activities
    .slice(0, 6)
    .map(
      a => `<div class="activity-item" style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
        <span class="avatar avatar-purple">${a.initials}</span>
        <div><strong>${a.name}</strong> ${a.text}<small style="display:block;color:var(--muted);">${a.time}</small></div>
      </div>`
    )
    .join("");
}

/* ==================== 5. LIVE ORDER DESK CALCULATOR ==================== */
function calculateDeskMargin() {
  const pieces = Math.max(1, Number($("#deskPieces")?.value) || 1);
  const price = Number($("#deskPrice")?.value) || 0;
  const material = Number($("#deskMaterial")?.value) || 0;
  const hours = Number($("#deskHours")?.value) || 0;
  const wage = Number($("#deskWage")?.value) || 0;

  const breakEven = Math.round(material / pieces + hours * wage);
  const banner = $("#deskMarginBanner");
  if (!banner) return;

  if (price >= breakEven) {
    banner.className = "status-banner good";
    banner.innerHTML = `Price covers material and a fair wage. Break-even is <strong>₹${breakEven}</strong> per piece.`;
  } else {
    banner.className = "status-banner warn";
    banner.innerHTML = `Price is below break-even (<strong>₹${breakEven}</strong> per piece). Increase price or reduce material cost.`;
  }
}

function updateDeskRow(index, field, value) {
  if (!deskSplits[index]) return;
  if (field === "name") {
    deskSplits[index].name = value;
  } else {
    deskSplits[index][field] = Math.max(0, Number(value) || 0);
    const accepted = Math.max(0, deskSplits[index].finished - deskSplits[index].returned);
    const accCell = document.getElementById(`desk-accepted-${index}`);
    if (accCell) accCell.textContent = accepted;
  }
  saveAll();
}

function removeDeskRow(index) {
  deskSplits.splice(index, 1);
  saveAll();
  renderDesk();
}

function renderDesk() {
  const tbody = $("#deskWorkBody");
  if (!tbody) return;

  tbody.innerHTML = deskSplits
    .map((row, i) => {
      const accepted = Math.max(0, row.finished - row.returned);
      return `<tr>
        <td><input class="pill-input" type="text" value="${row.name}" oninput="updateDeskRow(${i}, 'name', this.value)" /></td>
        <td><input class="pill-input num-pill" type="number" min="0" value="${row.given}" oninput="updateDeskRow(${i}, 'given', this.value)" /></td>
        <td><input class="pill-input num-pill" type="number" min="0" value="${row.finished}" oninput="updateDeskRow(${i}, 'finished', this.value)" /></td>
        <td><input class="pill-input num-pill" type="number" min="0" value="${row.returned}" oninput="updateDeskRow(${i}, 'returned', this.value)" /></td>
        <td><strong id="desk-accepted-${i}" style="font-size:1rem;">${accepted}</strong></td>
        <td><button type="button" class="remove-row-btn" onclick="removeDeskRow(${i})" aria-label="Remove member">×</button></td>
      </tr>`;
    })
    .join("");

  calculateDeskMargin();
}

["deskPieces", "deskPrice", "deskMaterial", "deskHours", "deskWage"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", calculateDeskMargin);
});

$("#addDeskMemberBtn")?.addEventListener("click", () => {
  deskSplits.push({ name: "New Member", given: 0, finished: 0, returned: 0 });
  saveAll();
  renderDesk();
});

/* ==================== NAVIGATION & SEPARATE DASHBOARDS ==================== */
function showPage(page) {
  currentPage = page;
  $$(".page").forEach(p => p.classList.remove("active"));
  const target = $("#page-" + page);
  if (target) target.classList.add("active");
  $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  $("#breadcrumbPage").textContent = page === "memberhome" ? "Member Dashboard" : page.charAt(0).toUpperCase() + page.slice(1);
  $("#sidebar").classList.remove("open");
}

function switchRole(role) {
  currentRole = role;
  if (role === "member") {
    const activeMember = members[activeMemberIndex] || members[0];
    $$(".nav-list .nav-item").forEach(b => (b.style.display = "none"));
    $("#sideUserName").textContent = activeMember.name;
    $("#sideUserRole").textContent = "Group member";
    $("#sideAvatar").textContent = activeMember.initials;
    $("#topAvatar").textContent = activeMember.initials;
    $("#memberDashName").textContent = activeMember.name.split(" ")[0];
    $("#memberDashAvatar").textContent = activeMember.initials;
    showPage("memberhome");
  } else {
    $$(".nav-list .nav-item").forEach(b => (b.style.display = "flex"));
    $("#sideUserName").textContent = leaderName;
    $("#sideUserRole").textContent = "Group leader";
    $("#sideAvatar").textContent = getInitials(leaderName);
    $("#topAvatar").textContent = getInitials(leaderName);
    showPage("overview");
  }
}

$$(".nav-item").forEach(b => b.addEventListener("click", () => showPage(b.dataset.page)));
$$("[data-goto]").forEach(b => b.addEventListener("click", () => showPage(b.dataset.goto)));
$("#roleSelect").addEventListener("change", e => switchRole(e.target.value));
$("#mobileMenu").onclick = () => $("#sidebar").classList.toggle("open");
$("#orderSearch").addEventListener("input", renderOrders);
$("#statusFilter").addEventListener("change", renderOrders);
$("#memberSearch").addEventListener("input", renderMembers);

/* Notification dropdown toggles */
$("#notificationBtn").onclick = e => {
  e.stopPropagation();
  $("#notifDropdown").classList.toggle("open");
};
$("#clearNotifsBtn").onclick = () => {
  notifications.forEach(n => (n.unread = false));
  renderNotifications();
};
document.addEventListener("click", e => {
  if (!e.target.closest(".notif-wrapper")) {
    $("#notifDropdown")?.classList.remove("open");
  }
});

/* ==================== MODALS & QUICK ADD ==================== */
const backdrop = $("#modalBackdrop"),
  form = $("#modalForm");

function openModal(title, description, fields, submitLabel, handler) {
  $("#modalTitle").textContent = title;
  $("#modalDescription").textContent = description;
  form.innerHTML = `<div class="form-grid">${fields
    .map(
      f =>
        `<div class="field ${f.full ? "full" : ""}" style="margin-bottom:12px;"><label for="${f.name}" style="display:block;font-size:0.85rem;margin-bottom:4px;">${f.label}</label>${
          f.options
            ? `<select id="${f.name}" class="inline-select" ${f.required ? "required" : ""}>${f.options.map(o => `<option value="${o.value ?? o}">${o.label ?? o}</option>`).join("")}</select>`
            : `<input id="${f.name}" class="inline-input" type="${f.type || "text"}" placeholder="${f.placeholder || ""}" ${f.required ? "required" : ""} ${f.value ? `value="${f.value}"` : ""} />`
        }</div>`
    )
    .join("")}<div class="form-actions" style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;"><button type="button" class="help-link" id="cancelModal">Cancel</button><button class="primary-button" type="submit">${submitLabel}</button></div></div>`;
  backdrop.classList.add("open");
  $("#cancelModal").onclick = closeModal;
  form.onsubmit = e => {
    e.preventDefault();
    const data = {};
    fields.forEach(f => (data[f.name] = $("#" + f.name).value));
    const result = handler(data);
    if (result !== false) closeModal();
  };
}

function closeModal() {
  backdrop.classList.remove("open");
  form.onsubmit = null;
}

$("#modalClose").onclick = closeModal;
backdrop.addEventListener("click", e => {
  if (e.target === backdrop) closeModal();
});

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

function createOrder() {
  openModal(
    "Create a new order",
    "Add an order—you can click and edit any field right inside the table afterwards.",
    [
      { name: "customer", label: "Customer / organisation", placeholder: "e.g. Green Basket", required: true, full: true },
      { name: "item", label: "Product / item", placeholder: "e.g. Handmade jute bags", required: true, full: true },
      { name: "qty", label: "Quantity (pieces)", type: "number", placeholder: "50", required: true },
      { name: "due", label: "Due date", type: "date", required: true },
      { name: "status", label: "Initial status", options: ["In progress", "Needs attention"] }
    ],
    "Save order",
    d => {
      const date = new Date(d.due + "T00:00:00");
      const due = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const newId = "AST-" + String(orders.length + 21).padStart(3, "0");
      orders.unshift({ id: newId, customer: d.customer, item: d.item, qty: Number(d.qty), due, progress: 0, status: d.status });
      saveAll();
      renderOrders();
      $("#statOrders").textContent = Number($("#statOrders").textContent) + 1;
      pushNotification(`${leaderName} added order ${newId} (${d.item} for ${d.customer}).`);
      toast("Order added! Click any field in the table to edit inline.");
    }
  );
}

$("#createOrderBtn").onclick = createOrder;
$("#createOrderBtn2").onclick = createOrder;

$("#addMemberBtn").onclick = () =>
  openModal(
    "Add a member",
    "Add a new member—their name, skill, and status remain editable inline.",
    [
      { name: "name", label: "Full name", placeholder: "Member name", required: true, full: true },
      { name: "skill", label: "Primary skill", placeholder: "e.g. Stitching", required: true },
      { name: "phone", label: "Phone number", placeholder: "10-digit mobile", required: true }
    ],
    "Add member",
    d => {
      const initials = getInitials(d.name);
      members.push({ name: d.name, initials, skill: d.skill, work: "No active tasks", earnings: "₹0", status: "Pending" });
      saveAll();
      renderMembers();
      pushNotification(`${leaderName} added ${d.name} to the member list.`);
      toast("Member added! Click their name or skill anytime to edit.");
    }
  );

$("#allocateBtn").onclick = () =>
  openModal(
    "Allocate work",
    "Record a task assignment for your team.",
    [
      { name: "task", label: "Task name", placeholder: "e.g. Stitch 20 tote bags", required: true, full: true },
      { name: "memberIndex", label: "Assign to", options: members.map((m, i) => ({ value: i, label: m.name })) },
      { name: "order", label: "Related order", options: orders.map(o => o.id) },
      { name: "quantity", label: "Quantity", type: "number", placeholder: "20", required: true }
    ],
    "Save assignment",
    d => {
      const idx = Number(d.memberIndex);
      assignments.unshift({ task: d.task, memberIndex: idx, orderId: d.order, pieces: Number(d.quantity), progress: 0 });
      saveAll();
      renderWork();
      pushNotification(`${leaderName} assigned "${d.task}" to ${members[idx].name}.`);
      toast("Work assignment saved.");
    }
  );

$("#releasePayoutBtn").onclick = () =>
  openModal(
    "Release payouts",
    "Enter the group's bank details to prepare a demo payout record. No money will be transferred.",
    [
      { name: "accountName", label: "Account holder name", placeholder: "Name as per bank account", required: true, full: true },
      { name: "accountNumber", label: "Account number", placeholder: "Enter account number", required: true },
      { name: "ifsc", label: "IFSC code", placeholder: "e.g. SBIN0001234", required: true },
      { name: "bank", label: "Bank name", placeholder: "Bank name", required: true, full: true },
      { name: "amount", label: "Payout amount (₹)", type: "number", placeholder: "18450", required: true, full: true }
    ],
    "Prepare payout",
    d => {
      if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(d.ifsc.trim().toUpperCase())) {
        toast("Please enter a valid IFSC code.");
        return false;
      }
      if (!/^[0-9]{9,18}$/.test(d.accountNumber.trim())) {
        toast("Please check the account number.");
        return false;
      }
      pushNotification(`${leaderName} prepared a payout record of ₹${d.amount}.`);
      toast("Demo payout record prepared. No transfer was made.");
    }
  );

$("#helpBtn").onclick = () => toast("Click any name, order, task, or amount directly to edit it on the spot!");

/* ==================== INITIALIZE APP ==================== */
syncLeaderName(leaderName, null);
renderOrders();
renderMembers();
renderActivity();
renderNotifications();
renderPayouts();
renderWork();
renderDesk();

if (window.location.hash === "#member") {
  $("#roleSelect").value = "member";
  switchRole("member");
}