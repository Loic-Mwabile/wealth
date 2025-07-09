// savings.js 

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

// --- Modal helpers with smooth transition ---
function showModal(modalId) {
  document.querySelectorAll('.modal').forEach(m => {
    m.classList.remove('modal--visible');
    m.style.display = 'none';
  });
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById(modalId);
  if (!overlay || !modal) {
    console.error('Modal elements not found:', { overlay: !!overlay, modal: !!modal });
    return;
  }
  overlay.style.display = 'block';
  modal.style.display = 'flex';
  void modal.offsetWidth;
  setTimeout(() => {
    modal.classList.add('modal--visible');
  }, 10);
}
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.querySelectorAll('.modal').forEach(m => {
    m.classList.remove('modal--visible');
    setTimeout(() => { m.style.display = 'none'; }, 250);
  });
}
if (document.getElementById('modal-overlay')) {
  addTapListener(document.getElementById('modal-overlay'), closeModal);
}

// --- Add Envelope Modal ---
function renderAddEnvelopeModal(onSubmit) {
  const modal = document.getElementById('modal-add-envelope');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Add Savings Envelope</h3>
      <label for="envelope-name">Name</label>
      <input type="text" id="envelope-name" required />
      <label for="envelope-amount">Initial Amount (₹)</label>
      <input type="number" id="envelope-amount" min="0" value="0" required />
      <label for="envelope-goal">Goal (₹)</label>
      <input type="number" id="envelope-goal" min="1" value="100" required />
      <div class="modal-actions">
        <button class="cancel" type="button">Cancel</button>
        <button id="submit-envelope" type="button">Add</button>
      </div>
    </div>
  `;
  addTapListener(modal.querySelector('.cancel'), closeModal);
  addTapListener(modal.querySelector('#submit-envelope'), () => {
    const name = document.getElementById('envelope-name').value.trim();
    const amount = parseFloat(document.getElementById('envelope-amount').value);
    const goal = parseFloat(document.getElementById('envelope-goal').value);
    if (!name) {
      alert('Please enter a name.');
      return;
    }
    if (amount < 0) {
      alert('Amount cannot be negative.');
      return;
    }
    if (!goal || goal < 1) {
      alert('Please enter a valid goal (at least 1).');
      return;
    }
    onSubmit(name, amount, goal);
  });
}

// --- Transfer Modal ---
function renderTransferModal(possessions, savingsArr, onSubmit) {
  const modal = document.getElementById('modal-transfer');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Transfer to Savings</h3>
      <label for="transfer-amount">Amount (₹)</label>
      <input type="number" id="transfer-amount" min="1" max="${possessions}" required />
      <label for="transfer-envelope">Savings Envelope</label>
      <select id="transfer-envelope">
        ${savingsArr.map(s => `<option value="${s.id}">${s.name} (${s.amount} ₹)</option>`).join('')}
      </select>
      <div class="modal-actions">
        <button class="cancel" type="button">Cancel</button>
        <button id="submit-transfer" type="button">Transfer</button>
      </div>
    </div>
  `;
  addTapListener(modal.querySelector('.cancel'), closeModal);
  addTapListener(modal.querySelector('#submit-transfer'), () => {
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    const envelopeId = document.getElementById('transfer-envelope').value;
    if (!amount || amount <= 0 || amount > possessions) {
      alert('Please enter a valid amount.');
      return;
    }
    onSubmit(amount, envelopeId);
  });
}

// --- Withdraw Modal ---
function renderWithdrawModal(savingsArr, onSubmit) {
  const modal = document.getElementById('modal-withdraw');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Withdraw from Savings</h3>
      <label for="withdraw-amount">Amount (₹)</label>
      <input type="number" id="withdraw-amount" min="1" required />
      <label for="withdraw-envelope">Savings Envelope</label>
      <select id="withdraw-envelope">
        ${savingsArr.map(s => `<option value="${s.id}" data-max="${s.amount}">${s.name} (${s.amount} ₹)</option>`).join('')}
      </select>
      <div class="modal-actions">
        <button class="cancel" type="button">Cancel</button>
        <button id="submit-withdraw" type="button">Withdraw</button>
      </div>
    </div>
  `;
  addTapListener(modal.querySelector('.cancel'), closeModal);
  addTapListener(modal.querySelector('#submit-withdraw'), () => {
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    const envelopeId = document.getElementById('withdraw-envelope').value;
    const max = parseFloat(document.querySelector('#withdraw-envelope option:checked').getAttribute('data-max'));
    if (!amount || amount <= 0 || amount > max) {
      alert('Please enter a valid amount (cannot exceed envelope balance).');
      return;
    }
    onSubmit(amount, envelopeId);
  });
}

// --- Savings History Renderer with Advanced Filters and Revert ---
function renderSavingsHistory(history, savingsArr, possessions, userDocRef) {
  const historyDiv = document.getElementById('savings-history');
  if (!history || history.length === 0) {
    historyDiv.innerHTML = '<p>No savings transactions yet.</p>';
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
      <label for="savings-history-filter">Type:</label>
      <select id="savings-history-filter">
        <option value="all">All</option>
        <option value="transfer-in">Transfer In</option>
        <option value="withdraw">Withdraw</option>
        <option value="envelope-add">Envelope Created</option>
      </select>
      <label for="savings-date-from">From:</label>
      <input type="date" id="savings-date-from" value="${dateFrom}">
      <label for="savings-date-to">To:</label>
      <input type="date" id="savings-date-to" value="${dateTo}">
      <label for="savings-min-amount">Min:</label>
      <input type="number" id="savings-min-amount" style="width:80px;" value="${minAmount}">
      <label for="savings-max-amount">Max:</label>
      <input type="number" id="savings-max-amount" style="width:80px;" value="${maxAmount}">
      <button id="savings-filter-reset" style="margin-left:8px;">Reset</button>
    </div>
    <ul id="savings-history-list"></ul>
  `;
  document.getElementById('savings-history-filter').value = filter;
  document.getElementById('savings-history-filter').addEventListener('change', function() {
    historyDiv.setAttribute('data-filter', this.value);
    renderSavingsHistory(history, savingsArr, possessions, userDocRef);
  });
  document.getElementById('savings-date-from').addEventListener('change', function() {
    historyDiv.setAttribute('data-date-from', this.value);
    renderSavingsHistory(history, savingsArr, possessions, userDocRef);
  });
  document.getElementById('savings-date-to').addEventListener('change', function() {
    historyDiv.setAttribute('data-date-to', this.value);
    renderSavingsHistory(history, savingsArr, possessions, userDocRef);
  });
  document.getElementById('savings-min-amount').addEventListener('change', function() {
    historyDiv.setAttribute('data-min-amount', this.value);
    renderSavingsHistory(history, savingsArr, possessions, userDocRef);
  });
  document.getElementById('savings-max-amount').addEventListener('change', function() {
    historyDiv.setAttribute('data-max-amount', this.value);
    renderSavingsHistory(history, savingsArr, possessions, userDocRef);
  });
  addTapListener(document.getElementById('savings-filter-reset'), function() {
    historyDiv.setAttribute('data-filter', 'all');
    historyDiv.setAttribute('data-date-from', '');
    historyDiv.setAttribute('data-date-to', '');
    historyDiv.setAttribute('data-min-amount', '');
    historyDiv.setAttribute('data-max-amount', '');
    renderSavingsHistory(history, savingsArr, possessions, userDocRef);
  });
  // Filtered history
  let filtered = history;
  if (filter !== 'all') filtered = filtered.filter(h => h.type === filter);
  if (dateFrom) filtered = filtered.filter(h => h.date >= dateFrom);
  if (dateTo) filtered = filtered.filter(h => h.date <= dateTo);
  if (minAmount) filtered = filtered.filter(h => h.amount >= parseFloat(minAmount));
  if (maxAmount) filtered = filtered.filter(h => h.amount <= parseFloat(maxAmount));
  const list = document.getElementById('savings-history-list');
  if (!filtered || filtered.length === 0) {
    list.innerHTML = '<li>No transactions for this filter.</li>';
    return;
  }
  list.innerHTML = filtered.slice(-10).reverse().map((item, idx) => {
    let label = '';
    if (item.type === 'transfer-in') {
      label = `<span style='color:#27ae60;'>+${item.amount} ₹</span> to <b>${item.envelope} </b>`;
    } else if (item.type === 'withdraw') {
      label = `<span style='color:#e17055;'>-${item.amount} ₹</span> from <b>${item.envelope} </b>`;
    } else if (item.type === 'envelope-add') {
      label = `<span style='color:#636e72;'>Envelope created: <b>${item.envelope} </b> (${item.amount} ₹)</span>`;
    }
    return `<li>${label} <span style='float:right;color:#636e72;'>${item.date}</span> <button class='revert-btn' data-idx='${history.length-1-idx}'>Revert</button></li>`;
  }).join('');
  // Add event listeners for revert buttons
  Array.from(list.querySelectorAll('.revert-btn')).forEach(btn => {
    addTapListener(btn, async function() {
      const idx = parseInt(btn.getAttribute('data-idx'));
      if (!confirm('Are you sure you want to revert this transaction?')) return;
      await revertSavingsTransaction(history, idx, savingsArr, possessions, userDocRef);
      location.reload();
    });
  });
}

// --- Revert Logic ---
async function revertSavingsTransaction(history, idx, savingsArr, possessions, userDocRef) {
  const tx = history[idx];
  let newSavings = [...savingsArr];
  let newPossessions = possessions;
  if (tx.type === 'transfer-in') {
    // Remove from envelope, add back to possessions
    const sIdx = newSavings.findIndex(s => s.name === tx.envelope);
    if (sIdx !== -1) newSavings[sIdx].amount -= tx.amount;
    newPossessions += tx.amount;
  } else if (tx.type === 'withdraw') {
    // Add back to envelope, remove from possessions
    const sIdx = newSavings.findIndex(s => s.name === tx.envelope);
    if (sIdx !== -1) newSavings[sIdx].amount += tx.amount;
    newPossessions -= tx.amount;
  } else if (tx.type === 'envelope-add') {
    // Remove the envelope and add the initial amount back to possessions
    const env = newSavings.find(s => s.name === tx.envelope);
    if (env) newPossessions += env.amount;
    newSavings = newSavings.filter(s => s.name !== tx.envelope);
  }
  // Remove the reverted transaction from history
  const newHistory = [...history];
  newHistory.splice(idx, 1);
  await userDocRef.update({
    savings: newSavings,
    'possessions.balance': newPossessions,
    savingsHistory: newHistory
  });
}

// --- Render Envelopes as Cards with Progress Bars ---
function renderEnvelopesList(savingsArr) {
  const listDiv = document.getElementById('envelopes-list');
  const filter = document.getElementById('envelope-status-filter')?.value || 'all';
  let filtered = savingsArr;
  if (filter === 'ongoing') {
    filtered = savingsArr.filter(env => (env.amount || 0) < (env.goal || 1));
  } else if (filter === 'completed') {
    filtered = savingsArr.filter(env => (env.amount || 0) >= (env.goal || 1));
  }
  if (filtered.length === 0) {
    listDiv.innerHTML = '<p>No savings envelopes yet.</p>';
    return;
  }
  listDiv.innerHTML = filtered.map(env => {
    const goal = env.goal || 1; // Avoid division by zero
    const percent = Math.min(100, Math.round((env.amount / goal) * 100));
    return `
      <div class="savings-envelope-card">
        <div class="savings-envelope-header">
          <span>${env.name} </span>
          <span>${env.amount} ₹ / ${goal} ₹</span>
        </div>
        <div class="savings-envelope-progress">
          <div class="savings-envelope-progress-bar" style="width:${percent}%;">
            ${percent > 10 ? `<span>${percent}%</span>` : ''}
          </div>
          <div class="savings-envelope-progress-label">${percent}%</div>
        </div>
        <div class="savings-envelope-goal">Goal: ${goal} ₹ (${percent}%)</div>
      </div>
    `;
  }).join('');
}

// Add event listener for the filter
document.getElementById('envelope-status-filter')?.addEventListener('change', function() {
  // You may need to fetch the latest savingsArr from Firestore or keep it in a variable
  const userId = firebase.auth().currentUser?.uid;
  if (!userId) return;
  firebase.firestore().collection('users').doc(userId).get().then(doc => {
    const data = doc.data();
    renderEnvelopesList(data.savings || []);
  });
});

// --- Main Logic ---
protectPage(async function(user) {
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
  if (!document.getElementById('modal-add-envelope')) {
    const m = document.createElement('div');
    m.id = 'modal-add-envelope';
    m.className = 'modal';
    m.style.display = 'none';
    document.body.appendChild(m);
  }
  if (!document.getElementById('modal-transfer')) {
    const m = document.createElement('div');
    m.id = 'modal-transfer';
    m.className = 'modal';
    m.style.display = 'none';
    document.body.appendChild(m);
  }
  if (!document.getElementById('modal-withdraw')) {
    const m = document.createElement('div');
    m.id = 'modal-withdraw';
    m.className = 'modal';
    m.style.display = 'none';
    document.body.appendChild(m);
  }
  if (!document.getElementById('savings-history')) {
    const h = document.createElement('div');
    h.id = 'savings-history';
    document.body.appendChild(h);
  }

  try {
    const doc = await userDocRef.get();
    if (!doc.exists) return;
    const data = doc.data();
    const savingsArr = data.savings || [];
    const possessions = data.possessions?.balance || 0;
    const savingsHistory = data.savingsHistory || [];

    renderEnvelopesList(savingsArr);
    // Set the filter to 'ongoing' if not already set
    const filterSelect = document.getElementById('envelope-status-filter');
    if (filterSelect && !filterSelect.value) filterSelect.value = 'ongoing';
    renderSavingsHistory(savingsHistory, savingsArr, possessions, userDocRef);

    // Add Envelope
    addTapListener(document.getElementById('add-envelope-btn'), function() {
      renderAddEnvelopeModal(async (name, amount, goal) => {
        const id = 'save' + Date.now();
        const newEnvelope = { id, name, amount, goal };
        const newArr = [...savingsArr, newEnvelope];
        const newHistory = [
          ...(savingsHistory || []),
          { type: 'envelope-add', envelope: name, amount, goal, date: new Date().toISOString().slice(0,10) }
        ];
        await userDocRef.update({
          savings: newArr,
          savingsHistory: newHistory
        });
        closeModal();
        location.reload();
      });
      showModal('modal-add-envelope');
    });

    // Transfer
    addTapListener(document.getElementById('transfer-btn'), function() {
      if (savingsArr.length === 0) {
        alert('No envelopes available. Please add an envelope first.');
        return;
      }
      renderTransferModal(possessions, savingsArr, async (amount, envelopeId) => {
        const idx = savingsArr.findIndex(s => s.id === envelopeId);
        if (idx === -1) return;
        savingsArr[idx].amount += amount;
        const newBalance = possessions - amount;
        const newHistory = [
          ...(savingsHistory || []),
          { type: 'transfer-in', envelope: savingsArr[idx].name, amount, date: new Date().toISOString().slice(0,10) }
        ];
        await userDocRef.update({
          'possessions.balance': newBalance,
          savings: savingsArr,
          savingsHistory: newHistory
        });
        closeModal();
        location.reload();
      });
      showModal('modal-transfer');
    });

    // Withdraw
    addTapListener(document.getElementById('withdraw-btn'), function() {
      renderWithdrawModal(savingsArr, async (amount, envelopeId) => {
        const idx = savingsArr.findIndex(s => s.id === envelopeId);
        if (idx === -1) return;
        if (savingsArr[idx].amount < amount) {
          alert('Not enough funds in this envelope.');
          return;
        }
        savingsArr[idx].amount -= amount;
        const newBalance = possessions + amount;
        const newHistory = [
          ...(savingsHistory || []),
          { type: 'withdraw', envelope: savingsArr[idx].name, amount, date: new Date().toISOString().slice(0,10) }
        ];
        await userDocRef.update({
          'possessions.balance': newBalance,
          savings: savingsArr,
          savingsHistory: newHistory
        });
        closeModal();
        location.reload();
      });
      showModal('modal-withdraw');
    });

  } catch (err) {
    alert('Error loading savings: ' + err.message);
  }
}); 


if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App) {
  Capacitor.Plugins.App.addListener('backButton', () => {
    if (window.history.length > 1) {
      window.history.back(); // Go to previous page
    } else {
      Capacitor.Plugins.App.exitApp(); // Close the app
    }
  });
}
