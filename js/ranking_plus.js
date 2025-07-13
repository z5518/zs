import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  "https://tgybhckhjbmeafruvokc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRneWJoY2toamJtZWFmcnV2b2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODc5ODQsImV4cCI6MjA2NjM2Mzk4NH0.OWNrddp4hhZRSaCpH4NGRtoRB54hUcWDbfMEhi9Adfg"
);

const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) window.location.href = "index.html";
const userId = user.id;

let data = [];
let totalPage = 1, totalCurrent = 1;
let dailyPage = 1, dailyTotalPage = 1;
const pageSize = 10;

function format(d) {
  const date = new Date(d);
  return date.toISOString().split('T')[0];
}

async function loadData() {
  const { data: rows, error } = await supabase
    .from('invites')
    .select('*')
    .eq('user_id', userId);

  if (error) return alert("加载数据失败：" + error.message);
  data = rows;
  renderEventTotalTable();
  renderDailyRankingTable();
}

// 仅在今日第一名唯一时返回 [name]，否则返回 null
function getTodayTopInviter() {
  const today = format(new Date());
  const map = {};
  data.forEach(d => {
    const date = format(new Date(d.date));
    if (date === today) {
      map[d.inviter] = (map[d.inviter] || 0) + 1;
    }
  });

  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;

  const topCount = sorted[0][1];
  const topInviters = sorted.filter(([_, count]) => count === topCount).map(([name]) => name);

  return topInviters.length === 1 ? topInviters : null;
}

// 返回今日所有并列第一的名单和数量
function getTodayTopInvitersAll() {
  const today = format(new Date());
  const map = {};
  data.forEach(d => {
    const date = format(new Date(d.date));
    if (date === today) {
      map[d.inviter] = (map[d.inviter] || 0) + 1;
    }
  });

  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return [];

  const topCount = sorted[0][1];
  return sorted.filter(([_, count]) => count === topCount).map(([name]) => name);
}

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

  // ➕ 仅唯一第一名才 +2 分
  const todayTop = getTodayTopInviter();
  if (todayTop) {
    todayTop.forEach(inviter => {
      map[inviter] = (map[inviter] || 0) + 2;
    });
  }

  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  totalPage = Math.ceil(sorted.length / pageSize);
  const pageData = sorted.slice((totalCurrent - 1) * pageSize, totalCurrent * pageSize);

  const tbody = document.querySelector('#eventTotalTable tbody');
  tbody.innerHTML = '';
  const rewards = ['Group admin position + Android phone', 'Android phone', 'Power bank + K500', 'K500', 'K300'];

  let lastCount = null;
  let lastRank = 0;
  let realRank = (totalCurrent - 1) * pageSize + 1;

  pageData.forEach(([inviter, count]) => {
    if (count === lastCount) {
      // 同名次
    } else {
      lastRank = realRank;
    }
    const reward = rewards[lastRank - 1] || '';
    tbody.innerHTML += `<tr><td>${lastRank}</td><td>${inviter}</td><td>${count}</td><td>${reward}</td></tr>`;
    lastCount = count;
    realRank++;
  });

  renderPagination("eventTotalPagination", totalPage, totalCurrent, goToTotalPage);
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
  dailyTotalPage = Math.ceil(sorted.length / pageSize);
  const pageData = sorted.slice((dailyPage - 1) * pageSize, dailyPage * pageSize);

  const topCount = sorted.length > 0 ? sorted[0][1] : 0;
  const topPeople = getTodayTopInvitersAll(); // 所有并列第一
  const perPersonReward = topPeople.length > 0 ? (50 / topPeople.length).toFixed(2) : '0';

  const tbody = document.querySelector('#dailyRankingTable tbody');
  tbody.innerHTML = '';

  let lastCount = null;
  let lastRank = 0;
  let realRank = (dailyPage - 1) * pageSize + 1;

  pageData.forEach(([inviter, count]) => {
    if (count === lastCount) {
      // 同名次
    } else {
      lastRank = realRank;
    }

    let reward = '';
    if (count === topCount && topPeople.includes(inviter)) {
      reward = `K${perPersonReward}`;
    }

    tbody.innerHTML += `<tr><td>${lastRank}</td><td>${inviter}</td><td>${count}</td><td>${reward}</td></tr>`;
    lastCount = count;
    realRank++;
  });

  const title = document.getElementById("dailyTitle");
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formatted = new Date().toLocaleDateString('en-US', options);
  title.innerText = `📅 Daily Ranking: ${formatted}`;

  renderPagination("dailyPagination", dailyTotalPage, dailyPage, goToDailyPage);
}

function renderPagination(containerId, total, current, goToFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (total <= 1) return container.innerHTML = '';

  let buttons = '';

  buttons += `<button class="btn" onclick="${goToFn.name}(1)">首页</button>`;
  if (current > 1) {
    buttons += `<button class="btn" onclick="${goToFn.name}(${current - 1})">上一页</button>`;
  }

  const maxButtons = 5;
  let start = Math.max(1, current - Math.floor(maxButtons / 2));
  let end = Math.min(total, start + maxButtons - 1);
  if (end - start < maxButtons - 1) {
    start = Math.max(1, end - maxButtons + 1);
  }

  if (start > 1) {
    buttons += `<button class="btn" onclick="${goToFn.name}(1)">1</button>`;
    if (start > 2) buttons += `<span class="pagination-ellipsis">...</span>`;
  }

  for (let i = start; i <= end; i++) {
    buttons += `<button class="btn ${i === current ? 'active' : ''}" onclick="${goToFn.name}(${i})">${i}</button>`;
  }

  if (end < total) {
    if (end < total - 1) buttons += `<span class="pagination-ellipsis">...</span>`;
    buttons += `<button class="btn" onclick="${goToFn.name}(${total})">${total}</button>`;
  }

  if (current < total) {
    buttons += `<button class="btn" onclick="${goToFn.name}(${current + 1})">下一页</button>`;
  }

  buttons += `<button class="btn" onclick="${goToFn.name}(${total})">末页</button>`;

  container.innerHTML = buttons;
}

function goToTotalPage(p) {
  totalCurrent = p;
  renderEventTotalTable();
}

function goToDailyPage(p) {
  dailyPage = p;
  renderDailyRankingTable();
}

loadData();
window.goToTotalPage = goToTotalPage;
window.goToDailyPage = goToDailyPage;
