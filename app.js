const storageKey = "family-lottery-console-v1";
const cloudRowId = "main";
const maxPoolImageSize = 1200;
const poolImageQuality = 0.86;
const defaultPoolImages = {
  "sky-city": "assets/sky-city-banner.jpg",
  "zhou-dachu": "assets/zhou-dachu-banner.jpg",
  "keyboard": "assets/keyboard-banner.jpg",
  "xuanka": "assets/xuanka-banner.jpg",
  "drone": "assets/drone-banner.jpg",
  "tank": "assets/tank-banner.jpg"
};

// Fill these after creating the Supabase project.
const SUPABASE_URL = "https://ifgipldyqurefdtwhqdd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Y12CyC_9Y8MKUBpLfaDivg_C9yQiTeS";

const defaults = {
  currentPoolId: "sky-city",
  drawCredit: 0,
  inventory: {},
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
      imageUrl: defaultPoolImages["sky-city"],
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
      imageUrl: defaultPoolImages["zhou-dachu"],
      items: [
        { id: "zhou", name: "周", initialStock: 50, stock: 50, weight: 50 },
        { id: "da", name: "大", initialStock: 49, stock: 49, weight: 49 },
        { id: "chu", name: "厨", initialStock: 1, stock: 1, weight: 1 }
      ]
    },
    {
      id: "keyboard",
      name: "键盘",
      imageUrl: defaultPoolImages["keyboard"],
      items: [
        { id: "jian", name: "键", initialStock: 99, stock: 99, weight: 99 },
        { id: "pan", name: "盘", initialStock: 1, stock: 1, weight: 1 }
      ]
    },
    {
      id: "xuanka",
      name: "炫卡斗士",
      imageUrl: defaultPoolImages["xuanka"],
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
      imageUrl: defaultPoolImages["drone"],
      items: [
        { id: "wu", name: "无", initialStock: 100, stock: 100, weight: 100 },
        { id: "ren", name: "人", initialStock: 99, stock: 99, weight: 99 },
        { id: "ji", name: "机", initialStock: 1, stock: 1, weight: 1 }
      ]
    },
    {
      id: "tank",
      name: "坦克",
      imageUrl: defaultPoolImages["tank"],
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
let cloud = null;
let applyingRemote = false;
let saveTimer = null;
let lastCloudUpdatedAt = "";

const passwordHashes = {
  admin: "3e20173ad793d17dbe43b5e9aae1423bc44677b3ba003046058f6aadc61ce27d",
  dad: "3e20173ad793d17dbe43b5e9aae1423bc44677b3ba003046058f6aadc61ce27d",
  mom: "3e20173ad793d17dbe43b5e9aae1423bc44677b3ba003046058f6aadc61ce27d",
  brother: "bcb15f821479b4d5772bd0ca866c00ad5f926e3580720659cc80d39c9d09802a"
};

const adminRoles = new Set(["admin", "dad", "mom"]);
const roleNames = {
  admin: "哥哥",
  dad: "爸爸",
  mom: "妈妈",
  brother: "弟弟"
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
const inventoryList = document.querySelector("#inventoryList");
const inventorySummary = document.querySelector("#inventorySummary");
const poolImageFrame = document.querySelector("#poolImageFrame");
const poolImage = document.querySelector("#poolImage");
const poolImageInput = document.querySelector("#poolImageInput");
const loginScreen = document.querySelector("#loginScreen");
const loginBtn = document.querySelector("#loginBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const passwordInput = document.querySelector("#passwordInput");
const loginError = document.querySelector("#loginError");
const roleLabel = document.querySelector("#roleLabel");
const syncStatus = document.querySelector("#syncStatus");

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
poolImageInput.addEventListener("change", setPoolImage);
document.querySelector("#removePoolImageBtn").addEventListener("click", removePoolImage);
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
    if (!raw) return normalizeState(clone(defaults));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.pools) || parsed.pools.length === 0) return normalizeState(clone(defaults));
    const normalized = normalizeState(parsed);
    localStorage.setItem(storageKey, JSON.stringify(normalized));
    return normalized;
  } catch {
    return normalizeState(clone(defaults));
  }
}

function normalizeState(value) {
  value.drawCredit = Math.floor(Number(value.drawCredit) || 0);
  if (!Array.isArray(value.tasks)) value.tasks = [];
  value.tasks = value.tasks.map(normalizeTask);
  if (!Array.isArray(value.history)) value.history = [];
  if (!value.inventory || typeof value.inventory !== "object") value.inventory = {};
  value.pools.forEach(pool => {
    if (!Array.isArray(pool.items)) pool.items = [];
    if (typeof pool.imageData !== "string") pool.imageData = "";
    if (typeof pool.imageUrl !== "string") pool.imageUrl = "";
    if (!pool.imageData && pool.imageUrl.endsWith("-default.png") && defaultPoolImages[pool.id]) {
      pool.imageUrl = defaultPoolImages[pool.id];
    }
    if (!pool.imageData && !pool.imageUrl && !pool.imageRemoved && defaultPoolImages[pool.id]) {
      pool.imageUrl = defaultPoolImages[pool.id];
    }
    if (!value.inventory[pool.id]) value.inventory[pool.id] = {};
    pool.items.forEach(item => {
      item.stock = Math.max(0, Math.floor(Number(item.stock) || 0));
      item.initialStock = Math.max(item.stock, Math.floor(Number(item.initialStock) || 0));
      item.weight = Math.max(0, Number(item.weight) || 0);
      if (value.inventory[pool.id][item.id] == null) value.inventory[pool.id][item.id] = 0;
    });
  });
  if (!value.inventoryMigrated) {
    migrateInventoryFromHistory(value);
    value.inventoryMigrated = true;
  }
  if (!value.rareWeightsTuned) {
    tuneRareWeights(value);
    value.rareWeightsTuned = true;
  }
  return value;
}

function normalizeTask(task) {
  return {
    id: String(task?.id || uid("task")),
    title: String(task?.title || "未命名任务"),
    reward: taskRewardValue(task),
    done: Boolean(task?.done),
    createdAt: String(task?.createdAt || new Date().toLocaleString("zh-CN", { hour12: false })),
    ...(task?.doneAt ? { doneAt: String(task.doneAt) } : {})
  };
}

function taskRewardValue(task) {
  return Math.max(1, Math.floor(Number(task?.reward) || 1));
}

function migrateInventoryFromHistory(value) {
  value.history.forEach(entry => {
    const pool = value.pools.find(candidate => candidate.name === entry.pool);
    if (!pool) return;
    const item = pool.items.find(candidate => candidate.name === entry.item);
    if (!item) return;
    value.inventory[pool.id][item.id] = Math.max(
      Number(value.inventory[pool.id][item.id]) || 0,
      1
    );
  });
}

function tuneRareWeights(value) {
  const rareWeights = {
    cheng: 0.05,
    chu: 0.05,
    pan: 0.05,
    shi: 0.1,
    ji: 0.05,
    ke: 0.1
  };
  value.pools.forEach(pool => {
    pool.items.forEach(item => {
      if (!Object.hasOwn(rareWeights, item.id)) return;
      if (Number(item.weight) <= Number(item.initialStock || item.stock || 0)) {
        item.weight = rareWeights[item.id];
      }
    });
  });
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  queueCloudSave();
}

function cloudConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
}

function isValidState(value) {
  return Boolean(
    value &&
    Array.isArray(value.pools) &&
    value.pools.length > 0 &&
    value.pools.every(pool => pool && Array.isArray(pool.items))
  );
}

function setSyncStatus(text, mode = "local") {
  syncStatus.textContent = text;
  syncStatus.dataset.mode = mode;
}

async function initCloud() {
  if (!cloudConfigured()) {
    setSyncStatus("本地模式", "local");
    return;
  }
  try {
    cloud = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    setSyncStatus("同步中", "syncing");
    const { data, error } = await cloud
      .from("lottery_state")
      .select("data, updated_at")
      .eq("id", cloudRowId)
      .maybeSingle();
    if (error) throw error;
    lastCloudUpdatedAt = data?.updated_at || "";
    if (isValidState(data?.data)) {
      applyingRemote = true;
      state = normalizeState(data.data);
      localStorage.setItem(storageKey, JSON.stringify(state));
      applyingRemote = false;
      render();
    } else {
      const { data: inserted } = await cloud
        .from("lottery_state")
        .upsert({ id: cloudRowId, data: state, updated_at: new Date().toISOString() })
        .select("updated_at")
        .single();
      lastCloudUpdatedAt = inserted?.updated_at || lastCloudUpdatedAt;
    }
    cloud
      .channel("lottery-state")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lottery_state", filter: `id=eq.${cloudRowId}` },
        payload => {
          if (!payload.new?.data) return;
          lastCloudUpdatedAt = payload.new.updated_at || lastCloudUpdatedAt;
          applyingRemote = true;
          state = normalizeState(payload.new.data);
          localStorage.setItem(storageKey, JSON.stringify(state));
          applyingRemote = false;
          render();
        }
      )
      .subscribe();
    setInterval(fetchCloudState, 3000);
    setSyncStatus("云同步", "online");
  } catch (error) {
    console.error(error);
    setSyncStatus("同步失败", "error");
  }
}

async function fetchCloudState() {
  if (!cloud || applyingRemote) return;
  try {
    const { data, error } = await cloud
      .from("lottery_state")
      .select("data, updated_at")
      .eq("id", cloudRowId)
      .maybeSingle();
    if (error || !data?.updated_at || data.updated_at === lastCloudUpdatedAt || !isValidState(data.data)) return;
    lastCloudUpdatedAt = data.updated_at;
    applyingRemote = true;
    state = normalizeState(data.data);
    localStorage.setItem(storageKey, JSON.stringify(state));
    applyingRemote = false;
    render();
  } catch (error) {
    console.error(error);
  }
}

function queueCloudSave() {
  if (applyingRemote || !cloud) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCloudNow, 350);
}

async function saveCloudNow() {
  if (!cloud) return;
  try {
    setSyncStatus("保存中", "syncing");
    const { data, error } = await cloud
      .from("lottery_state")
      .upsert({
        id: cloudRowId,
        data: state,
        updated_at: new Date().toISOString()
      })
      .select("updated_at")
      .single();
    if (error) throw error;
    lastCloudUpdatedAt = data?.updated_at || lastCloudUpdatedAt;
    setSyncStatus("云同步", "online");
  } catch (error) {
    console.error(error);
    setSyncStatus("同步失败", "error");
  }
}

function isAdmin() {
  return adminRoles.has(sessionRole);
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
  document.body.classList.toggle("role-admin", isAdmin());
  document.body.classList.toggle("role-brother", sessionRole === "brother");
  document.body.classList.toggle("role-parent", sessionRole === "dad" || sessionRole === "mom");
  roleLabel.textContent = isAdmin()
    ? `${roleNames[sessionRole] || "家长"}后台 · 发任务 · 管奖池 · 管次数`
    : "弟弟抽奖台 · 看任务 · 抽奖 · 兑奖";
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function getCurrentPool() {
  return state.pools.find(pool => pool.id === state.currentPoolId) || state.pools[0];
}

function getPoolImage(pool) {
  return pool?.imageData || pool?.imageUrl || "";
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

function getInventory(pool, item) {
  return Math.max(0, Math.floor(Number(state.inventory?.[pool.id]?.[item.id]) || 0));
}

function addInventory(pool, item, amount = 1) {
  if (!state.inventory || typeof state.inventory !== "object") state.inventory = {};
  if (!state.inventory[pool.id]) state.inventory[pool.id] = {};
  state.inventory[pool.id][item.id] = getInventory(pool, item) + amount;
}

function spendInventory(pool, item, amount = 1) {
  if (!state.inventory?.[pool.id]) return;
  state.inventory[pool.id][item.id] = Math.max(0, getInventory(pool, item) - amount);
}

function clearPoolInventory(pool) {
  if (!state.inventory || typeof state.inventory !== "object") state.inventory = {};
  state.inventory[pool.id] = {};
}

function getRequiredItems(pool) {
  return pool.items.filter(item => item?.id && item?.name);
}

function getMissingRequiredItems(pool) {
  return getRequiredItems(pool).filter(item => getInventory(pool, item) <= 0);
}

function addPool() {
  if (!isAdmin()) return;
  const id = uid("pool");
  state.pools.push({
    id,
    name: "新奖池",
    imageData: "",
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

async function setPoolImage(event) {
  if (!isAdmin()) return;
  const file = event.target.files?.[0];
  if (!file) return;
  const poolId = getCurrentPool()?.id;
  if (!file.type.startsWith("image/")) {
    alert("请选择图片文件。");
    event.target.value = "";
    return;
  }
  try {
    const imageData = await readPoolImageData(file);
    const pool = state.pools.find(item => item.id === poolId);
    if (!pool) return;
    pool.imageData = imageData;
    pool.imageUrl = "";
    pool.imageRemoved = false;
    persist();
    render();
  } catch {
    alert("图片读取失败，请换一张图片试试。");
  } finally {
    event.target.value = "";
  }
}

function readPoolImageData(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(
        1,
        maxPoolImageSize / image.naturalWidth,
        maxPoolImageSize / image.naturalHeight
      );
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", poolImageQuality));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    image.src = url;
  });
}

function removePoolImage() {
  if (!isAdmin()) return;
  const pool = getCurrentPool();
  pool.imageData = "";
  pool.imageUrl = "";
  pool.imageRemoved = true;
  persist();
  render();
}

function createTask() {
  if (!isAdmin()) return;
  const title = taskTitleInput.value.trim();
  const reward = Math.max(1, Math.floor(parseDecimal(taskRewardInput.value)));
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
  const reward = taskRewardValue(task);
  task.reward = reward;
  task.done = true;
  task.doneAt = new Date().toLocaleString("zh-CN", { hour12: false });
  state.drawCredit = (Number(state.drawCredit) || 0) + reward;
  state.history.unshift({
    pool: "任务奖励",
    item: `+${reward} 次`,
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false })
  });
  persist();
  render();
}

function reopenTask(id) {
  if (!isAdmin()) return;
  const task = state.tasks.find(item => item.id === id);
  if (!task || !task.done) return;
  const reward = taskRewardValue(task);
  task.reward = reward;
  task.done = false;
  delete task.doneAt;
  state.drawCredit = (Number(state.drawCredit) || 0) - reward;
  state.history.unshift({
    pool: "撤销任务",
    item: `-${reward} 次`,
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false })
  });
  persist();
  render();
}

function updateTask(id, key, value) {
  if (!isAdmin()) return;
  const task = state.tasks.find(item => item.id === id);
  if (!task) return;
  if (key === "title") {
    task.title = value.trim() || "未命名任务";
  }
  if (key === "reward") {
    const oldReward = taskRewardValue(task);
    const newReward = Math.max(1, Math.floor(parseDecimal(value)));
    task.reward = newReward;
    if (task.done) {
      state.drawCredit = (Number(state.drawCredit) || 0) + newReward - oldReward;
    }
  }
  persist();
  render();
}

function adjustTaskReward(id, delta) {
  if (!isAdmin()) return;
  const task = state.tasks.find(item => item.id === id);
  if (!task) return;
  updateTask(id, "reward", (taskRewardValue(task) + delta).toString());
}

function deleteTask(id) {
  if (!isAdmin()) return;
  const task = state.tasks.find(item => item.id === id);
  if (!task) return;
  state.tasks = state.tasks.filter(item => item.id !== id);
  persist();
  render();
}

function changeCredit(delta) {
  if (!isAdmin()) return;
  state.drawCredit = (Number(state.drawCredit) || 0) + delta;
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
    const number = key === "weight"
      ? Math.max(0, parseDecimal(value))
      : Math.max(0, Math.floor(parseDecimal(value)));
    item[key] = number;
    if (key === "stock") item.initialStock = number;
    if (key === "initialStock" && item.stock > number) item.stock = number;
  }
  persist();
  render();
}

function parseDecimal(value) {
  const normalized = String(value)
    .trim()
    .replaceAll("，", ".")
    .replaceAll(",", ".")
    .replaceAll("。", ".");
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : 0;
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
    addInventory(pool, result, 1);
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
  if (!isAdmin()) return;
  if (!confirm("清空全部抽奖记录？")) return;
  state.history = [];
  persist();
  render();
}

function resetAll() {
  if (!isAdmin()) return;
  if (!confirm("恢复默认会覆盖当前所有奖池配置，确定？")) return;
  state = normalizeState(clone(defaults));
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
      state = normalizeState(data);
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
  const required = getRequiredItems(pool);
  const missing = getMissingRequiredItems(pool).map(item => item.name);
  if (missing.length) {
    drawResult.textContent = `还缺 ${missing.join(" ")}`;
    ticketWindow.classList.remove("spin");
    requestAnimationFrame(() => ticketWindow.classList.add("spin"));
    return;
  }
  clearPoolInventory(pool);
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
    const thumb = node.querySelector(".pool-thumb");
    const poolImageSource = getPoolImage(pool);
    node.classList.toggle("active", pool.id === getCurrentPool().id);
    node.classList.toggle("has-image", Boolean(poolImageSource));
    thumb.textContent = poolImageSource ? "" : pool.name.slice(0, 1);
    thumb.style.backgroundImage = poolImageSource ? `url("${poolImageSource}")` : "";
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
  const poolImageSource = getPoolImage(pool);
  state.currentPoolId = pool.id;
  poolNameInput.value = pool.name;
  poolImageFrame.classList.toggle("has-image", Boolean(poolImageSource));
  poolImage.src = poolImageSource;
  poolImage.alt = poolImageSource ? `${pool.name}奖池图片` : "当前奖池图片";
  remainingCount.textContent = getRemaining(pool);
  totalWeight.textContent = getWeightSum(pool);
  activeItemCount.textContent = getActiveItems(pool).length;
  drawCredit.textContent = Number(state.drawCredit) || 0;
  drawCredit.closest(".draw-credit").classList.toggle("negative", (Number(state.drawCredit) || 0) < 0);

  itemRows.innerHTML = "";
  pool.items.forEach(item => {
    const chance = probability(pool, item);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input aria-label="条目名称" value="${escapeHtml(item.name)}"></td>
      <td><input class="number-input" aria-label="库存" type="number" min="0" value="${item.stock}"></td>
      <td><input class="number-input" aria-label="权重" type="text" inputmode="decimal" value="${item.weight}"></td>
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

function renderInventory() {
  const pool = getCurrentPool();
  const required = getRequiredItems(pool);
  const missing = getMissingRequiredItems(pool);
  const ownedCount = required.reduce((sum, item) => sum + Math.min(1, getInventory(pool, item)), 0);

  inventorySummary.textContent = missing.length
    ? `还缺 ${missing.length} 个字`
    : "已集齐，可以兑奖";
  inventorySummary.classList.toggle("complete", missing.length === 0 && required.length > 0);

  inventoryList.innerHTML = "";
  if (!required.length) {
    inventoryList.innerHTML = `<div class="empty">这个奖池还没有可兑奖的字。</div>`;
    return;
  }

  required.forEach(item => {
    const count = getInventory(pool, item);
    const chip = document.createElement("div");
    chip.className = `inventory-chip${count > 0 ? " owned" : " missing"}`;
    chip.innerHTML = `
      <strong>${escapeHtml(item.name)}</strong>
      <span>${count > 0 ? `有 ${count} 张` : "缺 1 张"}</span>
    `;
    inventoryList.appendChild(chip);
  });

  inventoryList.setAttribute("aria-label", `${pool.name} 字库存，已集齐 ${ownedCount} / ${required.length}`);
}

function renderTasks() {
  taskList.innerHTML = "";
  if (!state.tasks.length) {
    taskList.innerHTML = `<div class="empty">还没有任务。你可以发布一个任务，完成后发放抽奖次数。</div>`;
    return;
  }
  state.tasks.forEach(task => {
    const row = document.createElement("div");
    row.className = `task-item${task.done ? " done" : ""}${isAdmin() ? " task-admin" : ""}`;
    const status = task.done ? `已完成 · ${task.doneAt || ""}` : `发布于 ${task.createdAt || ""}`;
    if (isAdmin()) {
      row.innerHTML = `
        <div class="task-main task-edit">
          <input class="task-title-edit" aria-label="任务内容" value="${escapeHtml(task.title)}">
          <span>${escapeHtml(status)}</span>
        </div>
        <div class="task-reward-edit" aria-label="奖励抽奖次数">
          <button class="small ghost task-minus" type="button">-</button>
          <input class="number-input" aria-label="奖励抽奖次数" type="number" min="1" value="${Number(task.reward) || 1}">
          <button class="small ghost task-plus" type="button">+</button>
        </div>
        <button class="${task.done ? "ghost" : "primary"} small" type="button">${task.done ? "撤销" : "完成发奖"}</button>
        <button class="danger small" type="button">删除</button>
      `;
      const titleInput = row.querySelector(".task-title-edit");
      const rewardInput = row.querySelector(".task-reward-edit input");
      const minusBtn = row.querySelector(".task-minus");
      const plusBtn = row.querySelector(".task-plus");
      const [toggleBtn, deleteBtn] = [...row.querySelectorAll(":scope > button")];
      titleInput.addEventListener("change", event => updateTask(task.id, "title", event.target.value));
      titleInput.addEventListener("keydown", event => {
        if (event.key === "Enter") event.target.blur();
      });
      rewardInput.addEventListener("change", event => updateTask(task.id, "reward", event.target.value));
      minusBtn.addEventListener("click", () => adjustTaskReward(task.id, -1));
      plusBtn.addEventListener("click", () => adjustTaskReward(task.id, 1));
      toggleBtn.addEventListener("click", () => task.done ? reopenTask(task.id) : completeTask(task.id));
      deleteBtn.addEventListener("click", () => deleteTask(task.id));
    } else {
      row.innerHTML = `
        <div class="task-main">
          <strong>${escapeHtml(task.title)}</strong>
          <span>${escapeHtml(status)}</span>
        </div>
        <span class="task-badge">+${Number(task.reward) || 0} 次</span>
      `;
    }
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
  renderInventory();
  renderTasks();
  renderHistory();
}

render();
initCloud();
