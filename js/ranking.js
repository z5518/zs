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

function renderEventTotalTable() {
    const start = new Date("2025-07-14");
    const end = new Date("2025-07-27");
    const map = {};

    data.forEach(d => {
        const date = new Date(d.date);
        if (date >= start && date <= end) {
            map[d.inviter] = (map[d.inviter] || 0) + 1;
        }
    });

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const rewards = ['Group admin position + Android phone', 'Android phone', 'Power bank + K500', 'K500', 'K300'];

    // ✅ 修正后的排名逻辑（连续编号）
    let rankedList = [];
    let rank = 1;
    let prevCount = null;

    for (let i = 0; i < sorted.length; i++) {
        const [inviter, count] = sorted[i];
        if (i > 0 && count !== prevCount) {
            rank++;
        }
        rankedList.push({ rank, inviter, count });
        prevCount = count;
    }

    totalPage = Math.ceil(rankedList.length / pageSize);
    const pageData = rankedList.slice((totalCurrent - 1) * pageSize, totalCurrent * pageSize);

    const tbody = document.querySelector('#eventTotalTable tbody');
    tbody.innerHTML = '';

    for (let i = 0; i < pageData.length; i++) {
        const row = pageData[i];
        const sameGroup = pageData.filter(r => r.count === row.count && r.rank === row.rank);
        const isFirst = pageData.findIndex(r => r.count === row.count && r.rank === row.rank) === i;
        const reward = rewards[row.rank - 1] || '';
        const rewardCell = isFirst ? `<td rowspan="${sameGroup.length}">${reward}</td>` : '';

        tbody.innerHTML += `<tr>
            <td>${row.rank}</td>
            <td>${row.inviter}</td>
            <td>${row.count}</td>
            ${rewardCell}
        </tr>`;
    }

    for (let i = pageData.length; i < pageSize; i++) {
        tbody.innerHTML += `<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`;
    }

    renderPagination("eventTotalPagination", totalPage, totalCurrent, goToTotalPage);
}

function renderDailyRankingTable() {
    const today = format(new Date());
    const map = {};

  data.forEach(d => {
    const date = format(new Date(d.date));
    if (date === today && d.member !== '增加积分') {
      map[d.inviter] = (map[d.inviter] || 0) + 1;
    }
  });


    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);

    // ✅ 修正后的排名逻辑（连续编号）
    let rankedList = [];
    let rank = 1;
    let prevCount = null;

    for (let i = 0; i < sorted.length; i++) {
        const [inviter, count] = sorted[i];
        if (i > 0 && count !== prevCount) {
            rank++;
        }
        rankedList.push({ rank, inviter, count });
        prevCount = count;
    }

    dailyTotalPage = Math.ceil(rankedList.length / pageSize);
    const pageData = rankedList.slice((dailyPage - 1) * pageSize, dailyPage * pageSize);

    const tbody = document.querySelector('#dailyRankingTable tbody');
    tbody.innerHTML = '';
    const topCount = sorted.length > 0 ? sorted[0][1] : 0;

    for (let i = 0; i < pageData.length; i++) {
        const row = pageData[i];
        const sameGroup = pageData.filter(r => r.count === row.count && r.rank === row.rank);
        const isFirst = pageData.findIndex(r => r.count === row.count && r.rank === row.rank) === i;
        const reward = row.count === topCount && row.rank === 1 ? 'K50' : '';
        const rewardCell = isFirst ? `<td rowspan="${sameGroup.length}">${reward}</td>` : '';

        tbody.innerHTML += `<tr>
            <td>${row.rank}</td>
            <td>${row.inviter}</td>
            <td>${row.count}</td>
            ${rewardCell}
        </tr>`;
    }

    for (let i = pageData.length; i < pageSize; i++) {
        tbody.innerHTML += `<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`;
    }

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
    const maxButtons = 3;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + maxButtons - 1);
    if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

    buttons += `<button class="btn" onclick="${goToFn.name}(1)">首页</button>`;
    if (current > 1) buttons += `<button class="btn" onclick="${goToFn.name}(${current - 1})">上一页</button>`;
    for (let i = start; i <= end; i++) {
        buttons += `<button class="btn ${i === current ? 'active' : ''}" onclick="${goToFn.name}(${i})">${i}</button>`;
    }
    if (current < total) buttons += `<button class="btn" onclick="${goToFn.name}(${current + 1})">下一页</button>`;
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

// 暴露全局方法
window.goToTotalPage = goToTotalPage;
window.goToDailyPage = goToDailyPage;

loadData();
