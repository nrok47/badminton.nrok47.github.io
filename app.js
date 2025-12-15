// Global State
let members = [];
let matches = [];
let expenses = [];
let courts = [];
let activeTournament = null;
let tournamentHistory = [];
let selectedPlayers = [];

// Initialize App (Firebase RTDB, no auth)
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    // Load from Firebase
    if (typeof loadAllDataFromFirebase === 'function') {
        loadAllDataFromFirebase();
    }
    initializeAppUI();
});

function initializeAppUI() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.target.dataset.page;
            switchPage(page);
        });
    });

    // Add Member Button
    document.getElementById('add-member-btn').addEventListener('click', () => {
        openModal('member-modal');
    });

    // Member Form Submit
    document.getElementById('member-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addMember();
    });

    // Arrange Courts Button
    document.getElementById('arrange-courts-btn').addEventListener('click', arrangeCourts);

    // Match Result Form
    document.getElementById('match-result-form').addEventListener('submit', (e) => {
        e.preventDefault();
        recordMatchResult();
    });

    // Expense Form
    document.getElementById('expense-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addExpense();
    });

    // Clear Expenses Button
    document.getElementById('clear-expenses-btn').addEventListener('click', () => {
        if (confirm('คุณต้องการล้างข้อมูลค่าใช้จ่ายทั้งหมดหรือไม่?')) {
            expenses = [];
            saveDataToFirebase();
            renderExpenses();
            updateDashboard();
        }
    });

    // Tournament Form Submit
    document.getElementById('tournament-form').addEventListener('submit', (e) => {
        e.preventDefault();
        createTournament();
    });

    // End Tournament Button
    document.getElementById('end-tournament-btn').addEventListener('click', () => {
        if (confirm('คุณต้องการสิ้นสุดทัวร์นาเมนต์นี้หรือไม่?')) {
            endTournament();
        }
    });

    // Initial Render
    updateDashboard();
    renderMembers();
    renderExpenses();
    renderTournamentPlayerSelection();
    renderActiveTournament();
    renderTournamentHistory();
}

// Page Navigation
function switchPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${pageName}-page`).classList.add('active');
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    // Reset form if exists
    const modal = document.getElementById(modalId);
    const form = modal.querySelector('form');
    if (form) form.reset();
}

// Member Management
function addMember() {
    const name = document.getElementById('member-name').value.trim();
    const phone = document.getElementById('member-phone').value.trim();

    if (!name) {
        alert('กรุณากรอกชื่อสมาชิก');
        return;
    }

    const member = {
        id: Date.now(),
        name: name,
        phone: phone,
        points: 1000, // Starting points
        wins: 0,
        losses: 0,
        winRate: 0,
        gamesPlayed: 0,
        todayGames: 0,
        lastPlayDate: null
    };

    members.push(member);
    saveDataToFirebase();
    renderMembers();
    updateDashboard();
    updatePlayerSelects();
    closeModal('member-modal');
}

function deleteMember(id) {
    if (confirm('คุณต้องการลบสมาชิกนี้หรือไม่?')) {
        members = members.filter(m => m.id !== id);
        saveDataToFirebase();
        renderMembers();
        updateDashboard();
        updatePlayerSelects();
    }
}

function renderMembers() {
    const container = document.getElementById('members-list');
    
    if (members.length === 0) {
        container.innerHTML = '<p class="empty-state">ยังไม่มีสมาชิก คลิก "เพิ่มสมาชิก" เพื่อเริ่มต้น</p>';
        return;
    }

    container.innerHTML = members.map(member => `
        <div class="member-card">
            <button class="member-delete" onclick="deleteMember(${member.id})">×</button>
            <div class="member-avatar">👤</div>
            <div class="member-name">${member.name}</div>
            <div class="member-stats">
                คะแนน: ${member.points} | ${member.wins}W-${member.losses}L
            </div>
        </div>
    `).join('');
}

// Court Arrangement
function arrangeCourts() {
    if (members.length < 4) {
        alert('ต้องมีสมาชิกอย่างน้อย 4 คน เพื่อจัดคอร์ท');
        return;
    }

    // Shuffle members
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    courts = [];

    for (let i = 0; i < shuffled.length; i += 4) {
        if (i + 3 < shuffled.length) {
            courts.push({
                id: courts.length + 1,
                team1: [shuffled[i], shuffled[i + 1]],
                team2: [shuffled[i + 2], shuffled[i + 3]]
            });
        }
    }

    renderCourts();
}

function renderCourts() {
    const container = document.getElementById('courts-container');

    if (courts.length === 0) {
        container.innerHTML = '<p class="empty-state">คลิก "สุ่มจัดคอร์ทอัตโนมัติ" เพื่อเริ่มแข่งขัน</p>';
        return;
    }

    container.innerHTML = `<div class="courts-grid">${courts.map(court => `
        <div class="court-item">
            <div class="court-header">🏸 คอร์ท ${court.id}</div>
            <div class="court-teams">
                <div class="court-team">
                    <div class="team-players">${court.team1[0].name} + ${court.team1[1].name}</div>
                    <div class="team-rank">คะแนนรวม: ${court.team1[0].points + court.team1[1].points}</div>
                </div>
                <div class="court-vs">VS</div>
                <div class="court-team">
                    <div class="team-players">${court.team2[0].name} + ${court.team2[1].name}</div>
                    <div class="team-rank">คะแนนรวม: ${court.team2[0].points + court.team2[1].points}</div>
                </div>
            </div>
        </div>
    `).join('')}</div>`;
}

// Player Selects Update
function updatePlayerSelects() {
    const selects = ['winner1', 'winner2', 'loser1', 'loser2', 'expense-payer'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        const isExpense = selectId === 'expense-payer';
        
        select.innerHTML = `<option value="">เลือก${isExpense ? 'ผู้จ่าย' : 'ผู้เล่น'}</option>` +
            members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        
        if (currentValue) select.value = currentValue;
    });
}

// Match Result Recording with Advanced Scoring Logic
function recordMatchResult() {
    const winner1Id = parseInt(document.getElementById('winner1').value);
    const winner2Id = parseInt(document.getElementById('winner2').value);
    const loser1Id = parseInt(document.getElementById('loser1').value);
    const loser2Id = parseInt(document.getElementById('loser2').value);

    if (!winner1Id || !winner2Id || !loser1Id || !loser2Id) {
        alert('กรุณาเลือกผู้เล่นให้ครบทุกคน');
        return;
    }

    // Check for duplicate players
    const playerIds = [winner1Id, winner2Id, loser1Id, loser2Id];
    if (new Set(playerIds).size !== 4) {
        alert('ไม่สามารถเลือกผู้เล่นคนเดียวกันซ้ำได้');
        return;
    }

    const winner1 = members.find(m => m.id === winner1Id);
    const winner2 = members.find(m => m.id === winner2Id);
    const loser1 = members.find(m => m.id === loser1Id);
    const loser2 = members.find(m => m.id === loser2Id);

    // Check if it's the same day for anti-farm mechanism
    const today = new Date().toDateString();
    
    // Calculate points using advanced logic
    const winnersAvgPoints = (winner1.points + winner2.points) / 2;
    const losersAvgPoints = (loser1.points + loser2.points) / 2;
    const pointDiff = Math.abs(winnersAvgPoints - losersAvgPoints);

    // Base points
    let winPoints = 10;
    let losePoints = -5;

    // Bonus for beating higher-ranked team
    if (losersAvgPoints > winnersAvgPoints) {
        const bonus = Math.min(6, Math.floor(pointDiff / 50));
        winPoints += bonus;
    }

    // Penalty for losing to lower-ranked team
    if (winnersAvgPoints > losersAvgPoints) {
        const penalty = Math.min(3, Math.floor(pointDiff / 100));
        losePoints -= penalty;
    }

    // Bonus for carrying a weak partner
    [winner1, winner2].forEach(winner => {
        const partner = winner.id === winner1Id ? winner2 : winner1;
        if (partner.winRate < 0.4 && partner.gamesPlayed > 5) {
            winner.points += 2;
        }
    });

    // Anti-farm mechanism (playing more than 5 games per day)
    [winner1, winner2, loser1, loser2].forEach(player => {
        if (player.lastPlayDate === today) {
            player.todayGames++;
            if (player.todayGames > 5) {
                // Reduce points gained/lost
                winPoints = Math.max(5, winPoints - 2);
                losePoints = Math.max(-3, losePoints + 1);
            }
        } else {
            player.todayGames = 1;
            player.lastPlayDate = today;
        }
    });

    // Apply points
    winner1.points += winPoints;
    winner2.points += winPoints;
    loser1.points += losePoints;
    loser2.points += losePoints;

    // Ensure minimum points
    [winner1, winner2, loser1, loser2].forEach(player => {
        player.points = Math.max(0, player.points);
    });

    // Update stats
    winner1.wins++;
    winner2.wins++;
    loser1.losses++;
    loser2.losses++;

    [winner1, winner2, loser1, loser2].forEach(player => {
        player.gamesPlayed++;
        player.winRate = player.wins / player.gamesPlayed;
    });

    // Record match
    matches.push({
        id: Date.now(),
        winners: [winner1.name, winner2.name],
        losers: [loser1.name, loser2.name],
        winPoints: winPoints,
        losePoints: losePoints,
        timestamp: new Date().toISOString()
    });

    saveDataToFirebase();
    updateDashboard();
    renderMembers();
    
    // Reset form
    document.getElementById('match-result-form').reset();
    
    alert(`✅ บันทึกผลการแข่งขันสำเร็จ!\n\nฝั่งชนะ: +${winPoints} คะแนน\nฝั่งแพ้: ${losePoints} คะแนน`);
}

// Expense Management
function addExpense() {
    const name = document.getElementById('expense-name').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const payerId = parseInt(document.getElementById('expense-payer').value);

    if (!name || !amount || !payerId) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    const payer = members.find(m => m.id === payerId);

    expenses.push({
        id: Date.now(),
        name: name,
        amount: amount,
        payer: payer.name,
        payerId: payerId,
        timestamp: new Date().toISOString()
    });

    saveDataToFirebase();
    renderExpenses();
    updateDashboard();
    
    document.getElementById('expense-form').reset();
}

function deleteExpense(id) {
    if (confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
        expenses = expenses.filter(e => e.id !== id);
        saveDataToFirebase();
        renderExpenses();
        updateDashboard();
    }
}

function renderExpenses() {
    // Expenses List
    const listContainer = document.getElementById('expenses-list');
    
    if (expenses.length === 0) {
        listContainer.innerHTML = '<p class="empty-state">ไม่มีรายการ</p>';
    } else {
        listContainer.innerHTML = expenses.map(exp => `
            <div class="expense-item">
                <div>
                    <strong>${exp.name}</strong> - ฿${exp.amount.toLocaleString()}
                    <div style="font-size: 0.85rem; color: #666;">จ่ายโดย: ${exp.payer}</div>
                </div>
                <button class="expense-delete" onclick="deleteExpense(${exp.id})">🗑️</button>
            </div>
        `).join('');
    }

    // Bill Split Calculation
    const summaryContainer = document.getElementById('expenses-summary');
    
    if (expenses.length === 0) {
        summaryContainer.innerHTML = '<p class="empty-state">ยังไม่มีรายการค่าใช้จ่าย</p>';
        return;
    }

    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const perPerson = totalExpense / members.length;

    // Calculate who paid what
    const payments = {};
    members.forEach(m => payments[m.id] = 0);
    expenses.forEach(exp => {
        payments[exp.payerId] = (payments[exp.payerId] || 0) + exp.amount;
    });

    // Calculate balance
    const balances = members.map(m => ({
        name: m.name,
        id: m.id,
        paid: payments[m.id] || 0,
        shouldPay: perPerson,
        balance: (payments[m.id] || 0) - perPerson
    }));

    summaryContainer.innerHTML = `
        <div class="summary-item summary-total">
            <span>รวมทั้งหมด</span>
            <span>฿${totalExpense.toLocaleString()}</span>
        </div>
        <div class="summary-item">
            <span>จำนวนคน</span>
            <span>${members.length} คน</span>
        </div>
        <div class="summary-item">
            <span>คนละ</span>
            <span>฿${perPerson.toFixed(2)}</span>
        </div>
        <div style="margin-top: 1.5rem;">
            <h4 style="margin-bottom: 1rem;">💸 สรุปการจ่ายเงิน</h4>
            <div class="bill-split-grid">
                ${balances.map(b => `
                    <div class="bill-split-item ${b.balance < -0.01 ? 'debt' : b.balance > 0.01 ? 'credit' : ''}">
                        <span>${b.name}</span>
                        <span style="font-weight: bold;">
                            ${b.balance < -0.01 ? `ต้องจ่ายเพิ่ม ฿${Math.abs(b.balance).toFixed(2)}` : 
                              b.balance > 0.01 ? `ได้รับคืน ฿${b.balance.toFixed(2)}` : 
                              'เสมอกัน ✅'}
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Dashboard Updates
function updateDashboard() {
    // Stats
    document.getElementById('total-members').textContent = members.length;
    document.getElementById('total-matches').textContent = matches.length;
    document.getElementById('total-courts').textContent = courts.length;
    document.getElementById('total-expenses').textContent = 
        '฿' + expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString();

    // Leaderboard
    const leaderboard = document.getElementById('leaderboard');
    const sortedMembers = [...members].sort((a, b) => b.points - a.points);

    if (sortedMembers.length === 0) {
        leaderboard.innerHTML = '<p class="empty-state">ยังไม่มีข้อมูลคะแนน เริ่มต้นโดยเพิ่มสมาชิกและบันทึกผลการแข่งขัน</p>';
    } else {
        leaderboard.innerHTML = sortedMembers.map((member, index) => {
            const rank = index + 1;
            let rankClass = '';
            let medal = '';
            
            if (rank === 1) {
                rankClass = 'rank-1';
                medal = '🥇';
            } else if (rank === 2) {
                rankClass = 'rank-2';
                medal = '🥈';
            } else if (rank === 3) {
                rankClass = 'rank-3';
                medal = '🥉';
            }

            return `
                <div class="leaderboard-item ${rankClass}">
                    <div class="leaderboard-rank">#${rank} ${medal}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name">${member.name}</div>
                        <div class="leaderboard-stats">
                            ${member.wins}W-${member.losses}L | 
                            Win Rate: ${(member.winRate * 100).toFixed(1)}% |
                            เล่นแล้ว: ${member.gamesPlayed} เกม
                        </div>
                    </div>
                    <div class="leaderboard-points">${member.points}</div>
                </div>
            `;
        }).join('');
    }

    // Recent Matches
    const recentMatches = document.getElementById('recent-matches');
    const lastMatches = matches.slice(-5).reverse();

    if (lastMatches.length === 0) {
        recentMatches.innerHTML = '<p class="empty-state">ยังไม่มีการแข่งขัน</p>';
    } else {
        recentMatches.innerHTML = lastMatches.map(match => {
            const time = new Date(match.timestamp).toLocaleString('th-TH');
            return `
                <div class="match-item">
                    <div>
                        <div class="match-winners">
                            ชนะ: ${match.winners.join(' + ')} (+${match.winPoints})
                        </div>
                        <div class="match-losers">
                            แพ้: ${match.losers.join(' + ')} (${match.losePoints})
                        </div>
                        <div class="match-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updatePlayerSelects();
}

// Tournament Management
function renderTournamentPlayerSelection() {
    const container = document.getElementById('tournament-players-selection');
    
    if (members.length === 0) {
        container.innerHTML = '<p class="empty-state">กรุณาเพิ่มสมาชิกก่อน</p>';
        return;
    }

    container.innerHTML = members.map(member => `
        <label class="tournament-player-checkbox ${selectedPlayers.includes(member.id) ? 'selected' : ''}" 
               onclick="togglePlayerSelection(${member.id})">
            <input type="checkbox" ${selectedPlayers.includes(member.id) ? 'checked' : ''} 
                   onchange="event.stopPropagation()">
            <span>${member.name}</span>
        </label>
    `).join('');
}

function togglePlayerSelection(playerId) {
    if (selectedPlayers.includes(playerId)) {
        selectedPlayers = selectedPlayers.filter(id => id !== playerId);
    } else {
        selectedPlayers.push(playerId);
    }
    renderTournamentPlayerSelection();
}

function createTournament() {
    const name = document.getElementById('tournament-name').value.trim();
    const format = document.getElementById('tournament-format').value;

    if (!name) {
        alert('กรุณากรอกชื่อทัวร์นาเมนต์');
        return;
    }

    // For doubles, need at least 4 players (2 pairs)
    if (selectedPlayers.length < 4) {
        alert('กรุณาเลือกผู้เล่นอย่างน้อย 4 คน (2 คู่)');
        return;
    }

    // For doubles, must be even number
    if (selectedPlayers.length % 2 !== 0) {
        alert('จำนวนผู้เล่นต้องเป็นเลขคู่ (เพื่อจับคู่)');
        return;
    }

    const tournamentPlayers = members.filter(m => selectedPlayers.includes(m.id));

    // Create pairs
    const pairs = [];
    for (let i = 0; i < tournamentPlayers.length; i += 2) {
        pairs.push({
            id: pairs.length + 1,
            player1: tournamentPlayers[i],
            player2: tournamentPlayers[i + 1],
            name: `${tournamentPlayers[i].name} + ${tournamentPlayers[i + 1].name}`,
            wins: 0,
            losses: 0,
            points: 0
        });
    }

    activeTournament = {
        id: Date.now(),
        name: name,
        format: format,
        pairs: pairs,
        matches: [],
        startDate: new Date().toISOString(),
        status: 'active'
    };

    if (format === 'roundrobin') {
        activeTournament.matches = generateRoundRobinMatches(pairs);
    } else {
        activeTournament.matches = generateEliminationBracket(pairs);
    }

    saveDataToFirebase();
    selectedPlayers = [];
    document.getElementById('tournament-form').reset();
    renderTournamentPlayerSelection();
    renderActiveTournament();
    
    alert('🏆 สร้างทัวร์นาเมนต์สำเร็จ!');
}

function generateRoundRobinMatches(pairs) {
    const matches = [];
    for (let i = 0; i < pairs.length; i++) {
        for (let j = i + 1; j < pairs.length; j++) {
            matches.push({
                id: matches.length + 1,
                pair1: pairs[i],
                pair2: pairs[j],
                winner: null,
                status: 'pending'
            });
        }
    }
    return matches;
}

function generateEliminationBracket(pairs) {
    // Shuffle pairs for random seeding
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    const matches = [];
    
    for (let i = 0; i < shuffled.length; i += 2) {
        matches.push({
            id: matches.length + 1,
            pair1: shuffled[i],
            pair2: shuffled[i + 1],
            winner: null,
            round: 1,
            status: 'pending'
        });
    }
    
    return matches;
}

function renderActiveTournament() {
    const container = document.getElementById('active-tournament');
    
    if (!activeTournament) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    document.getElementById('active-tournament-name').textContent = `🏆 ${activeTournament.name}`;

    const bracketContainer = document.getElementById('tournament-bracket');

    if (activeTournament.format === 'roundrobin') {
        renderRoundRobinBracket(bracketContainer);
    } else {
        renderEliminationBracket(bracketContainer);
    }
}

function renderRoundRobinBracket(container) {
    const pendingMatches = activeTournament.matches.filter(m => m.status === 'pending');
    const completedMatches = activeTournament.matches.filter(m => m.status === 'completed');

    let html = '<div class="tournament-bracket">';

    // Standings
    html += '<div class="roundrobin-standings">';
    html += '<h4>🏅 ตารางคะแนน</h4>';
    html += '<table class="standings-table">';
    html += '<thead><tr><th>อันดับ</th><th>คู่</th><th>แพ้</th><th>ชนะ</th><th>คะแนน</th></tr></thead>';
    html += '<tbody>';

    const standings = [...activeTournament.pairs].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.points - a.points;
    });

    standings.forEach((pair, index) => {
        const rankClass = index === 0 ? 'standings-rank-1' : index === 1 ? 'standings-rank-2' : index === 2 ? 'standings-rank-3' : '';
        html += `<tr class="${rankClass}">
            <td><strong>#${index + 1}</strong></td>
            <td>${pair.name}</td>
            <td>${pair.losses}</td>
            <td>${pair.wins}</td>
            <td><strong>${pair.points}</strong></td>
        </tr>`;
    });

    html += '</tbody></table></div>';

    // Pending Matches
    if (pendingMatches.length > 0) {
        html += '<div class="bracket-round"><div class="bracket-round-title">⏳ แมตช์ที่รอแข่งขัน</div>';
        html += '<div class="bracket-matches">';
        
        pendingMatches.forEach(match => {
            html += `<div class="bracket-match">
                <div class="bracket-match-header">แมตช์ #${match.id}</div>
                <div class="bracket-teams">
                    <div class="bracket-team">
                        <span class="bracket-team-name">${match.pair1.name}</span>
                        <div class="bracket-result-btn">
                            <button class="btn-win" onclick="recordTournamentResult(${match.id}, ${match.pair1.id})">✅ ชนะ</button>
                        </div>
                    </div>
                    <div class="bracket-team">
                        <span class="bracket-team-name">${match.pair2.name}</span>
                        <div class="bracket-result-btn">
                            <button class="btn-win" onclick="recordTournamentResult(${match.id}, ${match.pair2.id})">✅ ชนะ</button>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        
        html += '</div></div>';
    }

    // Completed Matches
    if (completedMatches.length > 0) {
        html += '<div class="bracket-round"><div class="bracket-round-title">✅ แมตช์ที่เสร็จแล้ว</div>';
        html += '<div class="bracket-matches">';
        
        completedMatches.forEach(match => {
            html += `<div class="bracket-match">
                <div class="bracket-match-header">แมตช์ #${match.id}</div>
                <div class="bracket-teams">
                    <div class="bracket-team ${match.winner === match.pair1.id ? 'winner' : 'loser'}">
                        <span class="bracket-team-name">${match.pair1.name}</span>
                        ${match.winner === match.pair1.id ? '<span>🏆</span>' : ''}
                    </div>
                    <div class="bracket-team ${match.winner === match.pair2.id ? 'winner' : 'loser'}">
                        <span class="bracket-team-name">${match.pair2.name}</span>
                        ${match.winner === match.pair2.id ? '<span>🏆</span>' : ''}
                    </div>
                </div>
            </div>`;
        });
        
        html += '</div></div>';
    }

    html += '</div>';
    container.innerHTML = html;
}

function renderEliminationBracket(container) {
    const rounds = {};
    activeTournament.matches.forEach(match => {
        const round = match.round || 1;
        if (!rounds[round]) rounds[round] = [];
        rounds[round].push(match);
    });

    let html = '<div class="tournament-bracket">';

    Object.keys(rounds).sort((a, b) => a - b).forEach(roundNum => {
        const roundMatches = rounds[roundNum];
        const roundName = getRoundName(parseInt(roundNum), Object.keys(rounds).length);
        
        html += `<div class="bracket-round">
            <div class="bracket-round-title">${roundName}</div>
            <div class="bracket-matches">`;

        roundMatches.forEach(match => {
            if (!match.pair1 || !match.pair2) return;

            html += `<div class="bracket-match">
                <div class="bracket-match-header">แมตช์ #${match.id}</div>
                <div class="bracket-teams">`;

            if (match.status === 'pending') {
                html += `
                    <div class="bracket-team">
                        <span class="bracket-team-name">${match.pair1.name}</span>
                        <div class="bracket-result-btn">
                            <button class="btn-win" onclick="recordTournamentResult(${match.id}, ${match.pair1.id})">✅ ชนะ</button>
                        </div>
                    </div>
                    <div class="bracket-team">
                        <span class="bracket-team-name">${match.pair2.name}</span>
                        <div class="bracket-result-btn">
                            <button class="btn-win" onclick="recordTournamentResult(${match.id}, ${match.pair2.id})">✅ ชนะ</button>
                        </div>
                    </div>`;
            } else {
                html += `
                    <div class="bracket-team ${match.winner === match.pair1.id ? 'winner' : 'loser'}">
                        <span class="bracket-team-name">${match.pair1.name}</span>
                        ${match.winner === match.pair1.id ? '<span>🏆</span>' : ''}
                    </div>
                    <div class="bracket-team ${match.winner === match.pair2.id ? 'winner' : 'loser'}">
                        <span class="bracket-team-name">${match.pair2.name}</span>
                        ${match.winner === match.pair2.id ? '<span>🏆</span>' : ''}
                    </div>`;
            }

            html += '</div></div>';
        });

        html += '</div></div>';
    });

    html += '</div>';
    container.innerHTML = html;
}

function getRoundName(round, totalRounds) {
    if (round === totalRounds) return '🏆 รอบชิงชนะเลิศ';
    if (round === totalRounds - 1) return '🥇 รอบรองชนะเลิศ';
    return `⚔️ รอบที่ ${round}`;
}

function recordTournamentResult(matchId, winnerId) {
    const match = activeTournament.matches.find(m => m.id === matchId);
    if (!match) return;

    match.winner = winnerId;
    match.status = 'completed';

    // Update pair stats
    const winnerPair = activeTournament.pairs.find(p => p.id === winnerId);
    const loserPair = activeTournament.pairs.find(p => 
        p.id === (match.pair1.id === winnerId ? match.pair2.id : match.pair1.id)
    );

    if (winnerPair) {
        winnerPair.wins++;
        winnerPair.points += 3;
    }
    if (loserPair) {
        loserPair.losses++;
    }

    // For elimination, create next round match
    if (activeTournament.format === 'elimination') {
        const currentRound = match.round;
        const matchesInRound = activeTournament.matches.filter(m => m.round === currentRound);
        const completedInRound = matchesInRound.filter(m => m.status === 'completed');

        // If all matches in round completed and not final
        if (completedInRound.length === matchesInRound.length && matchesInRound.length > 1) {
            // Create next round
            const winners = completedInRound.map(m => 
                activeTournament.pairs.find(p => p.id === m.winner)
            );

            const nextRound = currentRound + 1;
            for (let i = 0; i < winners.length; i += 2) {
                if (i + 1 < winners.length) {
                    activeTournament.matches.push({
                        id: activeTournament.matches.length + 1,
                        pair1: winners[i],
                        pair2: winners[i + 1],
                        winner: null,
                        round: nextRound,
                        status: 'pending'
                    });
                }
            }
        }
    }

    saveDataToFirebase();
    renderActiveTournament();

    // Check if tournament is complete
    if (activeTournament.format === 'roundrobin') {
        const allCompleted = activeTournament.matches.every(m => m.status === 'completed');
        if (allCompleted) {
            alert('🎉 ทัวร์นาเมนต์เสร็จสิ้น! คลิก "สิ้นสุดทัวร์นาเมนต์" เพื่อดูผลสรุป');
        }
    } else {
        const finalMatch = activeTournament.matches.find(m => 
            m.round === Math.max(...activeTournament.matches.map(m => m.round))
        );
        if (finalMatch && finalMatch.status === 'completed') {
            alert('🎉 ทัวร์นาเมนต์เสร็จสิ้น! คลิก "สิ้นสุดทัวร์นาเมนต์" เพื่อดูผลสรุป');
        }
    }
}

function endTournament() {
    if (!activeTournament) return;

    // Determine winner
    let winner;
    if (activeTournament.format === 'roundrobin') {
        winner = [...activeTournament.pairs].sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.points - a.points;
        })[0];
    } else {
        const finalMatch = activeTournament.matches.find(m => 
            m.round === Math.max(...activeTournament.matches.map(m => m.round))
        );
        winner = activeTournament.pairs.find(p => p.id === finalMatch?.winner);
    }

    activeTournament.status = 'completed';
    activeTournament.endDate = new Date().toISOString();
    activeTournament.winner = winner;

    tournamentHistory.unshift(activeTournament);
    activeTournament = null;

    saveDataToFirebase();
    renderActiveTournament();
    renderTournamentHistory();

    alert(`🏆 ทัวร์นาเมนต์เสร็จสิ้น!\n\nแชมป์: ${winner?.name || 'ไม่มี'}`);
}

function renderTournamentHistory() {
    const container = document.getElementById('tournament-history');

    if (tournamentHistory.length === 0) {
        container.innerHTML = '<p class="empty-state">ยังไม่มีทัวร์นาเมนต์ที่จบแล้ว</p>';
        return;
    }

    container.innerHTML = tournamentHistory.map(tournament => {
        const date = new Date(tournament.endDate).toLocaleDateString('th-TH');
        return `
            <div class="tournament-history-item">
                <div class="tournament-history-header">
                    <div class="tournament-history-title">${tournament.name}</div>
                    <div class="tournament-history-date">${date}</div>
                </div>
                <div>รูปแบบ: ${tournament.format === 'roundrobin' ? 'Round Robin' : 'Single Elimination'}</div>
                <div>จำนวนคู่: ${tournament.pairs.length} คู่</div>
                ${tournament.winner ? `<div class="tournament-winner">🏆 แชมป์: ${tournament.winner.name}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Data persistence handled in firebase-config.js (saveDataToFirebase, loadAllDataFromFirebase)
