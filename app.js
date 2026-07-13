const storageKey = "family-lottery-console-v1";

const defaults = {
  currentPoolId: "sky-city",
  drawCredit: 0,
  tasks: [
    {
      id: "task-sample-1",
      title: "完成今天的学习任务",
      reward: 2,
      done: false,
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false })
    },
    {
      id: "task-sample-2",
      title: "帮忙收拾桌面",
      reward: 1,
      done: false,
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false })
    }
  ],
  history: [],
  pools: [
    {
      id: "sky-city",
      name: "天空之城",
      items: [
        { id: "tian", name: "天", initialStock: 45, stock: 45, weight: 45 },
        { id: "kong", name: "空", initialStock: 35, stock: 35, weight: 35 },
        { id: "zhi", name: "之", initialStock: 18, stock: 18, weight: 18 },
        { id: "cheng", name: "城", initialStock: 2, stock: 2, weight: 2 }
      ]
    },
    {
      id: "zhou-dachu",
      name: "周大厨",
      items: [
        { id: "zhou", name: "周", initialStock: 50, stock: 50, weight: 50 },
        { id: "da", name: "大", initialStock: 49, stock: 49, weight: 49 },
        { id: "chu", name: "厨", initialStock: 1, stock: 1, weight: 1 }
      ]
    },
    {
      id: "keyboard",
      name: "键盘",
      items: [
        { id: "jian", name: "键", initialStock: 99, stock: 99, weight: 99 },
        { id: "pan", name: "盘", initialStock: 1, stock: 1, weight: 1 }
      ]
    },
    {
      id: "xuanka",
      name: "炫卡斗士",
      items: [
        { id: "xuan", name: "炫", initialStock: 66, stock: 66, weight: 66 },
        { id: "ka", name: "卡", initialStock: 66, stock: 66, weight: 66 },
        { id: "dou", name: "斗", initialStock: 66, stock: 66, weight: 66 },
        { id: "shi", name: "士", initialStock: 2, stock: 2, weight: 2 }
      ]
    },
    {
      id: "drone",
      name: "无人机",
      items: [
        { id: "wu", name: "无", initialStock: 100, stock: 100, weight: 100 },
        { id: "ren", name: "人", initialStock: 99, stock: 99, weight: 99 },
        { id: "ji", name: "机", initialStock: 1, stock: 1, weight: 1 }
      ]
    },
    {
      id: "tank",
      name: "坦克",
      items: [
        { id: "tan", name: "坦", initialStock: 198, stock: 198, weight: 198 },
        { id: "ke", name: "克", initialStock: 2, stock: 2, weight: 2 }
      ]
    }
  ]
};

let state = loadState();
let sessionRole = sessionStorage.getItem("lottery-role") || "";
let selectedRole = "brother";

const passwordHashes = {
  admin: "3e20173ad793d17dbe43b5e9aae1423bc44677b3ba003046058f6aadc61ce27d",
  brother: "bcb15f821479b4d5772bd0ca866c00ad5f926e3580720659cc80d39c9d09802a"
};

const poolList = document.querySelector("#poolList");
const poolNameInput = document.querySelector("#poolNameInput");
const itemRows = document.querySelector("#itemRows");
const historyList = document.querySelector("#historyList");
const drawResult = document.querySelector("#drawResult");
const ticketWindow = document.querySelector("#ticketWindow");
const remainingCount = document.querySelector("#remainingCount");
const totalWeight = document.querySelector("#totalWeight");
const activeItemCount = document.querySelector("#activeItemCount");
const drawCredit = document.querySelector("#drawCredit");
const taskTitleInput = document.querySelector("#taskTitleInput");
const taskRewardInput = document.querySelector("#taskRewardInput");
const taskList = document.querySelector("#taskList");
const loginScreen = document.querySelector("#loginScreen");
const loginBtn = document.querySelector("#loginBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const passwordInput = document.querySelector("#passwordInput");
const loginError = document.querySelector("#loginError");
const roleLabel = document.querySelector("#roleLabel");

document.querySelector("#addPoolBtn").addEventListener("click", addPool);
document.querySelector("#deletePoolBtn").addEventListener("click", deletePool);
document.querySelector("#addItemBtn").addEventListener("click", addItem);
document.querySelector("#addTaskBtn").addEventListener("click", () => taskTitleInput.focus());
document.querySelector("#createTaskBtn").addEventListener("click", createTask);
document.querySelector("#drawOneBtn").addEventListener("click", () => drawMany(1));
document.querySelector("#drawTenBtn").addEventListener("click", () => drawMany(10));
document.querySelector("#minusCreditBtn").addEventListener("click", () => changeCredit(-1));
document.querySelector("#plusCreditBtn").addEventListener("click", () => changeCredit(1));
document.querySelector("#redeemBtn").addEventListener("click", redeemCurrentPool);
document.querySelector("#resetPoolBtn").addEventListener("click", resetCurrentPool);
document.querySelector("#clearHistoryBtn").addEventListener("click", clearHistory);
document.querySelector("#resetAllBtn").addEventListener("click", resetAll);
document.querySelector("#exportBtn").addEventListener("click", exportConfig);
document.querySelector("#importFile").addEventListener("change", importConfig);
loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);
passwordInput.addEventListener("keydown", event => {
  if (event.key === "Enter") login();
});
document.querySelectorAll(".role-card").forEach(button => {
  button.addEventListener("click", () => {
    selectedRole = button.dataset.role;
    document.querySelectorAll(".role-card").forEach(card => card.classList.toggle("active", card === button));
    passwordInput.focus();
  });
});
taskTitleInput.addEventListener("keydown", event => {
  if (event.key === "Enter") createTask();
});

poolNameInput.addEventListener("input", () => {
  const pool = getCurrentPool();
  if (!pool) return;
  pool.name = poolNameInput.value.trim() || "未命名奖池";
  persist();
  render();
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return clone(defaults);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.pools) || parsed.pools.length === 0) return clone(defaults);
    parsed.drawCredit = Math.max(0, Math.floor(Number(parsed.drawCredit) || 0));
    if (!Array.isArray(parsed.tasks)) parsed.tasks = [];
    return parsed;
  } catch {
    return clone(defaults);
  }
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function isAdmin() {
  return sessionRole === "admin";
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function login() {
  const password = passwordInput.value;
  const ok = await sha256(password) === passwordHashes[selectedRole];
  if (!ok) {
    loginError.textContent = "密码不对。";
    passwordInput.select();
    return;
  }
  sessionRole = selectedRole;
  sessionStorage.setItem("lottery-role", sessionRole);
  passwordInput.value = "";
  loginError.textContent = "";
  applyRole();
  render();
}

function logout() {
  sessionRole = "";
  sessionStorage.removeItem("lottery-role");
  passwordInput.value = "";
  applyRole();
}

function applyRole() {
  document.body.classList.toggle("locked", !sessionRole);
  document.body.classList.toggle("role-admin", sessionRole === "admin");
  document.body.classList.toggle("role-brother", sessionRole === "brother");
  roleLabel.textContent = isAdmin()
    ? "哥哥后台 · 发任务 · 管奖池 · 管次数"
    : "弟弟抽奖台 · 看任务 · 抽奖 · 兑奖";
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function getCurrentPool() {
  return state.pools.find(pool => pool.id === state.currentPoolId) || state.pools[0];
}

function getActiveItems(pool) {
  return pool.items.filter(item => Number(item.stock) > 0 && Number(item.weight) > 0);
}

function getWeightSum(pool) {
  return getActiveItems(pool).reduce((sum, item) => sum + Number(item.weight), 0);
}

function getRemaining(pool) {
  return pool.items.reduce((sum, item) => sum + Math.max(0, Number(item.stock) || 0), 0);
}

function probability(pool, item) {
  if (Number(item.stock) <= 0 || Number(item.weight) <= 0) return 0;
  const sum = getWeightSum(pool);
  return sum > 0 ? Number(item.weight) / sum : 0;
}

function addPool() {
  if (!isAdmin()) return;
  const id = uid("pool");
  state.pools.push({
    id,
    name: "新奖池",
    items: [
      { id: uid("item"), name: "普通", initialStock: 99, stock: 99, weight: 99 },
      { id: uid("item"), name: "稀有", initialStock: 1, stock: 1, weight: 1 }
    ]
  });
  state.currentPoolId = id;
  persist();
  render();
}

function deletePool() {
  if (!isAdmin()) return;
  if (state.pools.length <= 1) return;
  const pool = getCurrentPool();
  if (!confirm(`删除奖池「${pool.name}」？`)) return;
  state.pools = state.pools.filter(item => item.id !== pool.id);
  state.currentPoolId = state.pools[0].id;
  persist();
  render();
}

function addItem() {
  if (!isAdmin()) return;
  const pool = getCurrentPool();
  pool.items.push({
    id: uid("item"),
    name: "新字",
    initialStock: 10,
    stock: 10,
    weight: 10
  });
  persist();
  render();
}

function createTask() {
  if (!isAdmin()) return;
  const title = taskTitleInput.value.trim();
  const reward = Math.max(1, Math.floor(Number(taskRewardInput.value) || 1));
  if (!title) {
    taskTitleInput.focus();
    return;
  }
  state.tasks.unshift({
    id: uid("task"),
    title,
    reward,
    done: false,
    createdAt: new Date().toLocaleString("zh-CN", { hour12: false })
  });
  taskTitleInput.value = "";
  taskRewardInput.value = 1;
  persist();
  render();
}

function completeTask(id) {
  if (!isAdmin()) return;
  const task = state.tasks.find(item => item.id === id);
  if (!task || task.done) return;
  task.done = true;
  task.doneAt = new Date().toLocaleString("zh-CN", { hour12: false });
  state.drawCredit = Math.max(0, Number(state.drawCredit) || 0) + Number(task.reward);
  state.history.unshift({
    pool: "任务奖励",
    item: `+${task.reward} 次`,
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false })
  });
  persist();
  render();
}

function reopenTask(id) {
  if (!isAdmin()) return;
  const task = state.tasks.find(item => item.id === id);
  if (!task || !task.done) return;
  task.done = false;
  delete task.doneAt;
  state.drawCredit = Math.max(0, (Number(state.drawCredit) || 0) - Number(task.reward));
  persist();
  render();
}

function deleteTask(id) {
  if (!isAdmin()) return;
  state.tasks = state.tasks.filter(item => item.id !== id);
  persist();
  render();
}

function changeCredit(delta) {
  if (!isAdmin()) return;
  state.drawCredit = Math.max(0, (Number(state.drawCredit) || 0) + delta);
  persist();
  render();
}

function updateItem(id, key, value) {
  const pool = getCurrentPool();
  const item = pool.items.find(entry => entry.id === id);
  if (!item) return;
  if (key === "name") {
    item.name = value.trim() || "未命名";
  } else {
    const number = Math.max(0, Math.floor(Number(value) || 0));
    item[key] = number;
    if (key === "initialStock" && item.stock > number) item.stock = number;
  }
  persist();
  render();
}

function removeItem(id) {
  const pool = getCurrentPool();
  if (pool.items.length <= 1) return;
  pool.items = pool.items.filter(item => item.id !== id);
  persist();
  render();
}

function drawOne() {
  const pool = getCurrentPool();
  const active = getActiveItems(pool);
  const sum = getWeightSum(pool);
  if (!active.length || sum <= 0) return null;

  let roll = Math.random() * sum;
  const selected = active.find(item => {
    roll -= Number(item.weight);
    return roll < 0;
  }) || active[active.length - 1];

  selected.stock = Math.max(0, Number(selected.stock) - 1);
  return selected;
}

function drawMany(count) {
  const pool = getCurrentPool();
  const results = [];
  const allowed = Math.min(count, Number(state.drawCredit) || 0);
  if (allowed <= 0) {
    drawResult.textContent = "次数不足";
    ticketWindow.classList.remove("spin");
    requestAnimationFrame(() => ticketWindow.classList.add("spin"));
    return;
  }
  for (let i = 0; i < allowed; i += 1) {
    const result = drawOne();
    if (!result) break;
    state.drawCredit = Math.max(0, (Number(state.drawCredit) || 0) - 1);
    results.push(result.name);
    state.history.unshift({
      pool: pool.name,
      item: result.name,
      time: new Date().toLocaleTimeString("zh-CN", { hour12: false })
    });
  }
  state.history = state.history.slice(0, 120);
  drawResult.textContent = results.length ? results.join(" ") : "奖池已空";
  ticketWindow.classList.remove("spin");
  requestAnimationFrame(() => ticketWindow.classList.add("spin"));
  persist();
  render();
}

function resetCurrentPool() {
  if (!isAdmin()) return;
  const pool = getCurrentPool();
  pool.items.forEach(item => {
    item.stock = Number(item.initialStock) || 0;
  });
  drawResult.textContent = "库存已重置";
  persist();
  render();
}

function clearHistory() {
  if (!isAdmin() && !confirm("清空自己的显示记录？")) return;
  state.history = [];
  persist();
  render();
}

function resetAll() {
  if (!isAdmin()) return;
  if (!confirm("恢复默认会覆盖当前所有奖池配置，确定？")) return;
  state = clone(defaults);
  persist();
  drawResult.textContent = "待抽取";
  render();
}

function exportConfig() {
  if (!isAdmin()) return;
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "lottery-config.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

function importConfig(event) {
  if (!isAdmin()) return;
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!Array.isArray(data.pools) || !data.pools.length) throw new Error("bad config");
      state = data;
      persist();
      render();
    } catch {
      alert("配置文件不正确。");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function redeemCurrentPool() {
  const pool = getCurrentPool();
  const required = [...new Set(pool.name.split("").filter(Boolean))];
  const missing = required.filter(char => {
    const item = pool.items.find(entry => entry.name === char);
    return !item || Number(item.initialStock) - Number(item.stock) <= 0;
  });
  if (missing.length) {
    drawResult.textContent = `还缺 ${missing.join(" ")}`;
    ticketWindow.classList.remove("spin");
    requestAnimationFrame(() => ticketWindow.classList.add("spin"));
    return;
  }
  state.history.unshift({
    pool: "兑奖申请",
    item: pool.name,
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false })
  });
  drawResult.textContent = `申请兑奖：${pool.name}`;
  persist();
  render();
}

function renderPools() {
  poolList.innerHTML = "";
  const template = document.querySelector("#poolButtonTemplate");
  state.pools.forEach(pool => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.classList.toggle("active", pool.id === getCurrentPool().id);
    node.querySelector(".pool-name").textContent = pool.name;
    node.querySelector(".pool-meta").textContent = `${getRemaining(pool)} 张 · ${pool.items.length} 种`;
    node.addEventListener("click", () => {
      state.currentPoolId = pool.id;
      persist();
      drawResult.textContent = "待抽取";
      render();
    });
    poolList.appendChild(node);
  });
}

function renderEditor() {
  const pool = getCurrentPool();
  state.currentPoolId = pool.id;
  poolNameInput.value = pool.name;
  remainingCount.textContent = getRemaining(pool);
  totalWeight.textContent = getWeightSum(pool);
  activeItemCount.textContent = getActiveItems(pool).length;
  drawCredit.textContent = Number(state.drawCredit) || 0;

  itemRows.innerHTML = "";
  pool.items.forEach(item => {
    const chance = probability(pool, item);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input aria-label="条目名称" value="${escapeHtml(item.name)}"></td>
      <td><input class="number-input" aria-label="库存" type="number" min="0" value="${item.stock}"></td>
      <td><input class="number-input" aria-label="权重" type="number" min="0" value="${item.weight}"></td>
      <td>
        <div class="probability">
          <strong>${(chance * 100).toFixed(2)}%</strong>
          <span class="bar"><i style="width:${Math.min(100, chance * 100)}%"></i></span>
        </div>
      </td>
      <td><button class="danger small" type="button">删除</button></td>
    `;
    const [nameInput, stockInput, weightInput] = tr.querySelectorAll("input");
    nameInput.addEventListener("change", event => updateItem(item.id, "name", event.target.value));
    stockInput.addEventListener("change", event => updateItem(item.id, "stock", event.target.value));
    weightInput.addEventListener("change", event => updateItem(item.id, "weight", event.target.value));
    tr.querySelector("button").addEventListener("click", () => removeItem(item.id));
    itemRows.appendChild(tr);
  });

  document.querySelector("#drawOneBtn").disabled = getWeightSum(pool) <= 0 || (Number(state.drawCredit) || 0) <= 0;
  document.querySelector("#drawTenBtn").disabled = getWeightSum(pool) <= 0 || (Number(state.drawCredit) || 0) <= 0;
  poolNameInput.readOnly = !isAdmin();
}

function renderTasks() {
  taskList.innerHTML = "";
  if (!state.tasks.length) {
    taskList.innerHTML = `<div class="empty">还没有任务。你可以发布一个任务，完成后发放抽奖次数。</div>`;
    return;
  }
  state.tasks.forEach(task => {
    const row = document.createElement("div");
    row.className = `task-item${task.done ? " done" : ""}`;
    const status = task.done ? `已完成 · ${task.doneAt || ""}` : `发布于 ${task.createdAt || ""}`;
    row.innerHTML = `
      <div class="task-main">
        <strong>${escapeHtml(task.title)}</strong>
        <span>${escapeHtml(status)}</span>
      </div>
      <span class="task-badge">+${Number(task.reward) || 0} 次</span>
      <button class="${task.done ? "ghost" : "primary"} small admin-only" type="button">${task.done ? "撤销" : "完成发奖"}</button>
      <button class="danger small admin-only" type="button">删除</button>
    `;
    const [toggleBtn, deleteBtn] = row.querySelectorAll("button");
    if (toggleBtn) toggleBtn.addEventListener("click", () => task.done ? reopenTask(task.id) : completeTask(task.id));
    if (deleteBtn) deleteBtn.addEventListener("click", () => deleteTask(task.id));
    taskList.appendChild(row);
  });
}

function renderHistory() {
  historyList.innerHTML = "";
  if (!state.history.length) {
    historyList.innerHTML = `<div class="empty">还没有抽奖记录。</div>`;
    return;
  }
  state.history.forEach(entry => {
    const row = document.createElement("div");
    row.className = "history-item";
    row.innerHTML = `<strong>${escapeHtml(entry.item)}</strong><span>${escapeHtml(entry.pool)} · ${entry.time}</span>`;
    historyList.appendChild(row);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render() {
  applyRole();
  renderPools();
  renderEditor();
  renderTasks();
  renderHistory();
}

render();
