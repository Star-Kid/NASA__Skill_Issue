document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');

  function openAuthModal(signupMode) {
    const authModal = document.getElementById('authModal');
    if (!authModal) return;
    // Set signup mode and update modal UI accordingly
    window.isSignup = !!signupMode;
    updateAuthModal();
    authModal.style.display = 'block';
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', () => openAuthModal(false));
  }
  if (signupBtn) {
    signupBtn.addEventListener('click', () => openAuthModal(true));
  }
});
