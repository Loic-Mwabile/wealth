// debts.js 
function showModal(modalId) {
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById(modalId).style.display = 'flex';
}
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}
// --- Render Debts as Cards with Progress Bars ---
function renderDebtsList(debtsArr) {
  const listDiv = document.getElementById('debts-list');
  const filter = document.getElementById('debt-status-filter')?.value || 'all';
  let filtered = debtsArr;
  if (filter === 'ongoing') {
    filtered = debtsArr.filter(debt => (debt.amount || 0) > 0);
  } else if (filter === 'completed') {
    filtered = debtsArr.filter(debt => (debt.amount || 0) === 0);
  }
  if (filtered.length === 0) {
    listDiv.innerHTML = '<p>No debts yet.</p>';
    return;
  }
  listDiv.innerHTML = filtered.map(debt => {
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

// Utility to add a robust tap/click listener
function addTapListener(element, handler) {
  let startX, startY, isScrolling;

  element.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    isScrolling = false;
  }, { passive: true });

  element.addEventListener('pointermove', (e) => {
    if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
      isScrolling = true;
    }
  }, { passive: true });

  element.addEventListener('pointerup', (e) => {
    if (!isScrolling && e.button === 0) {
      handler(e);
    }
  });
}

// --- Add Debt Modal ---
function renderAddDebtModal(onSubmit) {
  const modal = document.getElementById('modal-add-debt');
  modal.innerHTML = `
    <div class="modal-content">
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
    </div>
  `;
  addTapListener(modal.querySelector('.cancel'), closeModal);
  addTapListener(modal.querySelector('#submit-debt'), () => {
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
    closeModal();
  });
}

// --- Pay Debt Modal ---
function renderPayDebtModal(debtsArr, possessions, onSubmit) {
  const modal = document.getElementById('modal-pay-debt');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Pay Debt</h3>
      <label>Amount (₹)</label>
      <input type="number" id="paydebt-amount" min="1" max="${possessions}" required />
      <label>From Debt</label>
      <select id="paydebt-envelope">
        ${debtsArr.map(d => `<option value="${d.id}">${d.name} (${d.amount} ₹)</option>`).join('')}
      </select>
      <div class="modal-actions">
        <button class="cancel" type="button">Cancel</button>
        <button id="submit-paydebt" type="button">Pay</button>
      </div>
    </div>
  `;
  addTapListener(modal.querySelector('.cancel'), closeModal);
  addTapListener(modal.querySelector('#submit-paydebt'), () => {
    const debtId = document.getElementById('paydebt-envelope').value;
    const amount = parseFloat(document.getElementById('paydebt-amount').value);
    if (!debtId || !amount || amount < 1) {
      alert('Please select a debt and enter a valid amount.');
      return;
    }
    onSubmit(debtId, amount);
    closeModal();
  });
}

// --- Mark as Paid Modal ---
function renderMarkPaidModal(debtsArr, onSubmit) {
  const modal = document.getElementById('modal-mark-paid');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Mark Debt as Paid</h3>
      <label>Select Debt</label>
      <select id="markpaid-envelope">
        ${debtsArr.map(d => `<option value="${d.id}">${d.name} (${d.amount} ₹)</option>`).join('')}
      </select>
      <div class="modal-actions">
        <button class="cancel" type="button">Cancel</button>
        <button id="submit-markpaid" type="button">Mark as Paid</button>
      </div>
    </div>
  `;
  addTapListener(modal.querySelector('.cancel'), closeModal);
  addTapListener(modal.querySelector('#submit-markpaid'), () => {
    const debtId = document.getElementById('markpaid-envelope').value;
    if (!debtId) {
      alert('Please select a debt.');
      return;
    }
    onSubmit(debtId);
    closeModal();
  });
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
  document.getElementById('debts-history-filter').addEventListener('change', function() {
    historyDiv.setAttribute('data-filter', this.value);
    renderDebtsHistory(history, debtsArr, userDocRef);
  });
  document.getElementById('debts-date-from').addEventListener('change', function() {
    historyDiv.setAttribute('data-date-from', this.value);
    renderDebtsHistory(history, debtsArr, userDocRef);
  });
  document.getElementById('debts-date-to').addEventListener('change', function() {
    historyDiv.setAttribute('data-date-to', this.value);
    renderDebtsHistory(history, debtsArr, userDocRef);
  });
  document.getElementById('debts-min-amount').addEventListener('change', function() {
    historyDiv.setAttribute('data-min-amount', this.value);
    renderDebtsHistory(history, debtsArr, userDocRef);
  });
  document.getElementById('debts-max-amount').addEventListener('change', function() {
    historyDiv.setAttribute('data-max-amount', this.value);
    renderDebtsHistory(history, debtsArr, userDocRef);
  });
  addTapListener(document.getElementById('debts-filter-reset'), function() {
    historyDiv.setAttribute('data-filter', 'all');
    historyDiv.setAttribute('data-date-from', '');
    historyDiv.setAttribute('data-date-to', '');
    historyDiv.setAttribute('data-min-amount', '');
    historyDiv.setAttribute('data-max-amount', '');
    renderDebtsHistory(history, debtsArr, userDocRef);
  });
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
    addTapListener(btn, async function() {
      const idx = parseInt(btn.getAttribute('data-idx'));
      if (!confirm('Are you sure you want to revert this transaction?')) return;
      await revertDebtTransaction(history, idx, debtsArr, userDocRef);
      location.reload();
    });
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
    // Also add the amount back to possessions
    const doc = await userDocRef.get();
    const data = doc.data();
    const possessions = (data.possessions?.balance || 0) + tx.amount;
    await userDocRef.update({ 'possessions.balance': possessions });
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
protectPage(async function(user) {
  // All page logic goes here
  const userId = user.uid;
  const userDocRef = firebase.firestore().collection('users').doc(userId);

  try {
    const doc = await userDocRef.get();
    if (!doc.exists) return;
    const data = doc.data();
    const debtsArr = data.debts || [];
    const debtsHistory = data.debtsHistory || [];

    renderDebtsList(debtsArr);
    // Set the filter to 'ongoing' if not already set
    const filterSelect = document.getElementById('debt-status-filter');
    if (filterSelect && !filterSelect.value) filterSelect.value = 'ongoing';
    renderDebtsHistory(debtsHistory, debtsArr, userDocRef);

    // Add Debt
    addTapListener(document.getElementById('add-debt-btn'), function() {
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
      showModal('modal-add-debt');
    });

    // Pay Debt
    addTapListener(document.getElementById('pay-debt-btn'), function() {
      renderPayDebtModal(debtsArr, data.possessions?.balance || 0, async (debtId, amount) => {
        const idx = debtsArr.findIndex(d => d.id === debtId);
        if (idx === -1) return;
        if (debtsArr[idx].amount < amount) {
          alert('Not enough debt left to pay this amount.');
          return;
        }
        if ((data.possessions?.balance || 0) < amount) {
          alert('Not enough possessions to pay this debt.');
          return;
        }
        debtsArr[idx].amount -= amount;
        if (debtsArr[idx].amount < 0) debtsArr[idx].amount = 0;
        const newPossessions = (data.possessions?.balance || 0) - amount;
        const newHistory = [
          ...(debtsHistory || []),
          { type: 'pay', debt: debtsArr[idx].name, amount, date: new Date().toISOString().slice(0,10) }
        ];
        await userDocRef.update({
          debts: debtsArr,
          debtsHistory: newHistory,
          'possessions.balance': newPossessions
        });
        location.reload();
      });
      showModal('modal-pay-debt');
    });

    // Mark as Paid
    addTapListener(document.getElementById('mark-paid-btn'), function() {
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
      showModal('modal-mark-paid');
    });

  } catch (err) {
    alert('Error loading debts: ' + err.message);
  }
});

if (document.getElementById('modal-overlay')) {
  addTapListener(document.getElementById('modal-overlay'), closeModal);
}

// Add event listener for the filter
document.getElementById('debt-status-filter')?.addEventListener('change', function() {
  const userId = firebase.auth().currentUser?.uid;
  if (!userId) return;
  firebase.firestore().collection('users').doc(userId).get().then(doc => {
    const data = doc.data();
    renderDebtsList(data.debts || []);
  });
}); 