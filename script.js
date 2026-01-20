// Dữ liệu ứng dụng
let debts = [];
let payments = [];
let incomes = [];
let expenses = [];
let editingDebtId = null;
let editingIncomeId = null;
let editingExpenseId = null;
let expensesChart = null;
let categoryChart = null;

// Khởi tạo ứng dụng
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra đăng nhập
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '/dang-nhap';
        return;
    }
    
    loadData();
    renderDebts();
    renderPayments();
    renderIncomes();
    renderExpenses();
    updateDashboard();
    updateDashboardStats();
    setTodayDate();
});

// Thiết lập ngày hôm nay cho các input date
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('debtDate').value = today;
    document.getElementById('paymentDate').value = today;
    const currentMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('incomeMonth').value = currentMonth;
}

// Chuyển đổi tab
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName + '-tab').classList.add('active');
    // Tìm và kích hoạt tab button tương ứng
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes("'" + tabName + "'")) {
            btn.classList.add('active');
        }
    });
    
    // Nếu chuyển sang tab dashboard, cập nhật thống kê
    if (tabName === 'dashboard') {
        updateDashboardStats();
    }
}

// ========== QUẢN LÝ NỢ ==========

function openDebtModal(id = null) {
    editingDebtId = id;
    const modal = document.getElementById('debtModal');
    const form = document.getElementById('debtForm');
    
    if (id) {
        const debt = debts.find(d => d.id === id);
        document.getElementById('debtModalTitle').textContent = 'Sửa Nợ';
        document.getElementById('debtName').value = debt.name;
        document.getElementById('debtAmount').value = debt.amount;
        document.getElementById('debtPaid').value = debt.paid || 0;
        document.getElementById('debtDate').value = debt.date;
        document.getElementById('debtNote').value = debt.note || '';
    } else {
        document.getElementById('debtModalTitle').textContent = 'Thêm Nợ Mới';
        form.reset();
        setTodayDate();
    }
    
    modal.classList.add('active');
}

function closeDebtModal() {
    document.getElementById('debtModal').classList.remove('active');
    editingDebtId = null;
}

function saveDebt(event) {
    event.preventDefault();
    
    const debt = {
        id: editingDebtId || Date.now(),
        name: document.getElementById('debtName').value,
        amount: parseFloat(document.getElementById('debtAmount').value),
        paid: parseFloat(document.getElementById('debtPaid').value) || 0,
        date: document.getElementById('debtDate').value,
        note: document.getElementById('debtNote').value || ''
    };
    
    if (editingDebtId) {
        const index = debts.findIndex(d => d.id === editingDebtId);
        debts[index] = debt;
    } else {
        debts.push(debt);
    }
    
    saveData();
    renderDebts();
    renderPayments();
    updateDashboard();
    closeDebtModal();
}

function deleteDebt(id) {
    if (confirm('Bạn có chắc chắn muốn xóa khoản nợ này?')) {
        debts = debts.filter(d => d.id !== id);
        payments = payments.filter(p => p.debtId !== id);
        saveData();
        renderDebts();
        renderPayments();
        updateDashboard();
    }
}

function renderDebts() {
    const tbody = document.getElementById('debtsTableBody');
    
    if (debts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><h3>Chưa có khoản nợ nào</h3><p>Hãy thêm khoản nợ đầu tiên của bạn</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = debts.map((debt, index) => {
        const remaining = debt.amount - debt.paid;
        const percentRemaining = debt.amount > 0 ? ((remaining / debt.amount) * 100).toFixed(1) : 0;
        const percentClass = percentRemaining > 70 ? 'high' : percentRemaining > 30 ? 'medium' : 'low';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${debt.name}</strong></td>
                <td>${formatCurrency(debt.amount)}</td>
                <td>${formatCurrency(debt.paid)}</td>
                <td><strong>${formatCurrency(remaining)}</strong></td>
                <td><span class="percent-badge ${percentClass}">${percentRemaining}%</span></td>
                <td>${formatDate(debt.date)}</td>
                <td>
                    <button class="btn btn-edit" onclick="openDebtModal(${debt.id})">Sửa</button>
                    <button class="btn btn-danger" onclick="deleteDebt(${debt.id})">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ========== QUẢN LÝ TRẢ NỢ ==========

function openPaymentModal() {
    const modal = document.getElementById('paymentModal');
    const select = document.getElementById('paymentDebtId');
    
    select.innerHTML = '<option value="">-- Chọn khoản nợ --</option>';
    debts.forEach(debt => {
        const remaining = debt.amount - debt.paid;
        if (remaining > 0) {
            select.innerHTML += `<option value="${debt.id}">${debt.name} (Còn lại: ${formatCurrency(remaining)})</option>`;
        }
    });
    
    document.getElementById('paymentForm').reset();
    setTodayDate();
    modal.classList.add('active');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

function savePayment(event) {
    event.preventDefault();
    
    const debtId = parseInt(document.getElementById('paymentDebtId').value);
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    const date = document.getElementById('paymentDate').value;
    const note = document.getElementById('paymentNote').value || '';
    
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;
    
    const remaining = debt.amount - debt.paid;
    if (amount > remaining) {
        alert('Số tiền trả không được vượt quá số nợ còn lại!');
        return;
    }
    
    payments.push({
        id: Date.now(),
        debtId: debtId,
        amount: amount,
        date: date,
        note: note
    });
    
    debt.paid = (debt.paid || 0) + amount;
    
    saveData();
    renderDebts();
    renderPayments();
    updateDashboard();
    closePaymentModal();
}

function renderPayments() {
    const container = document.getElementById('paymentsList');
    
    if (debts.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>Chưa có khoản nợ nào</h3><p>Hãy thêm khoản nợ để có thể trả nợ</p></div>';
        return;
    }
    
    const debtsWithRemaining = debts.filter(d => (d.amount - d.paid) > 0);
    
    if (debtsWithRemaining.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>🎉 Tuyệt vời!</h3><p>Bạn đã trả hết tất cả các khoản nợ!</p></div>';
        return;
    }
    
    container.innerHTML = debtsWithRemaining.map(debt => {
        const remaining = debt.amount - debt.paid;
        const percentRemaining = debt.amount > 0 ? ((remaining / debt.amount) * 100).toFixed(1) : 0;
        const percentPaid = debt.amount > 0 ? ((debt.paid / debt.amount) * 100).toFixed(1) : 0;
        const percentClass = percentRemaining > 70 ? 'high' : percentRemaining > 30 ? 'medium' : 'low';
        
        const debtPayments = payments.filter(p => p.debtId === debt.id);
        
        return `
            <div class="payment-card">
                <div class="payment-info">
                    <h3>${debt.name}</h3>
                    <div class="payment-details">
                        <div class="payment-detail-item">
                            <strong>Tổng Nợ:</strong>
                            <span>${formatCurrency(debt.amount)}</span>
                        </div>
                        <div class="payment-detail-item">
                            <strong>Đã Trả:</strong>
                            <span style="color: #27ae60;">${formatCurrency(debt.paid)}</span>
                        </div>
                        <div class="payment-detail-item">
                            <strong>Còn Lại:</strong>
                            <span style="color: #e74c3c; font-weight: 700;">${formatCurrency(remaining)}</span>
                        </div>
                        <div class="payment-detail-item">
                            <strong>% Còn Lại:</strong>
                            <span class="percent-badge ${percentClass}">${percentRemaining}%</span>
                        </div>
                    </div>
                    <div class="payment-progress">
                        <div class="payment-progress-bar" style="width: ${percentPaid}%">
                            ${percentPaid}% Đã Trả
                        </div>
                    </div>
                    ${debtPayments.length > 0 ? `
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                            <strong>Lịch Sử Trả Nợ:</strong>
                            <ul style="margin-top: 10px; list-style: none; padding: 0;">
                                ${debtPayments.map(p => `
                                    <li style="padding: 5px 0; color: #666;">
                                        ${formatCurrency(p.amount)} - ${formatDate(p.date)}
                                        ${p.note ? `<br><small style="color: #999;">${p.note}</small>` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <div class="payment-actions">
                    <button class="btn btn-primary" onclick="openPaymentModal(); setTimeout(() => document.getElementById('paymentDebtId').value = ${debt.id}, 100);">
                        Trả Nợ
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ========== QUẢN LÝ THU NHẬP ==========

function openIncomeModal(id = null) {
    editingIncomeId = id;
    const modal = document.getElementById('incomeModal');
    const form = document.getElementById('incomeForm');
    
    if (id) {
        const income = incomes.find(i => i.id === id);
        document.getElementById('incomeModalTitle').textContent = 'Sửa Thu Nhập';
        document.getElementById('incomeType').value = income.type;
        document.getElementById('incomeName').value = income.name;
        document.getElementById('incomeAmount').value = income.amount;
        document.getElementById('incomeMonth').value = income.month;
        document.getElementById('incomeNote').value = income.note || '';
    } else {
        document.getElementById('incomeModalTitle').textContent = 'Thêm Thu Nhập';
        form.reset();
        setTodayDate();
    }
    
    modal.classList.add('active');
}

function closeIncomeModal() {
    document.getElementById('incomeModal').classList.remove('active');
    editingIncomeId = null;
}

function saveIncome(event) {
    event.preventDefault();
    
    const income = {
        id: editingIncomeId || Date.now(),
        type: document.getElementById('incomeType').value,
        name: document.getElementById('incomeName').value,
        amount: parseFloat(document.getElementById('incomeAmount').value),
        month: document.getElementById('incomeMonth').value,
        note: document.getElementById('incomeNote').value || ''
    };
    
    if (editingIncomeId) {
        const index = incomes.findIndex(i => i.id === editingIncomeId);
        incomes[index] = income;
    } else {
        incomes.push(income);
    }
    
    saveData();
    renderIncomes();
    updateDashboard();
    closeIncomeModal();
}

function deleteIncome(id) {
    if (confirm('Bạn có chắc chắn muốn xóa khoản thu nhập này?')) {
        incomes = incomes.filter(i => i.id !== id);
        saveData();
        renderIncomes();
        updateDashboard();
    }
}

function renderIncomes() {
    const tbody = document.getElementById('incomesTableBody');
    
    if (incomes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><h3>Chưa có thu nhập nào</h3><p>Hãy thêm thu nhập đầu tiên của bạn</p></td></tr>';
        return;
    }
    
    const sortedIncomes = [...incomes].sort((a, b) => {
        if (b.month !== a.month) return b.month.localeCompare(a.month);
        return b.id - a.id;
    });
    
    tbody.innerHTML = sortedIncomes.map((income, index) => {
        const typeLabel = income.type === 'monthly' ? 'Thu Nhập Hàng Tháng' : 'Khoản Thu Khác';
        const typeBadge = income.type === 'monthly' ? '<span style="background: #3498db; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">Hàng Tháng</span>' : '<span style="background: #9b59b6; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.85em;">Khác</span>';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${income.name}</strong><br>${typeBadge}</td>
                <td style="color: #27ae60; font-weight: 700;">${formatCurrency(income.amount)}</td>
                <td>${formatMonth(income.month)}</td>
                <td>${income.note || '-'}</td>
                <td>
                    <button class="btn btn-edit" onclick="openIncomeModal(${income.id})">Sửa</button>
                    <button class="btn btn-danger" onclick="deleteIncome(${income.id})">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ========== QUẢN LÝ KHOẢN CHI ==========

function openExpenseModal(id = null) {
    editingExpenseId = id;
    const modal = document.getElementById('expenseModal');
    const form = document.getElementById('expenseForm');
    
    if (id) {
        const expense = expenses.find(e => e.id === id);
        document.getElementById('expenseModalTitle').textContent = 'Sửa Khoản Chi';
        document.getElementById('expenseCategory').value = expense.category;
        document.getElementById('expenseName').value = expense.name;
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expenseDate').value = expense.date;
        document.getElementById('expenseNote').value = expense.note || '';
    } else {
        document.getElementById('expenseModalTitle').textContent = 'Thêm Khoản Chi';
        form.reset();
        setTodayDate();
    }
    
    modal.classList.add('active');
}

function closeExpenseModal() {
    document.getElementById('expenseModal').classList.remove('active');
    editingExpenseId = null;
}

function saveExpense(event) {
    event.preventDefault();
    
    const expense = {
        id: editingExpenseId || Date.now(),
        category: document.getElementById('expenseCategory').value,
        name: document.getElementById('expenseName').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        date: document.getElementById('expenseDate').value,
        note: document.getElementById('expenseNote').value || ''
    };
    
    if (editingExpenseId) {
        const index = expenses.findIndex(e => e.id === editingExpenseId);
        expenses[index] = expense;
    } else {
        expenses.push(expense);
    }
    
    saveData();
    renderExpenses();
    updateDashboardStats();
    closeExpenseModal();
}

function deleteExpense(id) {
    if (confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) {
        expenses = expenses.filter(e => e.id !== id);
        saveData();
        renderExpenses();
        updateDashboardStats();
    }
}

function renderExpenses() {
    const tbody = document.getElementById('expensesTableBody');
    
    if (!tbody) return;
    
    if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><h3>Chưa có khoản chi nào</h3><p>Hãy thêm khoản chi đầu tiên của bạn</p></td></tr>';
        return;
    }
    
    const categoryLabels = {
        'an-uong': '🍽️ Ăn Uống',
        'di-lai': '🚗 Đi Lại',
        'mua-sam': '🛍️ Mua Sắm',
        'giai-tri': '🎮 Giải Trí',
        'suc-khoe': '💊 Sức Khỏe',
        'hoc-tap': '📚 Học Tập',
        'hoa-don': '💡 Hóa Đơn',
        'khac': '📦 Khác'
    };
    
    const sortedExpenses = [...expenses].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    tbody.innerHTML = sortedExpenses.map((expense, index) => {
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${categoryLabels[expense.category] || expense.category}</td>
                <td><strong>${expense.name}</strong></td>
                <td style="color: #e74c3c; font-weight: 700;">${formatCurrency(expense.amount)}</td>
                <td>${formatDate(expense.date)}</td>
                <td>${expense.note || '-'}</td>
                <td>
                    <button class="btn btn-edit" onclick="openExpenseModal(${expense.id})">Sửa</button>
                    <button class="btn btn-danger" onclick="deleteExpense(${expense.id})">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ========== DASHBOARD ==========

function updateDashboard() {
    const totalDebt = debts.reduce((sum, debt) => sum + (debt.amount - (debt.paid || 0)), 0);
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    
    // Tính % nợ trung bình
    let avgDebtPercent = 0;
    if (debts.length > 0) {
        const totalPercent = debts.reduce((sum, debt) => {
            const remaining = debt.amount - (debt.paid || 0);
            const percent = debt.amount > 0 ? (remaining / debt.amount) * 100 : 0;
            return sum + percent;
        }, 0);
        avgDebtPercent = (totalPercent / debts.length).toFixed(1);
    }
    
    const balance = totalIncome - totalDebt;
    
    document.getElementById('totalDebt').textContent = formatCurrency(totalDebt);
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('avgDebtPercent').textContent = avgDebtPercent + '%';
    document.getElementById('balance').textContent = formatCurrency(balance);
    
    // Thay đổi màu số dư dựa trên giá trị
    const balanceEl = document.getElementById('balance');
    balanceEl.className = 'amount balance';
    if (balance < 0) {
        balanceEl.classList.add('debt');
        balanceEl.classList.remove('balance');
    }
}

// ========== DASHBOARD STATS ==========

function updateDashboardStats() {
    const period = document.getElementById('dashboardPeriod')?.value || 'month';
    const now = new Date();
    let startDate, endDate;
    
    switch(period) {
        case 'week':
            // Tuần này (từ thứ 2 đến chủ nhật)
            const dayOfWeek = now.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Nếu CN thì lùi 6 ngày, nếu không thì tính từ thứ 2
            startDate = new Date(now);
            startDate.setDate(now.getDate() + diff);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
    }
    
    // Lọc dữ liệu theo khoảng thời gian
    const filteredExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= startDate && expenseDate <= endDate;
    });
    
    const filteredIncomes = incomes.filter(i => {
        const incomeDate = new Date(i.month + '-01');
        return incomeDate >= startDate && incomeDate <= endDate;
    });
    
    // Tính tổng
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncomes = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
    const balance = totalIncomes - totalExpenses;
    const totalTransactions = filteredExpenses.length + filteredIncomes.length;
    
    // Cập nhật UI
    const totalExpensesEl = document.getElementById('totalExpenses');
    const totalIncomesEl = document.getElementById('totalIncomes');
    const dashboardBalanceEl = document.getElementById('dashboardBalance');
    const totalTransactionsEl = document.getElementById('totalTransactions');
    
    if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(totalExpenses);
    if (totalIncomesEl) totalIncomesEl.textContent = formatCurrency(totalIncomes);
    if (dashboardBalanceEl) {
        dashboardBalanceEl.textContent = formatCurrency(balance);
        dashboardBalanceEl.className = 'amount balance';
        if (balance < 0) {
            dashboardBalanceEl.classList.add('debt');
            dashboardBalanceEl.classList.remove('balance');
        }
    }
    if (totalTransactionsEl) totalTransactionsEl.textContent = totalTransactions;
    
    // Vẽ biểu đồ
    drawCharts(filteredExpenses, startDate, endDate, period);
    
    // Cập nhật bảng chi tiết
    updateDashboardTable(filteredExpenses, filteredIncomes);
}

function drawCharts(filteredExpenses, startDate, endDate, period) {
    const ctxExpenses = document.getElementById('expensesChart');
    const ctxCategory = document.getElementById('categoryChart');
    
    if (!ctxExpenses || !ctxCategory) return;
    
    // Chuẩn bị dữ liệu theo ngày
    const expensesByDate = {};
    filteredExpenses.forEach(expense => {
        const date = expense.date;
        expensesByDate[date] = (expensesByDate[date] || 0) + expense.amount;
    });
    
    // Sắp xếp ngày
    const sortedDates = Object.keys(expensesByDate).sort();
    const labels = sortedDates.map(d => formatDate(d));
    const data = sortedDates.map(d => expensesByDate[d]);
    
    // Biểu đồ chi tiêu theo ngày
    if (expensesChart) {
        expensesChart.destroy();
    }
    expensesChart = new Chart(ctxExpenses, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Chi Tiêu (đ)',
                data: data,
                borderColor: 'rgb(231, 76, 60)',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
                        }
                    }
                }
            }
        }
    });
    
    // Chuẩn bị dữ liệu theo danh mục
    const categoryLabels = {
        'an-uong': 'Ăn Uống',
        'di-lai': 'Đi Lại',
        'mua-sam': 'Mua Sắm',
        'giai-tri': 'Giải Trí',
        'suc-khoe': 'Sức Khỏe',
        'hoc-tap': 'Học Tập',
        'hoa-don': 'Hóa Đơn',
        'khac': 'Khác'
    };
    
    const expensesByCategory = {};
    filteredExpenses.forEach(expense => {
        const category = categoryLabels[expense.category] || expense.category;
        expensesByCategory[category] = (expensesByCategory[category] || 0) + expense.amount;
    });
    
    const categoryLabelsArray = Object.keys(expensesByCategory);
    const categoryData = categoryLabelsArray.map(cat => expensesByCategory[cat]);
    
    // Màu sắc cho biểu đồ
    const colors = [
        'rgba(231, 76, 60, 0.8)',
        'rgba(52, 152, 219, 0.8)',
        'rgba(46, 204, 113, 0.8)',
        'rgba(241, 196, 15, 0.8)',
        'rgba(155, 89, 182, 0.8)',
        'rgba(230, 126, 34, 0.8)',
        'rgba(26, 188, 156, 0.8)',
        'rgba(149, 165, 166, 0.8)'
    ];
    
    // Biểu đồ chi tiêu theo danh mục
    if (categoryChart) {
        categoryChart.destroy();
    }
    categoryChart = new Chart(ctxCategory, {
        type: 'doughnut',
        data: {
            labels: categoryLabelsArray,
            datasets: [{
                data: categoryData,
                backgroundColor: colors.slice(0, categoryLabelsArray.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': ' + formatCurrency(value) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function updateDashboardTable(filteredExpenses, filteredIncomes) {
    const tbody = document.getElementById('dashboardTableBody');
    if (!tbody) return;
    
    // Kết hợp expenses và incomes
    const transactions = [
        ...filteredExpenses.map(e => ({
            date: e.date,
            type: 'Chi',
            category: e.category,
            description: e.name,
            amount: -e.amount,
            note: e.note
        })),
        ...filteredIncomes.map(i => ({
            date: i.month + '-01',
            type: 'Thu',
            category: i.type === 'monthly' ? 'Thu Nhập Hàng Tháng' : 'Khoản Thu Khác',
            description: i.name,
            amount: i.amount,
            note: i.note
        }))
    ];
    
    // Sắp xếp theo ngày (mới nhất trước)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><h3>Chưa có giao dịch nào trong khoảng thời gian này</h3></td></tr>';
        return;
    }
    
    const categoryLabels = {
        'an-uong': '🍽️ Ăn Uống',
        'di-lai': '🚗 Đi Lại',
        'mua-sam': '🛍️ Mua Sắm',
        'giai-tri': '🎮 Giải Trí',
        'suc-khoe': '💊 Sức Khỏe',
        'hoc-tap': '📚 Học Tập',
        'hoa-don': '💡 Hóa Đơn',
        'khac': '📦 Khác'
    };
    
    tbody.innerHTML = transactions.map(trans => {
        const categoryLabel = categoryLabels[trans.category] || trans.category;
        const amountColor = trans.amount > 0 ? '#27ae60' : '#e74c3c';
        const amountSign = trans.amount > 0 ? '+' : '';
        
        return `
            <tr>
                <td>${formatDate(trans.date)}</td>
                <td><span style="padding: 4px 10px; border-radius: 12px; font-size: 0.85em; font-weight: 600; background: ${trans.type === 'Thu' ? '#d4edda' : '#f8d7da'}; color: ${trans.type === 'Thu' ? '#155724' : '#721c24'};">${trans.type}</span></td>
                <td>${categoryLabel}</td>
                <td>${trans.description}</td>
                <td style="color: ${amountColor}; font-weight: 700;">${amountSign}${formatCurrency(Math.abs(trans.amount))}</td>
            </tr>
        `;
    }).join('');
}

// ========== LƯU TRỮ DỮ LIỆU ==========

function saveData() {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    const data = {
        debts: debts,
        payments: payments,
        incomes: incomes,
        expenses: expenses,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`financeData_${userId}`, JSON.stringify(data));
}

function loadData() {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    const saved = localStorage.getItem(`financeData_${userId}`);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            debts = data.debts || [];
            payments = data.payments || [];
            incomes = data.incomes || [];
            expenses = data.expenses || [];
        } catch (e) {
            console.error('Lỗi khi tải dữ liệu:', e);
        }
    } else {
        // Khởi tạo dữ liệu mới nếu chưa có
        debts = [];
        payments = [];
        incomes = [];
        expenses = [];
    }
}

function exportData() {
    const data = {
        debts: debts,
        payments: payments,
        incomes: incomes,
        expenses: expenses,
        exportedAt: new Date().toISOString()
    };
    
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quanlytaichinh_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Đã xuất dữ liệu thành công!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm('Bạn có chắc chắn muốn nhập dữ liệu này? Dữ liệu hiện tại sẽ bị thay thế.')) {
                debts = data.debts || [];
                payments = data.payments || [];
                incomes = data.incomes || [];
                expenses = data.expenses || [];
                saveData();
                renderDebts();
                renderPayments();
                renderIncomes();
                renderExpenses();
                updateDashboard();
                updateDashboardStats();
                alert('Đã nhập dữ liệu thành công!');
            }
        } catch (error) {
            alert('Lỗi khi đọc file JSON: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ========== UTILITY FUNCTIONS ==========

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                       'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
}

// Đóng modal khi click bên ngoài
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
}

