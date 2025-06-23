// dashboard.js 

// --- Modal helpers ---
function showModal(modalId) {
  document.getElementById('modal-overlay').style.display = 'block';
  document.getElementById(modalId).style.display = 'flex';
}
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}
document.getElementById('modal-overlay').onclick = closeModal;

// --- Add Income Modal ---
function renderAddIncomeModal(onSubmit) {
  const modal = document.getElementById('modal-add-income');
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
}

// --- Transfer to Savings Modal ---
function renderTransferModal(savingsArr, possessions, onSubmit) {
  const modal = document.getElementById('modal-transfer');
  modal.innerHTML = `
    <h3>Transfer to Savings</h3>
    <label>Amount (₹)</label>
    <input type="number" id="transfer-amount" min="1" max="${possessions}" required />
    <label>Savings Envelope</label>
    <select id="transfer-envelope">
      ${savingsArr.map(s => `<option value="${s.id}">${s.name} (${s.amount} ₹)</option>`).join('')}
    </select>
    <div class="modal-actions">
      <button class="cancel" type="button">Cancel</button>
      <button id="submit-transfer" type="button">Transfer</button>
    </div>
  `;
  modal.querySelector('.cancel').onclick = closeModal;
  modal.querySelector('#submit-transfer').onclick = () => {
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    const envelopeId = document.getElementById('transfer-envelope').value;
    if (!amount || amount <= 0 || amount > possessions) {
      alert('Please enter a valid amount.');
      return;
    }
    onSubmit(amount, envelopeId);
  };
}

// --- Pay Debt Modal ---
function renderPayDebtModal(debtsArr, possessions, onSubmit) {
  const modal = document.getElementById('modal-pay-debt');
  modal.innerHTML = `
    <h3>Pay Debt</h3>
    <label>Amount (₹)</label>
    <input type="number" id="paydebt-amount" min="1" max="${possessions}" required />
    <label>Debt</label>
    <select id="paydebt-envelope">
      ${debtsArr.map(d => `<option value="${d.id}">${d.name} (${d.amount} ₹, Due: ${d.dueDate || 'N/A'})</option>`).join('')}
    </select>
    <div class="modal-actions">
      <button class="cancel" type="button">Cancel</button>
      <button id="submit-paydebt" type="button">Pay</button>
    </div>
  `;
  modal.querySelector('.cancel').onclick = closeModal;
  modal.querySelector('#submit-paydebt').onclick = () => {
    const amount = parseFloat(document.getElementById('paydebt-amount').value);
    const envelopeId = document.getElementById('paydebt-envelope').value;
    if (!amount || amount <= 0 || amount > possessions) {
      alert('Please enter a valid amount.');
      return;
    }
    onSubmit(amount, envelopeId);
  };
}

// --- Add Expense Modal ---
function renderAddExpenseModal(possessions, onSubmit) {
  const modal = document.getElementById('modal-add-expense');
  modal.innerHTML = `
    <h3>Add Expense</h3>
    <label>Amount (₹)</label>
    <input type="number" id="expense-amount" min="1" max="${possessions}" required />
    <label>Category</label>
    <input type="text" id="expense-category" placeholder="e.g. Food, Rent, Transport" />
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
    const category = document.getElementById('expense-category').value || 'General';
    const desc = document.getElementById('expense-desc').value || '';
    if (!amount || amount <= 0 || amount > possessions) {
      alert('Please enter a valid amount.');
      return;
    }
    onSubmit(amount, category, desc);
  };
}

// Wait for Firebase Auth to get the current user
firebase.auth().onAuthStateChanged(async function(user) {
  if (!user) return;
  const userId = user.uid;
  const userDocRef = firebase.firestore().collection('users').doc(userId);

  // Fetch user data from Firestore
  try {
    const doc = await userDocRef.get();
    if (!doc.exists) return;
    const data = doc.data();

    // Calculate totals
    const possessions = data.possessions?.balance || 0;
    const savings = (data.savings || []).reduce((sum, s) => sum + (s.amount || 0), 0);
    const debts = (data.debts || []).reduce((sum, d) => sum + (d.amount || 0), 0);
    const netWorth = possessions + savings - debts;
    const expenses = (data.possessions?.history || []).filter(h => h.type === 'expense').reduce((sum, e) => sum + (e.amount || 0), 0);

    // Display values in rupees
    document.getElementById('possessions-total').textContent = possessions + ' ₹';
    document.getElementById('savings-total').textContent = savings + ' ₹';
    document.getElementById('debts-total').textContent = debts + ' ₹';
    document.getElementById('net-worth').textContent = netWorth + ' ₹';
    document.getElementById('expenses-total').textContent = expenses + ' ₹';

    // --- Add Income Modal Logic ---
    document.getElementById('add-income-btn').onclick = function() {
      renderAddIncomeModal(async (amount, source) => {
        // Add to possessions balance and history
        const newBalance = possessions + amount;
        const newHistory = [
          ...(data.possessions?.history || []),
          { type: 'income', source, amount, date: new Date().toISOString().slice(0,10) }
        ];
        await userDocRef.update({
          'possessions.balance': newBalance,
          'possessions.history': newHistory
        });
        closeModal();
        location.reload();
      });
      showModal('modal-add-income');
    };

    // --- Transfer to Savings Modal Logic ---
    document.getElementById('transfer-btn').onclick = function() {
      let savingsArr = data.savings || [];
      if (savingsArr.length === 0) {
        savingsArr = [{ id: 'save001', name: 'General', amount: 0 }];
      }
      renderTransferModal(savingsArr, possessions, async (amount, envelopeId) => {
        // Find the selected envelope
        const idx = savingsArr.findIndex(s => s.id === envelopeId);
        if (idx === -1) return;
        savingsArr[idx].amount += amount;
        const newBalance = possessions - amount;
        await userDocRef.update({
          'possessions.balance': newBalance,
          savings: savingsArr
        });
        closeModal();
        location.reload();
      });
      showModal('modal-transfer');
    };

    // --- Pay Debt Modal Logic ---
    document.getElementById('pay-debt-btn').onclick = function() {
      let debtsArr = data.debts || [];
      if (debtsArr.length === 0) {
        alert('No debts to pay!');
        return;
      }
      renderPayDebtModal(debtsArr, possessions, async (amount, envelopeId) => {
        // Find the selected debt
        const idx = debtsArr.findIndex(d => d.id === envelopeId);
        if (idx === -1) return;
        debtsArr[idx].amount -= amount;
        if (debtsArr[idx].amount < 0) debtsArr[idx].amount = 0;
        const newBalance = possessions - amount;
        await userDocRef.update({
          'possessions.balance': newBalance,
          debts: debtsArr
        });
        closeModal();
        location.reload();
      });
      showModal('modal-pay-debt');
    };

    // --- Add Expense Modal Logic ---
    document.getElementById('add-expense-btn').onclick = function() {
      renderAddExpenseModal(possessions, async (amount, category, desc) => {
        const newBalance = possessions - amount;
        const newHistory = [
          ...(data.possessions?.history || []),
          { type: 'expense', category, description: desc, amount, date: new Date().toISOString().slice(0,10) }
        ];
        await userDocRef.update({
          'possessions.balance': newBalance,
          'possessions.history': newHistory
        });
        closeModal();
        location.reload();
      });
      showModal('modal-add-expense');
    };

    // --- Transaction History Display ---
    const historyList = document.getElementById('history-list');
    const history = (data.possessions?.history || []).slice(-5).reverse();
    if (history.length === 0) {
      historyList.innerHTML = '<li>No recent activity.</li>';
    } else {
      historyList.innerHTML = history.map(item => {
        let label = '';
        if (item.type === 'income') {
          label = `<span style='color:#27ae60;'>+${item.amount} ₹</span> from <b>${item.source}</b>`;
        } else if (item.type === 'expense') {
          label = `<span style='color:#e17055;'>-${item.amount} ₹</span> for <b>${item.category}</b> ${item.description ? '( ' + item.description + ' )' : ''}`;
        } else {
          label = `${item.type} ${item.amount} ₹`;
        }
        return `<li>${label} <span style='float:right;color:#636e72;'>${item.date}</span></li>`;
      }).join('');
    }

    // --- Card Navigation ---
    const savingsCard = document.getElementById('savings-card');
    if (savingsCard) {
      savingsCard.onclick = function() {
        window.location.href = 'savings.html';
      };
    }
    const debtsCard = document.getElementById('debts-card');
    if (debtsCard) {
      debtsCard.onclick = function() {
        window.location.href = 'debts.html';
      };
    }
    const possessionsCard = document.getElementById('possessions-card');
    if (possessionsCard) {
      possessionsCard.onclick = function() {
        window.location.href = 'possessions.html';
      };
    }

  } catch (err) {
    alert('Error loading dashboard: ' + err.message);
  }
}); 