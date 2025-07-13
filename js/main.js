import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  "https://tgybhckhjbmeafruvokc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRneWJoY2toamJtZWFmcnV2b2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODc5ODQsImV4cCI6MjA2NjM2Mzk4NH0.OWNrddp4hhZRSaCpH4NGRtoRB54hUcWDbfMEhi9Adfg"
);

const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) window.location.href = "index.html";
const userId = user.id;

let data = [];
let currentPage = 1, statsPage = 1;
const fullPageSize = 10, statsPageSize = 5;
let currentStats = [];

let customRange = null;
let detailDateRange = null;

function format(d) {
  const date = new Date(d);
  return date.toISOString().split('T')[0];
}

function getWeekRange(d) {
  const date = new Date(d);
  const day = date.getDay() || 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return [format(monday), format(sunday)];
}

function setDefaultWeekLabel() {
  const [start, end] = getWeekRange(new Date());
  const weekLabel = `${start} ~ ${end}`;
  const select = document.getElementById('weekSelect');
  select.options[0].text = weekLabel;
}

async function loadData() {
  const { data: rows, error } = await supabase
    .from('invites')
    .select('*')
    .eq('user_id', userId)
.order('date', { ascending: false })
.order('inviter', { ascending: true });

  if (error) return alert("加载数据失败：" + error.message);
  data = rows;
  renderStatsTable();
  renderFullTable();
  setDefaultWeekLabel();
  renderEventTotalTable();
  renderDailyRankingTable();
}

function onWeekSelectChange() {
  const value = document.getElementById('weekSelect').value;
  if (value === 'custom') {
    openStatsDateRangeDialog();
  }
}

function onViewModeChange() {
  const mode = document.getElementById('viewMode').value;

  // 切换 viewMode 时自动清除日期范围选择
  detailDateRange = null;
  document.getElementById('detailDateRangeBtn').innerText = '选择日期范围';

  renderFullTable();
}


function openStatsDateRangeDialog() {
  document.getElementById('dateRangeModal').style.display = 'flex';
  const today = format(new Date());
  document.getElementById('customStartDate').value = today;
  document.getElementById('customEndDate').value = today;
  document.getElementById('dateRangeButtons').innerHTML = `


    <button class="btn" onclick="resetToThisWeek()">查看本周数据</button>
    <button class="btn" onclick="closeDateRangeDialog()">取消</button>
    <button class="btn" onclick="applyCustomRange()">确认</button>
  `;
}

function openDetailDateRangeDialog() {
  document.getElementById('dateRangeModal').style.display = 'flex';
  const today = format(new Date());
  document.getElementById('customStartDate').value = today;
  document.getElementById('customEndDate').value = today;
  document.getElementById('dateRangeButtons').innerHTML = `
    <button class="btn" onclick="cancelDetailDateRange()">取消</button>
    <button class="btn" onclick="applyDetailDateRange()">确认</button>

  `;
}

function closeDateRangeDialog() {
  document.getElementById('dateRangeModal').style.display = 'none';
  const [start, end] = customRange || getWeekRange(new Date());
  document.getElementById('weekSelect').options[0].text = `${format(start)} ~ ${format(end)}`;
  document.getElementById('weekSelect').selectedIndex = 0;
}

function resetToThisWeek() {
  customRange = null;
  setDefaultWeekLabel();
  renderEventTotalTable();
  renderDailyRankingTable();
  closeDateRangeDialog();
  renderStatsTable();
}

function applyCustomRange() {
  const start = document.getElementById('customStartDate').value;
  const end = document.getElementById('customEndDate').value;
  if (!start || !end || new Date(start) > new Date(end)) {
    alert('请选择有效的日期范围');
    return;
  }
  customRange = [new Date(start), new Date(end)];
  document.getElementById('dateRangeModal').style.display = 'none';
  const select = document.getElementById('weekSelect');
  select.options[0].text = `${start} ~ ${end}`;
  select.selectedIndex = 0;
  renderStatsTable();
}

function applyDetailDateRange() {
  const start = document.getElementById('customStartDate').value;
  const end = document.getElementById('customEndDate').value;
  if (!start || !end || new Date(start) > new Date(end)) {
    alert('请选择有效的日期范围');
    return;
  }
  detailDateRange = [new Date(start), new Date(end)];
  document.getElementById('dateRangeModal').style.display = 'none';
  document.getElementById('detailDateRangeBtn').innerText = `${start} ~ ${end}`;
  renderFullTable();
}


function cancelDetailDateRange() {
  document.getElementById('dateRangeModal').style.display = 'none';
  detailDateRange = null;
  document.getElementById('detailDateRangeBtn').innerText = '选择日期范围';
  renderFullTable();
}


function renderStatsTable() {
  let start, end;
  if (customRange) {
    [start, end] = customRange;
  } else {
    [start, end] = getWeekRange(new Date());
    start = new Date(start);
    end = new Date(end);
  }

  const map = {};
  data.forEach(d => {
    const date = new Date(d.date);
    if (date >= start && date <= end) {
      map[d.inviter] = (map[d.inviter] || 0) + 1;
    }
  });

  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  currentStats = sorted;
  const totalPages = Math.ceil(sorted.length / statsPageSize);
  statsPage = Math.min(statsPage, totalPages || 1);
  const pageData = sorted.slice((statsPage - 1) * statsPageSize, statsPage * statsPageSize);

  const tbody = document.querySelector('#statsTable tbody');
  tbody.innerHTML = '';
  pageData.forEach(([inviter, count]) => {
    const reward = count >= 10 ? 'K400' : count >= 5 ? 'K200' : '暂无奖励';
    tbody.innerHTML += `<tr><td>${inviter}</td><td>${count}</td><td>${reward}</td></tr>`;
  });
  for (let i = pageData.length; i < statsPageSize; i++) {
    tbody.innerHTML += `<tr><td>&nbsp;</td><td></td><td></td></tr>`;
  }

  renderStatsPagination(totalPages);
}

function renderStatsPagination(totalPages) {
  let container = document.getElementById('statsPagination');
  if (!container) {
    container = document.createElement('div');
    container.id = 'statsPagination';
    container.style.marginTop = '10px';
    container.style.textAlign = 'center';
    document.querySelector('#statsTable').after(container);
  }
  if (totalPages <= 1) return container.innerHTML = '';

  let buttons = '';
  const maxButtons = 5;
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, statsPage - half);
  let end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start < maxButtons - 1) {
    start = Math.max(1, end - maxButtons + 1);
  }

  buttons += `<button class="btn" onclick="goToStatsPage(1)">首页</button>`;
  if (statsPage > 1) {
    buttons += `<button class="btn" onclick="goToStatsPage(${statsPage - 1})">上一页</button>`;
  }

  if (start > 1) {
    buttons += `<button class="btn" onclick="goToStatsPage(1)">1</button>`;
    if (start > 2) buttons += `<span>...</span>`;
  }

  for (let i = start; i <= end; i++) {
buttons += `<button class="btn ${i === statsPage ? 'active' : ''}" onclick="goToStatsPage(${i})">${i}</button>`;
  }

  if (end < totalPages) {
    if (end < totalPages - 1) buttons += `<span>...</span>`;
    buttons += `<button class="btn" onclick="goToStatsPage(${totalPages})">${totalPages}</button>`;
  }

  if (statsPage < totalPages) {
    buttons += `<button class="btn" onclick="goToStatsPage(${statsPage + 1})">下一页</button>`;
  }
  buttons += `<button class="btn" onclick="goToStatsPage(${totalPages})">末页</button>`;

  container.innerHTML = buttons;
}

function renderFullTable() {
const mode = document.getElementById('viewMode').value;
const view = mode;
  const filterInviter = document.getElementById('filterInviter').value.trim();
  const [weekStart, weekEnd] = getWeekRange(new Date());

let filtered = data.filter(d => {
  const date = new Date(d.date);
  const matchMode =
    view === 'all' ||
    (view === 'week' && date >= new Date(weekStart) && date <= new Date(weekEnd));

  const matchRange =
    !detailDateRange || (date >= detailDateRange[0] && date <= detailDateRange[1]);

  return matchMode && matchRange &&
         (!filterInviter || d.inviter.includes(filterInviter));
});


  const totalPages = Math.ceil(filtered.length / fullPageSize);
  currentPage = Math.min(currentPage, totalPages || 1);
  const pageData = filtered.slice((currentPage - 1) * fullPageSize, currentPage * fullPageSize);

  const tbody = document.querySelector('#fullTable tbody');
  tbody.innerHTML = '';
  pageData.forEach(d => {
    const i = data.findIndex(row => row.id === d.id);
    tbody.innerHTML += `<tr>
      <td>${d.date}</td>
      <td>${d.inviter}</td>
      <td>${d.member}</td>
      <td><button class="btn" onclick="deleteData(${i})">删除</button></td>
    </tr>`;
  });
  for (let i = pageData.length; i < fullPageSize; i++) {
    tbody.innerHTML += `<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>`;
  }

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  let container = document.getElementById('pagination');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pagination';
    container.style.marginTop = '10px';
    container.style.textAlign = 'center';
    document.querySelector('#fullTable').after(container);
  }
  if (totalPages <= 1) return container.innerHTML = '';

  let buttons = '';
  const maxButtons = 3;
  const half = Math.floor(maxButtons / 2);
  let start = Math.max(1, currentPage - half);
  let end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start < maxButtons - 1) {
    start = Math.max(1, end - maxButtons + 1);
  }

  buttons += `<button class="btn" onclick="goToPage(1)">首页</button>`;
  if (currentPage > 1) {
    buttons += `<button class="btn" onclick="goToPage(${currentPage - 1})">上一页</button>`;
  }

  if (start > 1) {
    buttons += `<button class="btn" onclick="goToPage(1)">1</button>`;
    if (start > 2) buttons += `<span>...</span>`;
  }

  for (let i = start; i <= end; i++) {
buttons += `<button class="btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (end < totalPages) {
    if (end < totalPages - 1) buttons += `<span>...</span>`;
    buttons += `<button class="btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  if (currentPage < totalPages) {
    buttons += `<button class="btn" onclick="goToPage(${currentPage + 1})">下一页</button>`;
  }
  buttons += `<button class="btn" onclick="goToPage(${totalPages})">末页</button>`;

  container.innerHTML = buttons;
}

async function deleteData(index) {
  const row = data[index];
  if (!confirm("确认删除？")) return;
  const { error } = await supabase.from('invites').delete().eq('id', row.id);
  if (error) return alert("删除失败：" + error.message);
  
function renderEventTotalTable() {
  const start = new Date("2024-07-14");
  const end = new Date("2024-07-27");
  const map = {};

  data.forEach(d => {
    const date = new Date(d.date);
    if (date >= start && date <= end) {
      map[d.inviter] = (map[d.inviter] || 0) + 1;
    }
  });

  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const tbody = document.querySelector('#eventTotalTable tbody');
  tbody.innerHTML = '';

  const rewards = [
    'Group admin position + Android phone',
    'Android phone',
    'Power bank + K500',
    'K500',
    'K300'
  ];

  sorted.slice(0, 10).forEach(([inviter, count], index) => {
    const reward = rewards[index] || '';
    tbody.innerHTML += `<tr><td>${index + 1}</td><td>${inviter}</td><td>${count}</td><td>${reward}</td></tr>`;
  });

  for (let i = sorted.length; i < 10; i++) {
    tbody.innerHTML += `<tr><td>${i + 1}</td><td></td><td></td><td></td></tr>`;
  }
}

function renderDailyRankingTable() {
  const today = format(new Date());
  const map = {};

  data.forEach(d => {
    const date = format(new Date(d.date));
    if (date === today) {
      map[d.inviter] = (map[d.inviter] || 0) + 1;
    }
  });

  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const tbody = document.querySelector('#dailyRankingTable tbody');
  tbody.innerHTML = '';

  const topCount = sorted.length > 0 ? sorted[0][1] : 0;

  sorted.slice(0, 10).forEach(([inviter, count], index) => {
    const reward = count === topCount && index === 0 ? 'K50' : '';
    tbody.innerHTML += `<tr><td>${index + 1}</td><td>${inviter}</td><td>${count}</td><td>${reward}</td></tr>`;
  });

  for (let i = sorted.length; i < 10; i++) {
    tbody.innerHTML += `<tr><td>${i + 1}</td><td></td><td></td><td></td></tr>`;
  }

  const title = document.getElementById("dailyTitle");
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formatted = new Date().toLocaleDateString('en-US', options);
  title.innerText = `📅 Daily Ranking: ${formatted}`;
}


loadData();
}

function openAddDialog() {
  document.getElementById('addModal').style.display = 'flex';
  document.getElementById('newDate').value = format(new Date());
}

function closeAddDialog() {
  document.getElementById('addModal').style.display = 'none';
}

async function addData() {
  const date = document.getElementById('newDate').value;
  const inviter = document.getElementById('newInviter').value.trim();
  const member = document.getElementById('newMember').value.trim();
  if (!date || !inviter || !member) return alert("请填写完整信息");
  const { error } = await supabase.from('invites').insert([{ user_id: userId, date, inviter, member }]);
  if (error) return alert("添加失败：" + error.message);
  closeAddDialog();
  
function renderEventTotalTable() {
  const start = new Date("2024-07-14");
  const end = new Date("2024-07-27");
  const map = {};

  data.forEach(d => {
    const date = new Date(d.date);
    if (date >= start && date <= end) {
      map[d.inviter] = (map[d.inviter] || 0) + 1;
    }
  });

  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const tbody = document.querySelector('#eventTotalTable tbody');
  tbody.innerHTML = '';

  const rewards = [
    'Group admin position + Android phone',
    'Android phone',
    'Power bank + K500',
    'K500',
    'K300'
  ];

  sorted.slice(0, 10).forEach(([inviter, count], index) => {
    const reward = rewards[index] || '';
    tbody.innerHTML += `<tr><td>${index + 1}</td><td>${inviter}</td><td>${count}</td><td>${reward}</td></tr>`;
  });

  for (let i = sorted.length; i < 10; i++) {
    tbody.innerHTML += `<tr><td>${i + 1}</td><td></td><td></td><td></td></tr>`;
  }
}

function renderDailyRankingTable() {
  const today = format(new Date());
  const map = {};

  data.forEach(d => {
    const date = format(new Date(d.date));
    if (date === today) {
      map[d.inviter] = (map[d.inviter] || 0) + 1;
    }
  });

  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const tbody = document.querySelector('#dailyRankingTable tbody');
  tbody.innerHTML = '';

  const topCount = sorted.length > 0 ? sorted[0][1] : 0;

  sorted.slice(0, 10).forEach(([inviter, count], index) => {
    const reward = count === topCount && index === 0 ? 'K50' : '';
    tbody.innerHTML += `<tr><td>${index + 1}</td><td>${inviter}</td><td>${count}</td><td>${reward}</td></tr>`;
  });

  for (let i = sorted.length; i < 10; i++) {
    tbody.innerHTML += `<tr><td>${i + 1}</td><td></td><td></td><td></td></tr>`;
  }

  const title = document.getElementById("dailyTitle");
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formatted = new Date().toLocaleDateString('en-US', options);
  title.innerText = `📅 Daily Ranking: ${formatted}`;
}


loadData();
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

function goToPage(p) {
  currentPage = p;
  renderFullTable();
}

function goToStatsPage(p) {
  statsPage = p;
  renderStatsTable();
}

// 暴露函数给 HTML
window.logout = logout;
window.renderStatsTable = renderStatsTable;
window.renderFullTable = renderFullTable;
window.addData = addData;
window.deleteData = deleteData;
window.openAddDialog = openAddDialog;
window.closeAddDialog = closeAddDialog;
window.goToPage = goToPage;
window.goToStatsPage = goToStatsPage;
window.onWeekSelectChange = onWeekSelectChange;
window.applyCustomRange = applyCustomRange;
window.closeDateRangeDialog = closeDateRangeDialog;
window.resetToThisWeek = resetToThisWeek;
window.onViewModeChange = onViewModeChange;
window.applyDetailDateRange = applyDetailDateRange;
window.cancelDetailDateRange = cancelDetailDateRange;
window.openDetailDateRangeDialog = openDetailDateRangeDialog;


function renderEventTotalTable() {
  const start = new Date("2024-07-14");
  const end = new Date("2024-07-27");
  const map = {};

  data.forEach(d => {
    const date = new Date(d.date);
    if (date >= start && date <= end) {
      map[d.inviter] = (map[d.inviter] || 0) + 1;
    }
  });

  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const tbody = document.querySelector('#eventTotalTable tbody');
  tbody.innerHTML = '';

  const rewards = [
    'Group admin position + Android phone',
    'Android phone',
    'Power bank + K500',
    'K500',
    'K300'
  ];

  sorted.slice(0, 10).forEach(([inviter, count], index) => {
    const reward = rewards[index] || '';
    tbody.innerHTML += `<tr><td>${index + 1}</td><td>${inviter}</td><td>${count}</td><td>${reward}</td></tr>`;
  });

  for (let i = sorted.length; i < 10; i++) {
    tbody.innerHTML += `<tr><td>${i + 1}</td><td></td><td></td><td></td></tr>`;
  }
}

function renderDailyRankingTable() {
  const today = format(new Date());
  const map = {};

  data.forEach(d => {
    const date = format(new Date(d.date));
    if (date === today) {
      map[d.inviter] = (map[d.inviter] || 0) + 1;
    }
  });

  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const tbody = document.querySelector('#dailyRankingTable tbody');
  tbody.innerHTML = '';

  const topCount = sorted.length > 0 ? sorted[0][1] : 0;

  sorted.slice(0, 10).forEach(([inviter, count], index) => {
    const reward = count === topCount && index === 0 ? 'K50' : '';
    tbody.innerHTML += `<tr><td>${index + 1}</td><td>${inviter}</td><td>${count}</td><td>${reward}</td></tr>`;
  });

  for (let i = sorted.length; i < 10; i++) {
    tbody.innerHTML += `<tr><td>${i + 1}</td><td></td><td></td><td></td></tr>`;
  }

  const title = document.getElementById("dailyTitle");
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formatted = new Date().toLocaleDateString('en-US', options);
  title.innerText = `📅 Daily Ranking: ${formatted}`;
}


loadData();
