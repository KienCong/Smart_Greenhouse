document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('historyTableBody');
  const pills = document.querySelectorAll('#historyFilterPills .pill-btn');
  let currentFilter = 'ALL';

  // Chuẩn hóa loại sự kiện để hỗ trợ cả dữ liệu mới và dữ liệu cũ
  function normalizeLogType(item) {
    if (item.type === 'Máy bơm' || item.type === 'Quạt' || item.type === 'Cảnh báo') {
      return item.type;
    }
    const evt = (item.event || '').toLowerCase();
    if (evt.includes('bơm') || evt.includes('tưới')) return 'Máy bơm';
    if (evt.includes('quạt')) return 'Quạt';
    if (item.type === 'Cảnh báo') return 'Cảnh báo';
    return item.type;
  }

  function getBadgeForType(type) {
    if (type === 'Cảnh báo') return `<span class="badge badge-red">${type}</span>`;
    if (type === 'Máy bơm') return `<span class="badge" style="background:#e0f2fe; color:#0284c7; border:1px solid #bae6fd;">Máy bơm</span>`;
    if (type === 'Quạt') return `<span class="badge" style="background:#fef3c7; color:#d97706; border:1px solid #fde68a;">Quạt</span>`;
    if (type === 'Tự động') return `<span class="badge" style="background:#f3e8ff; color:#7e22ce;">${type}</span>`;
    return `<span class="badge badge-blue">${type}</span>`;
  }

  function getBadgeForStatus(status) {
    if (status === 'Thành công') return `<span class="badge badge-green">${status}</span>`;
    if (status === 'Đã xử lý') return `<span class="badge badge-red">${status}</span>`;
    return status;
  }

  function renderTable() {
    if (!tbody) return;
    const s = getAppState();
    
    // Chuẩn hóa và lọc danh sách nhật ký
    const rows = (s.logs || [])
      .filter(item => item.type !== 'Cảm biến')
      .map(item => ({
        ...item,
        normalizedType: normalizeLogType(item)
      }))
      .filter(item => currentFilter === 'ALL' || item.normalizedType === currentFilter);

    if (rows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:32px; color:#94a3b8;">Không có nhật ký nào cho mục đã chọn</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(item => `
      <tr>
        <td>${item.time}</td>
        <td>${getBadgeForType(item.normalizedType)}</td>
        <td>${item.event}</td>
        <td>${getBadgeForStatus(item.status)}</td>
      </tr>
    `).join('');
  }

  renderTable();

  pills.forEach(btn => {
    btn.addEventListener('click', () => {
      pills.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTable();
    });
  });
});
