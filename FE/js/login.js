/* ==========================================================================
   Login Page Logic (js/login.js)
   Handles authentication, UI feedback, and session storage
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('usernameInput');
  const passwordInput = document.getElementById('passwordInput');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const loginAlert = document.getElementById('loginAlert');
  const alertText = document.getElementById('alertText');
  const submitBtn = document.getElementById('submitBtn');

  // Khôi phục tài khoản nếu trước đó đã chọn "Ghi nhớ"
  const savedUser = localStorage.getItem('REMEMBERED_USER');
  if (savedUser && usernameInput) {
    usernameInput.value = savedUser;
    const rememberMe = document.getElementById('rememberMe');
    if (rememberMe) rememberMe.checked = true;
  }

  // Toggle ẩn/hiện mật khẩu
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePasswordBtn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    });
  }

  // Tự động điền tài khoản mẫu khi click vào gợi ý
  window.fillDemoAccount = function(user, pass) {
    if (usernameInput) usernameInput.value = user;
    if (passwordInput) passwordInput.value = pass;
    if (loginAlert) loginAlert.classList.remove('show');
  };

  // Hiển thị thông báo lỗi
  function showError(msg) {
    if (alertText && loginAlert) {
      alertText.textContent = msg;
      loginAlert.classList.add('show');
    }
  }

  // Xử lý gửi form đăng nhập
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = usernameInput ? usernameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const rememberMe = document.getElementById('rememberMe');

      if (!username) {
        showError('Vui lòng nhập tên đăng nhập hoặc email!');
        if (usernameInput) usernameInput.focus();
        return;
      }

      if (!password) {
        showError('Vui lòng nhập mật khẩu!');
        if (passwordInput) passwordInput.focus();
        return;
      }

      // Ẩn thông báo lỗi trước đó
      if (loginAlert) loginAlert.classList.remove('show');

      // Giả lập trạng thái Loading
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 0.8s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
        </svg>
        <span>Đang đăng nhập...</span>
      `;

      setTimeout(() => {
        // Kiểm tra đăng nhập (Hỗ trợ tài khoản admin/123456 hoặc thông tin chuẩn)
        if (username.toLowerCase() === 'admin' && password === '123456') {
          // Lưu trạng thái đăng nhập
          const session = {
            isLoggedIn: true,
            username: 'admin',
            role: 'Quản trị viên',
            loginTime: new Date().toISOString()
          };
          localStorage.setItem('SMART_GREENHOUSE_USER', JSON.stringify(session));

          // Ghi nhớ tài khoản nếu được chọn
          if (rememberMe && rememberMe.checked) {
            localStorage.setItem('REMEMBERED_USER', username);
          } else {
            localStorage.removeItem('REMEMBERED_USER');
          }

          // Ghi nhận vào nhật ký hệ thống nếu có hàm addActivityLog
          if (typeof addActivityLog === 'function') {
            addActivityLog('Hệ thống', 'Đăng nhập vào hệ thống', 'Thành công');
          }

          submitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Đăng nhập thành công!</span>
          `;
          submitBtn.style.background = '#16a34a';

          // Chuyển hướng sang trang Tổng quan Dashboard
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 600);
        } else {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          showError('Tài khoản hoặc mật khẩu không chính xác! (Gợi ý: admin / 123456)');
        }
      }, 700);
    });
  }
});
