// possessions.js 

// --- Modal helpers ---
function showModal(modalId) {
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById(modalId).style.display = 'flex';
}
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

// --- Add Income Modal ---
function renderAddIncomeModal(onSubmit) {
  let modal = document.getElementById('modal-add-income');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-add-income';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <h3>Add Income</h3>
    <label>Amount (₹)</label>
    <input type="number" id="income-amount" min="1" required />
    <label>Source</label>
    <input type="text" id="income-source" placeholder="e.g. Salary, Freelance" />
    <div class="modal-actions">
      <button class="cancel" type="button">Cancel</button>
      <button id="submit-income" type="button">Add</button>
    </div>
  `;
  modal.querySelector('.cancel').onclick = closeModal;
  modal.querySelector('#submit-income').onclick = () => {
    const amount = parseFloat(document.getElementById('income-amount').value);
    const source = document.getElementById('income-source').value || 'Manual';
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    onSubmit(amount, source);
  };
  showModal('modal-add-income');
}

// --- Add Expense Modal ---
function renderAddExpenseModal(onSubmit) {
  let modal = document.getElementById('modal-add-expense');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-add-expense';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <h3>Add Expense</h3>
    <label>Amount (₹)</label>
    <input type="number" id="expense-amount" min="1" required />
    <label>Category</label>
    <select id="expense-category">
      <option value="Food">Food</option>
      <option value="Rent">Rent</option>
      <option value="Transport">Transport</option>
      <option value="Shopping">Shopping</option>
      <option value="Other">Other</option>
    </select>
    <input type="text" id="expense-category-custom" placeholder="Or enter custom category" />
    <label>Description</label>
    <input type="text" id="expense-desc" placeholder="Optional description" />
    <div class="modal-actions">
      <button class="cancel" type="button">Cancel</button>
      <button id="submit-expense" type="button">Add</button>
    </div>
  `;
  modal.querySelector('.cancel').onclick = closeModal;
  modal.querySelector('#submit-expense').onclick = () => {
    const amount = parseFloat(document.getElementById('expense-amount').value);
    let category = document.getElementById('expense-category').value;
    const custom = document.getElementById('expense-category-custom').value.trim();
    if (custom) category = custom;
    const desc = document.getElementById('expense-desc').value || '';
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    onSubmit(amount, category, desc);
  };
  showModal('modal-add-expense');
}

// --- Possessions History Renderer with Advanced Filters and Revert ---
function renderPossessionsHistory(history, possessions, userDocRef) {
  const historyDiv = document.getElementById('possessions-history');
  if (!history || history.length === 0) {
    historyDiv.innerHTML = '<p>No transactions yet.</p>';
    return;
  }
  // Filter UI
  let filter = historyDiv.getAttribute('data-filter') || 'all';
  let dateFrom = historyDiv.getAttribute('data-date-from') || '';
  let dateTo = historyDiv.getAttribute('data-date-to') || '';
  let minAmount = historyDiv.getAttribute('data-min-amount') || '';
  let maxAmount = historyDiv.getAttribute('data-max-amount') || '';
  historyDiv.innerHTML = `
    <div style="margin-bottom:12px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
      <label for="possessions-history-filter">Type:</label>
      <select id="possessions-history-filter">
        <option value="all">All</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <label for="possessions-date-from">From:</label>
      <input type="date" id="possessions-date-from" value="${dateFrom}">
      <label for="possessions-date-to">To:</label>
      <input type="date" id="possessions-date-to" value="${dateTo}">
      <label for="possessions-min-amount">Min:</label>
      <input type="number" id="possessions-min-amount" style="width:80px;" value="${minAmount}">
      <label for="possessions-max-amount">Max:</label>
      <input type="number" id="possessions-max-amount" style="width:80px;" value="${maxAmount}">
      <button id="possessions-filter-reset" style="margin-left:8px;">Reset</button>
    </div>
    <ul id="possessions-history-list"></ul>
  `;
  document.getElementById('possessions-history-filter').value = filter;
  document.getElementById('possessions-history-filter').onchange = function() {
    historyDiv.setAttribute('data-filter', this.value);
    renderPossessionsHistory(history, possessions, userDocRef);
  };
  document.getElementById('possessions-date-from').onchange = function() {
    historyDiv.setAttribute('data-date-from', this.value);
    renderPossessionsHistory(history, possessions, userDocRef);
  };
  document.getElementById('possessions-date-to').onchange = function() {
    historyDiv.setAttribute('data-date-to', this.value);
    renderPossessionsHistory(history, possessions, userDocRef);
  };
  document.getElementById('possessions-min-amount').onchange = function() {
    historyDiv.setAttribute('data-min-amount', this.value);
    renderPossessionsHistory(history, possessions, userDocRef);
  };
  document.getElementById('possessions-max-amount').onchange = function() {
    historyDiv.setAttribute('data-max-amount', this.value);
    renderPossessionsHistory(history, possessions, userDocRef);
  };
  document.getElementById('possessions-filter-reset').onclick = function() {
    historyDiv.setAttribute('data-filter', 'all');
    historyDiv.setAttribute('data-date-from', '');
    historyDiv.setAttribute('data-date-to', '');
    historyDiv.setAttribute('data-min-amount', '');
    historyDiv.setAttribute('data-max-amount', '');
    renderPossessionsHistory(history, possessions, userDocRef);
  };
  // Filtered history
  let filtered = history;
  if (filter !== 'all') filtered = filtered.filter(h => h.type === filter);
  if (dateFrom) filtered = filtered.filter(h => h.date >= dateFrom);
  if (dateTo) filtered = filtered.filter(h => h.date <= dateTo);
  if (minAmount) filtered = filtered.filter(h => h.amount >= parseFloat(minAmount));
  if (maxAmount) filtered = filtered.filter(h => h.amount <= parseFloat(maxAmount));
  const list = document.getElementById('possessions-history-list');
  if (!filtered || filtered.length === 0) {
    list.innerHTML = '<li>No transactions for this filter.</li>';
    return;
  }
  list.innerHTML = filtered.slice(-10).reverse().map((item, idx) => {
    let label = '';
    if (item.type === 'income') {
      label = `<span style='color:#27ae60;'>+${item.amount} ₹</span> from <b>${item.source}</b>`;
    } else if (item.type === 'expense') {
      label = `<span style='color:#e17055;'>-${item.amount} ₹</span> for <b>${item.category}</b> ${item.description ? '( ' + item.description + ' )' : ''}`;
    }
    return `<li>${label} <span style='float:right;color:#636e72;'>${item.date}</span> <button class='revert-btn' data-idx='${history.length-1-idx}'>Revert</button></li>`;
  }).join('');
  // Add event listeners for revert buttons
  Array.from(list.querySelectorAll('.revert-btn')).forEach(btn => {
    btn.onclick = async function() {
      const idx = parseInt(btn.getAttribute('data-idx'));
      if (!confirm('Are you sure you want to revert this transaction?')) return;
      await revertPossessionsTransaction(history, idx, possessions, userDocRef);
      location.reload();
    };
  });
}

// --- Revert Logic ---
async function revertPossessionsTransaction(history, idx, possessions, userDocRef) {
  const tx = history[idx];
  let newBalance = possessions;
  if (tx.type === 'income') {
    newBalance -= tx.amount;
  } else if (tx.type === 'expense') {
    newBalance += tx.amount;
  }
  // Remove the reverted transaction from history
  const newHistory = [...history];
  newHistory.splice(idx, 1);
  await userDocRef.update({ 'possessions.balance': newBalance, 'possessions.history': newHistory });
}

// --- Main Logic ---
firebase.auth().onAuthStateChanged(async function(user) {
  if (!user) return;
  const userId = user.uid;
  const userDocRef = firebase.firestore().collection('users').doc(userId);

  // Ensure modals exist
  if (!document.getElementById('modal-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
  }

  try {
    const doc = await userDocRef.get();
    if (!doc.exists) return;
    const data = doc.data();
    const possessions = data.possessions?.balance || 0;
    const history = data.possessions?.history || [];
    document.getElementById('possessions-balance').textContent = `Balance: ${possessions} ₹`;
    renderPossessionsHistory(history, possessions, userDocRef);

    // Add Income
    document.getElementById('add-income-btn').onclick = function() {
      renderAddIncomeModal(async (amount, source) => {
        const newBalance = possessions + amount;
        const newHistory = [
          ...(history || []),
          { type: 'income', source, amount, date: new Date().toISOString().slice(0,10) }
        ];
        await userDocRef.update({
          'possessions.balance': newBalance,
          'possessions.history': newHistory
        });
        closeModal();
        location.reload();
      });
    };

    // Add Expense
    document.getElementById('add-expense-btn').onclick = function() {
      renderAddExpenseModal(async (amount, category, desc) => {
        const newBalance = possessions - amount;
        const newHistory = [
          ...(history || []),
          { type: 'expense', category, description: desc, amount, date: new Date().toISOString().slice(0,10) }
        ];
        await userDocRef.update({
          'possessions.balance': newBalance,
          'possessions.history': newHistory
        });
        closeModal();
        location.reload();
      });
    };

  } catch (err) {
    alert('Error loading possessions: ' + err.message);
  }
}); 