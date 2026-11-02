document.addEventListener('DOMContentLoaded', () => {
  const btnReset = document.getElementById('btnResetState');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      showToast('Đã khôi phục dữ liệu mặc định!');
      setTimeout(() => window.location.reload(), 700);
    });
  }
});
