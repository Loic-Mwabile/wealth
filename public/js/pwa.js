// PWA Installation and Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// PWA Install Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show install button if it exists
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', () => {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
        installButton.style.display = 'none';
      });
    });
  }
});

// PWA Update Notification
window.addEventListener('appinstalled', (evt) => {
  console.log('App was installed');
  // Hide install button
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'none';
  }
});

// Check if app is running in standalone mode (installed)
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// Back button handling for PWA and native app
function setupBackButton() {
  // For Capacitor (native app)
  if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.App) {
    Capacitor.Plugins.App.addListener('backButton', () => {
      handleBackButton();
    });
  }
  
  // For PWA - handle browser back button
  window.addEventListener('popstate', (event) => {
    // This will be handled by the browser's default behavior
    // But we can add custom logic here if needed
  });
  
  // For PWA - handle hardware back button on mobile
  if (isStandalone()) {
    // Add custom back button if needed
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', handleBackButton);
    }
  }
}

// Handle back button logic
function handleBackButton() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Define navigation flow
  const navigationFlow = {
    'dashboard.html': 'index.html',
    'possessions.html': 'dashboard.html',
    'savings.html': 'dashboard.html',
    'debts.html': 'dashboard.html',
    'income.html': 'dashboard.html',
    'register.html': 'index.html'
  };
  
  // If we have a previous page in our flow, go there
  if (navigationFlow[currentPage]) {
    window.location.href = navigationFlow[currentPage];
  } else if (window.history.length > 1) {
    // Fallback to browser history
    window.history.back();
  } else {
    // If no history, go to dashboard or login
    if (currentPage === 'index.html') {
      // If on login page and no history, stay here
      return;
    } else {
      window.location.href = 'dashboard.html';
    }
  }
}

// Add install button to pages if not already installed
document.addEventListener('DOMContentLoaded', () => {
  // Setup back button handling
  setupBackButton();
  
  if (!isStandalone() && 'serviceWorker' in navigator) {
    // Create install button if it doesn't exist
    if (!document.getElementById('install-button')) {
      const installButton = document.createElement('button');
      installButton.id = 'install-button';
      installButton.textContent = '📱 Install App';
      installButton.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        padding: 10px 15px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        display: none;
        font-size: 14px;
      `;
      
      installButton.addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
            installButton.style.display = 'none';
          });
        }
      });
      
      document.body.appendChild(installButton);
    }
  }
}); 