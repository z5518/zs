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
let showAllTotal = false;
let showAllDaily = false;

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
    const rewards = ['Group Admin + Android Phone', 'Android phone', 'Power bank + K500', 'K500', 'K300'];

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

    const existingRanks = [...new Set(rankedList.map(r => r.rank))];
    for (let r = 1; r <= 5; r++) {
        if (!existingRanks.includes(r)) {
            rankedList.push({ rank: r, inviter: "-", count: 0 });
        }
    }

    rankedList.sort((a, b) => a.rank - b.rank);

    totalPage = showAllTotal ? 1 : Math.ceil(rankedList.length / pageSize);
    const pageData = showAllTotal ? rankedList : rankedList.slice((totalCurrent - 1) * pageSize, totalCurrent * pageSize);

    const tbody = document.querySelector('#eventTotalTable tbody');
    tbody.innerHTML = '';

    for (let i = 0; i < pageData.length; i++) {
        const row = pageData[i];
        const sameGroup = pageData.filter(r => r.count === row.count && r.rank === row.rank);
        const isFirst = pageData.findIndex(r => r.count === row.count && r.rank === row.rank) === i;

        const rowspan = sameGroup.length;
        let reward = rewards[row.rank - 1] || '';
        if (row.rank >= 6 && row.rank <= 10) {
            reward = "Invitation to the Offline Seminar";
        }
        const rankLabel = {
            1: "🥇 1st Place",
            2: "🥈 2nd Place",
            3: "🥉 3rd Place",
            4: "🏅 4th Place",
            5: "🏅 5th Place"
        };
        const rankDisplay = rankLabel[row.rank] || row.rank;
        const rankCell = isFirst ? `<td rowspan="${rowspan}">${rankDisplay}</td>` : '';

        const countCell = isFirst ? `<td rowspan="${rowspan}">${row.inviter !== '-' ? row.count : ''}</td>` : '';
        const rewardCell = isFirst ? `<td rowspan="${rowspan}">${reward}</td>` : '';

        const rowStyle = row.rank === 1 ? ' style="color: red; font-weight: bold;"' : '';

        tbody.innerHTML += `<tr${rowStyle}>
            ${rankCell}
            <td>${row.inviter !== '-' ? row.inviter : ''}</td>
            ${countCell}
            ${rewardCell}
        </tr>`;

    }

    renderPagination("eventTotalPagination", totalPage, totalCurrent, goToTotalPage);
}

function renderDailyRankingTable() {
    const today = format(new Date()); // 本地今天，比如 "2025-07-15"
    const map = {};

    data.forEach(d => {
        // 
        const localDateStr = format(new Date(d.date + 'T00:00:00'));
        if (localDateStr === today && d.member !== '总榜中增加一积分') {
            map[d.inviter] = (map[d.inviter] || 0) + 1;
        }
    });


    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);

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

    const existingRanks = [...new Set(rankedList.map(r => r.rank))];
    for (let r = 1; r <= 5; r++) {
        if (!existingRanks.includes(r)) {
            rankedList.push({ rank: r, inviter: "-", count: 0 });
        }
    }

    rankedList.sort((a, b) => a.rank - b.rank);

    dailyTotalPage = showAllDaily ? 1 : Math.ceil(rankedList.length / pageSize);
    const pageData = showAllDaily ? rankedList : rankedList.slice((dailyPage - 1) * pageSize, dailyPage * pageSize);

    const tbody = document.querySelector('#dailyRankingTable tbody');
    tbody.innerHTML = '';
    const topCount = sorted.length > 0 ? sorted[0][1] : 0;

    for (let i = 0; i < pageData.length; i++) {
        const row = pageData[i];
        const sameGroup = pageData.filter(r => r.count === row.count && r.rank === row.rank);
        const isFirst = pageData.findIndex(r => r.count === row.count && r.rank === row.rank) === i;

        const rowspan = sameGroup.length;
        const reward = row.count === topCount && row.rank === 1 ? 'K50' : '';

        const rankLabel = {
            1: "🥇 1st Place",
            2: "🥈 2nd Place",
            3: "🥉 3rd Place",
            4: "🏅 4th Place",
            5: "🏅 5th Place"
        };
        const rankDisplay = rankLabel[row.rank] || row.rank;
        const rankCell = isFirst ? `<td rowspan="${rowspan}">${rankDisplay}</td>` : '';

        const countCell = isFirst ? `<td rowspan="${rowspan}">${row.inviter !== '-' ? row.count : ''}</td>` : '';
        const rewardCell = isFirst ? `<td rowspan="${rowspan}">${reward}</td>` : '';

        const rowStyle = row.rank === 1 ? ' style="color: red; font-weight: bold;"' : '';

        tbody.innerHTML += `<tr${rowStyle}>
            ${rankCell}
            <td>${row.inviter !== '-' ? row.inviter : ''}</td>
            ${countCell}
            ${rewardCell}
        </tr>`;

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
    container.innerHTML = '';

    const isTotal = containerId === "eventTotalPagination";
    const isShowAll = isTotal ? showAllTotal : showAllDaily;

    // 计算实际数据条数
    const totalEntries = isTotal
        ? data.filter(d => {
            const date = new Date(d.date);
            return date >= new Date("2025-07-14") && date <= new Date("2025-07-27");
        }).reduce((map, d) => {
            map[d.inviter] = (map[d.inviter] || 0) + 1;
            return map;
        }, {})
        : data.filter(d => {
            const dateStr = format(new Date(d.date));
            return dateStr === format(new Date()) && d.member !== '总榜中增加1积分';
        }).reduce((map, d) => {
            map[d.inviter] = (map[d.inviter] || 0) + 1;
            return map;
        }, {});

    const totalItems = Object.keys(totalEntries).length;

    // 如果数据量不足一页且不是“显示全部”模式，则不渲染分页栏
    if (totalItems <= pageSize && !isShowAll) {
        return;
    }

    let buttons = '';
    const maxButtons = 3;
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + maxButtons - 1);
    if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

    if (!isShowAll && total > 1) {
        buttons += `<button class="btn" onclick="${goToFn.name}(1)">首页</button>`;
        if (current > 1) buttons += `<button class="btn" onclick="${goToFn.name}(${current - 1})">上一页</button>`;
        for (let i = start; i <= end; i++) {
            buttons += `<button class="btn ${i === current ? 'active' : ''}" onclick="${goToFn.name}(${i})">${i}</button>`;
        }
        if (current < total) buttons += `<button class="btn" onclick="${goToFn.name}(${current + 1})">下一页</button>`;
        buttons += `<button class="btn" onclick="${goToFn.name}(${total})">末页</button>`;
    }

    const toggleFn = isTotal ? "toggleShowAllTotal()" : "toggleShowAllDaily()";
    const toggleText = isShowAll ? "恢复分页" : "显示全部";
    buttons += `<button class="btn" onclick="${toggleFn}">${toggleText}</button>`;

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

function toggleShowAllTotal() {
    showAllTotal = !showAllTotal;
    totalCurrent = 1;
    renderEventTotalTable();
}

function toggleShowAllDaily() {
    showAllDaily = !showAllDaily;
    dailyPage = 1;
    renderDailyRankingTable();
}

window.goToTotalPage = goToTotalPage;
window.goToDailyPage = goToDailyPage;

window.toggleShowAllTotal = toggleShowAllTotal;
window.toggleShowAllDaily = toggleShowAllDaily;


loadData();
