// debts.js 

// --- Render Debts as Cards with Progress Bars ---
function renderDebtsList(debtsArr) {
  const listDiv = document.getElementById('debts-list');
  if (debtsArr.length === 0) {
    listDiv.innerHTML = '<p>No debts yet.</p>';
    return;
  }
  listDiv.innerHTML = debtsArr.map(debt => {
    const original = debt.originalAmount || debt.amount || 1;
    const left = debt.amount || 0;
    const paid = Math.max(0, original - left);
    const percent = Math.min(100, Math.round((paid / original) * 100));
    const paidClass = left === 0 ? ' style="opacity:0.6;filter:grayscale(0.7);"' : '';
    return `
      <div class="debt-card"${paidClass}>
        <div class="debt-header">
          <span>${debt.name} </span>
          <span>${left} ₹ / ${original} ₹</span>
        </div>
        <div class="debt-details">
          <span>Due: ${debt.dueDate || 'N/A'} </span>
          <span>${percent}% paid</span>
        </div>
        <div class="debt-progress">
          <div class="debt-progress-bar" style="width:${percent}%;">
            ${percent > 10 ? `<span>${percent}%</span>` : ''}
          </div>
          <div class="debt-progress-label">${percent}%</div>
        </div>
      </div>
    `;
  }).join('');
}

// --- Add Debt Modal ---
function renderAddDebtModal(onSubmit) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <h3>Add Debt</h3>
    <label>Name</label>
    <input type="text" id="debt-name" required />
    <label>Amount (₹)</label>
    <input type="number" id="debt-amount" min="1" required />
    <label>Due Date</label>
    <input type="date" id="debt-due" />
    <div class="modal-actions">
      <button class="cancel" type="button">Cancel</button>
      <button id="submit-debt" type="button">Add</button>
    </div>
  `;
  modal.querySelector('.cancel').onclick = () => {
    document.body.removeChild(modal);
  };
  modal.querySelector('#submit-debt').onclick = () => {
    const name = document.getElementById('debt-name').value.trim();
    const amount = parseFloat(document.getElementById('debt-amount').value);
    const dueDate = document.getElementById('debt-due').value;
    if (!name) {
      alert('Please enter a name.');
      return;
    }
    if (!amount || amount < 1) {
      alert('Please enter a valid amount.');
      return;
    }
    onSubmit(name, amount, dueDate);
    document.body.removeChild(modal);
  };
  document.body.appendChild(modal);
}

// --- Pay Debt Modal ---
function renderPayDebtModal(debtsArr, onSubmit) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <h3>Pay Debt</h3>
    <label>Debt</label>
    <select id="paydebt-select">
      ${debtsArr.filter(d => (d.amount || 0) > 0).map(d => `<option value="${d.id}">${d.name} (${d.amount} ₹ left)</option>`).join('')}
    </select>
    <label>Amount (₹)</label>
    <input type="number" id="paydebt-amount" min="1" required />
    <div class="modal-actions">
      <button class="cancel" type="button">Cancel</button>
      <button id="submit-paydebt" type="button">Pay</button>
    </div>
  `;
  modal.querySelector('.cancel').onclick = () => {
    document.body.removeChild(modal);
  };
  modal.querySelector('#submit-paydebt').onclick = () => {
    const debtId = document.getElementById('paydebt-select').value;
    const amount = parseFloat(document.getElementById('paydebt-amount').value);
    if (!debtId || !amount || amount < 1) {
      alert('Please select a debt and enter a valid amount.');
      return;
    }
    onSubmit(debtId, amount);
    document.body.removeChild(modal);
  };
  document.body.appendChild(modal);
}

// --- Mark as Paid Modal ---
function renderMarkPaidModal(debtsArr, onSubmit) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <h3>Mark Debt as Paid</h3>
    <label>Debt</label>
    <select id="markpaid-select">
      ${debtsArr.filter(d => (d.amount || 0) > 0).map(d => `<option value="${d.id}">${d.name} (${d.amount} ₹ left)</option>`).join('')}
    </select>
    <div class="modal-actions">
      <button class="cancel" type="button">Cancel</button>
      <button id="submit-markpaid" type="button">Mark as Paid</button>
    </div>
  `;
  modal.querySelector('.cancel').onclick = () => {
    document.body.removeChild(modal);
  };
  modal.querySelector('#submit-markpaid').onclick = () => {
    const debtId = document.getElementById('markpaid-select').value;
    if (!debtId) {
      alert('Please select a debt.');
      return;
    }
    onSubmit(debtId);
    document.body.removeChild(modal);
  };
  document.body.appendChild(modal);
}

// --- Debt History Renderer with Advanced Filters and Revert ---
function renderDebtsHistory(history, debtsArr, userDocRef) {
  const historyDiv = document.getElementById('debts-history');
  if (!history || history.length === 0) {
    historyDiv.innerHTML = '<p>No debt transactions yet.</p>';
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
      <label for="debts-history-filter">Type:</label>
      <select id="debts-history-filter">
        <option value="all">All</option>
        <option value="pay">Pay</option>
        <option value="add">Add</option>
        <option value="mark-paid">Mark as Paid</option>
      </select>
      <label for="debts-date-from">From:</label>
      <input type="date" id="debts-date-from" value="${dateFrom}">
      <label for="debts-date-to">To:</label>
      <input type="date" id="debts-date-to" value="${dateTo}">
      <label for="debts-min-amount">Min:</label>
      <input type="number" id="debts-min-amount" style="width:80px;" value="${minAmount}">
      <label for="debts-max-amount">Max:</label>
      <input type="number" id="debts-max-amount" style="width:80px;" value="${maxAmount}">
      <button id="debts-filter-reset" style="margin-left:8px;">Reset</button>
    </div>
    <ul id="debts-history-list"></ul>
  `;
  document.getElementById('debts-history-filter').value = filter;
  document.getElementById('debts-history-filter').onchange = function() {
    historyDiv.setAttribute('data-filter', this.value);
    renderDebtsHistory(history, debtsArr, userDocRef);
  };
  document.getElementById('debts-date-from').onchange = function() {
    historyDiv.setAttribute('data-date-from', this.value);
    renderDebtsHistory(history, debtsArr, userDocRef);
  };
  document.getElementById('debts-date-to').onchange = function() {
    historyDiv.setAttribute('data-date-to', this.value);
    renderDebtsHistory(history, debtsArr, userDocRef);
  };
  document.getElementById('debts-min-amount').onchange = function() {
    historyDiv.setAttribute('data-min-amount', this.value);
    renderDebtsHistory(history, debtsArr, userDocRef);
  };
  document.getElementById('debts-max-amount').onchange = function() {
    historyDiv.setAttribute('data-max-amount', this.value);
    renderDebtsHistory(history, debtsArr, userDocRef);
  };
  document.getElementById('debts-filter-reset').onclick = function() {
    historyDiv.setAttribute('data-filter', 'all');
    historyDiv.setAttribute('data-date-from', '');
    historyDiv.setAttribute('data-date-to', '');
    historyDiv.setAttribute('data-min-amount', '');
    historyDiv.setAttribute('data-max-amount', '');
    renderDebtsHistory(history, debtsArr, userDocRef);
  };
  // Filtered history
  let filtered = history;
  if (filter !== 'all') filtered = filtered.filter(h => h.type === filter);
  if (dateFrom) filtered = filtered.filter(h => h.date >= dateFrom);
  if (dateTo) filtered = filtered.filter(h => h.date <= dateTo);
  if (minAmount) filtered = filtered.filter(h => h.amount >= parseFloat(minAmount));
  if (maxAmount) filtered = filtered.filter(h => h.amount <= parseFloat(maxAmount));
  const list = document.getElementById('debts-history-list');
  if (!filtered || filtered.length === 0) {
    list.innerHTML = '<li>No transactions for this filter.</li>';
    return;
  }
  list.innerHTML = filtered.slice(-10).reverse().map((item, idx) => {
    let label = '';
    if (item.type === 'pay') {
      label = `<span style='color:#27ae60;'>Paid ${item.amount} ₹</span> on <b>${item.debt}</b>`;
    } else if (item.type === 'add') {
      label = `<span style='color:#e17055;'>Added debt <b>${item.debt}</b> (${item.amount} ₹)</span>`;
    } else if (item.type === 'mark-paid') {
      label = `<span style='color:#636e72;'>Marked <b>${item.debt}</b> as paid</span>`;
    }
    return `<li>${label} <span style='float:right;color:#636e72;'>${item.date}</span> <button class='revert-btn' data-idx='${history.length-1-idx}'>Revert</button></li>`;
  }).join('');
  // Add event listeners for revert buttons
  Array.from(list.querySelectorAll('.revert-btn')).forEach(btn => {
    btn.onclick = async function() {
      const idx = parseInt(btn.getAttribute('data-idx'));
      if (!confirm('Are you sure you want to revert this transaction?')) return;
      await revertDebtTransaction(history, idx, debtsArr, userDocRef);
      location.reload();
    };
  });
}

// --- Revert Logic ---
async function revertDebtTransaction(history, idx, debtsArr, userDocRef) {
  const tx = history[idx];
  let newDebts = [...debtsArr];
  if (tx.type === 'pay') {
    // Add the amount back to the debt
    const dIdx = newDebts.findIndex(d => d.name === tx.debt);
    if (dIdx !== -1) newDebts[dIdx].amount += tx.amount;
  } else if (tx.type === 'add') {
    // Remove the debt
    newDebts = newDebts.filter(d => d.name !== tx.debt);
  } else if (tx.type === 'mark-paid') {
    // Mark as unpaid (restore to originalAmount or prompt)
    const dIdx = newDebts.findIndex(d => d.name === tx.debt);
    if (dIdx !== -1) {
      // Try to restore to originalAmount, or prompt
      const orig = newDebts[dIdx].originalAmount || 0;
      if (orig > 0) {
        newDebts[dIdx].amount = orig;
      } else {
        const val = parseFloat(prompt('Enter the amount to restore for this debt:'));
        if (val > 0) newDebts[dIdx].amount = val;
      }
    }
  }
  // Remove the reverted transaction from history
  const newHistory = [...history];
  newHistory.splice(idx, 1);
  await userDocRef.update({ debts: newDebts, debtsHistory: newHistory });
}

// --- Main Logic ---
firebase.auth().onAuthStateChanged(async function(user) {
  if (!user) return;
  const userId = user.uid;
  const userDocRef = firebase.firestore().collection('users').doc(userId);

  try {
    const doc = await userDocRef.get();
    if (!doc.exists) return;
    const data = doc.data();
    const debtsArr = data.debts || [];
    const debtsHistory = data.debtsHistory || [];
    renderDebtsList(debtsArr);
    renderDebtsHistory(debtsHistory, debtsArr, userDocRef);

    // Add Debt
    document.getElementById('add-debt-btn').onclick = function() {
      renderAddDebtModal(async (name, amount, dueDate) => {
        const id = 'debt' + Date.now();
        const newDebt = { id, name, amount, originalAmount: amount, dueDate };
        const newArr = [...debtsArr, newDebt];
        const newHistory = [
          ...(debtsHistory || []),
          { type: 'add', debt: name, amount, date: new Date().toISOString().slice(0,10) }
        ];
        await userDocRef.update({ debts: newArr, debtsHistory: newHistory });
        location.reload();
      });
    };

    // Pay Debt
    document.getElementById('pay-debt-btn').onclick = function() {
      renderPayDebtModal(debtsArr, async (debtId, amount) => {
        const idx = debtsArr.findIndex(d => d.id === debtId);
        if (idx === -1) return;
        if (debtsArr[idx].amount < amount) {
          alert('Not enough debt left to pay this amount.');
          return;
        }
        debtsArr[idx].amount -= amount;
        if (debtsArr[idx].amount < 0) debtsArr[idx].amount = 0;
        const newHistory = [
          ...(debtsHistory || []),
          { type: 'pay', debt: debtsArr[idx].name, amount, date: new Date().toISOString().slice(0,10) }
        ];
        await userDocRef.update({ debts: debtsArr, debtsHistory: newHistory });
        location.reload();
      });
    };

    // Mark as Paid
    document.getElementById('mark-paid-btn').onclick = function() {
      renderMarkPaidModal(debtsArr, async (debtId) => {
        const idx = debtsArr.findIndex(d => d.id === debtId);
        if (idx === -1) return;
        debtsArr[idx].amount = 0;
        const newHistory = [
          ...(debtsHistory || []),
          { type: 'mark-paid', debt: debtsArr[idx].name, date: new Date().toISOString().slice(0,10) }
        ];
        await userDocRef.update({ debts: debtsArr, debtsHistory: newHistory });
        location.reload();
      });
    };

  } catch (err) {
    alert('Error loading debts: ' + err.message);
  }
}); 