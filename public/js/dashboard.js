// dashboard.js 


// Add both click and touchstart for mobile support
document.querySelectorAll('.clickable-card').forEach(card => {
  addTapListener(card, handleCardClick);
});

function handleCardClick(e) {
  const id = e.currentTarget.id;
  if (id === 'possessions-card') window.location.href = 'possessions.html';
  if (id === 'savings-card') window.location.href = 'savings.html';
  if (id === 'debts-card') window.location.href = 'debts.html';
}



// --- Modal helpers with smooth transition ---
function showModal(modalId) {
  // Hide all modals first
  document.querySelectorAll('.modal').forEach(m => {
    m.classList.remove('modal--visible');
    m.style.display = 'none';
  });
  // Show overlay and the requested modal
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById(modalId);

  if (!overlay || !modal) {
    console.error('Modal elements not found:', { overlay: !!overlay, modal: !!modal });
    return;
  }

  overlay.style.display = 'block';
  modal.style.display = 'flex';
  // Force reflow for transition
  void modal.offsetWidth;
  modal.classList.add('modal--visible');
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.querySelectorAll('.modal').forEach(m => {
    m.classList.remove('modal--visible');
    // Wait for transition to finish before hiding
    setTimeout(() => { m.style.display = 'none'; }, 250);
  });
}

addTapListener(document.getElementById('modal-overlay'), closeModal);

// --- Add Income Modal ---
function renderAddIncomeModal(onSubmit) {
  const modal = document.getElementById('modal-add-income');
  
  const modalContent = `
    <div class="modal-content">
      <h3>Add Income</h3>
      <label for="income-amount">Amount (₹)</label>
      <input type="number" id="income-amount" min="1" required />
      <label for="income-source">Source</label>
      <input type="text" id="income-source" placeholder="e.g. Salary, Freelance" />
      <div class="modal-actions">
        <button class="cancel" type="button">Cancel</button>
        <button id="submit-income" type="button">Add</button>
      </div>
    </div>
  `;
  
  modal.innerHTML = modalContent;
  
  addTapListener(modal.querySelector('.cancel'), closeModal);
  addTapListener(modal.querySelector('#submit-income'), () => {
    const amount = parseFloat(document.getElementById('income-amount').value);
    const source = document.getElementById('income-source').value || 'Manual';
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    onSubmit(amount, source);
  });
}

// --- Transfer to Savings Modal ---
function renderTransferModal(savingsArr, possessions, onSubmit) {
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

// --- Pay Debt Modal ---
function renderPayDebtModal(debtsArr, possessions, onSubmit) {
  const modal = document.getElementById('modal-pay-debt');
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Pay Debt</h3>
      <label for="paydebt-amount">Amount (₹)</label>
      <input type="number" id="paydebt-amount" min="1" max="${possessions}" required />
      <label for="paydebt-envelope">Debt</label>
      <select id="paydebt-envelope">
        ${debtsArr.map(d => `<option value="${d.id}">${d.name} (${d.amount} ₹, Due: ${d.dueDate || 'N/A'})</option>`).join('')}
      </select>
      <div class="modal-actions">
        <button class="cancel" type="button">Cancel</button>
        <button id="submit-paydebt" type="button">Pay</button>
      </div>
    </div>
  `;
  addTapListener(modal.querySelector('.cancel'), closeModal);
  addTapListener(modal.querySelector('#submit-paydebt'), () => {
    const amount = parseFloat(document.getElementById('paydebt-amount').value);
    const envelopeId = document.getElementById('paydebt-envelope').value;
    if (!amount || amount <= 0 || amount > possessions) {
      alert('Please enter a valid amount.');
      return;
    }
    onSubmit(amount, envelopeId);
  });
}

// --- Add Expense Modal ---
// This function will be removed.

protectPage(async function(user) {
  // All dashboard logic goes here
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

    // Display values in rupees
    document.getElementById('possessions-total').textContent = possessions + ' ₹';
    document.getElementById('savings-total').textContent = savings + ' ₹';
    document.getElementById('debts-total').textContent = debts + ' ₹';
    document.getElementById('net-worth-value').textContent = netWorth + ' ₹';

    // --- Add Income Modal Logic ---
    addTapListener(document.getElementById('add-income-btn'), function() {
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
    });

    // --- Transfer to Savings Modal Logic ---
    addTapListener(document.getElementById('transfer-btn'), function() {
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
        // Fetch and update savingsHistory
        const doc = await userDocRef.get();
        const data = doc.data();
        const savingsHistory = data.savingsHistory || [];
        const envelopeName = savingsArr[idx].name;
        const newHistory = [
          ...savingsHistory,
          { type: 'transfer-in', envelope: envelopeName, amount, date: new Date().toISOString().slice(0,10) }
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

    // --- Pay Debt Modal Logic ---
    addTapListener(document.getElementById('pay-debt-btn'), function() {
      let debtsArr = data.debts || [];
      if (debtsArr.length === 0) {
        alert('No debts to pay!');
        return;
      }
      renderPayDebtModal(debtsArr, possessions, async (amount, envelopeId) => {
        const idx = debtsArr.findIndex(d => d.id === envelopeId);
        if (idx === -1) return;
        debtsArr[idx].amount -= amount;
        if (debtsArr[idx].amount < 0) debtsArr[idx].amount = 0;
        const newBalance = possessions - amount;
        // Fetch and update debtsHistory
        const doc = await userDocRef.get();
        const data = doc.data();
        const debtsHistory = data.debtsHistory || [];
        const newHistory = [
          ...debtsHistory,
          { type: 'pay', debt: debtsArr[idx].name, amount, date: new Date().toISOString().slice(0,10) }
        ];
        await userDocRef.update({
          'possessions.balance': newBalance,
          debts: debtsArr,
          debtsHistory: newHistory
        });
        closeModal();
        location.reload();
      });
      showModal('modal-pay-debt');
    });


    
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

  } catch (err) {
    alert('Error loading dashboard: ' + err.message);
  }
});

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


if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App) {
  Capacitor.Plugins.App.addListener('backButton', () => {
    if (window.history.length > 1) {
      window.history.back(); // Go to previous page
    } else {
      Capacitor.Plugins.App.exitApp(); // Close the app
    }
  });
}

// --- User info and logout ---
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('logout-btn').addEventListener('click', function() {
    firebase.auth().signOut().then(function() {
      window.location.href = 'index.html';
    });
  });
});
