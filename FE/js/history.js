document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('historyTableBody');
  const paginationContainer = document.getElementById('historyPagination');
  const pills = document.querySelectorAll('#historyFilterPills .pill-btn');
  
  const PAGE_SIZE = 10; // Tối đa 10 phần tử mỗi trang
  let currentPage = 1;
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

  function renderPagination(totalItems) {
    if (!paginationContainer) return;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

    if (totalItems === 0) {
      paginationContainer.innerHTML = '';
      return;
    }

    // Nút Trang trước (<)
    let html = `
      <button class="page-num" id="historyPrevPage" ${currentPage <= 1 ? 'disabled' : ''} title="Trang trước">&lt;</button>
    `;

    // Tính toán các trang hiển thị
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('…');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('…');
      pages.push(totalPages);
    }

    pages.forEach(p => {
      if (p === '…') {
        html += `<span style="display:flex; align-items:center; justify-content:center; width:32px; height:32px; color:#94a3b8; font-weight:600;">…</span>`;
      } else {
        html += `<button class="page-num ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      }
    });

    // Nút Trang tiếp (>)
    html += `
      <button class="page-num" id="historyNextPage" ${currentPage >= totalPages ? 'disabled' : ''} title="Trang tiếp">&gt;</button>
    `;

    paginationContainer.innerHTML = html;

    // Gắn sự kiện nút Trước
    const prevBtn = document.getElementById('historyPrevPage');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderTable();
        }
      });
    }

    // Gắn sự kiện nút Tiếp
    const nextBtn = document.getElementById('historyNextPage');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderTable();
        }
      });
    }

    // Gắn sự kiện các nút số trang
    paginationContainer.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = Number(btn.dataset.page);
        if (p && p !== currentPage) {
          currentPage = p;
          renderTable();
        }
      });
    });
  }

  function renderTable() {
    if (!tbody) return;
    const s = getAppState();
    
    // Chuẩn hóa và lọc danh sách nhật ký
    const allFiltered = (s.logs || [])
      .filter(item => item.type !== 'Cảm biến')
      .map(item => ({
        ...item,
        normalizedType: normalizeLogType(item)
      }))
      .filter(item => currentFilter === 'ALL' || item.normalizedType === currentFilter);

    const totalItems = allFiltered.length;
    const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    if (totalItems === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:32px; color:#94a3b8;">Không có nhật ký nào cho mục đã chọn</td></tr>`;
      renderPagination(0);
      return;
    }

    // Giới hạn tối đa 10 phần tử cho trang hiện tại
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const pageRows = allFiltered.slice(startIndex, startIndex + PAGE_SIZE);

    tbody.innerHTML = pageRows.map(item => `
      <tr>
        <td>${item.time}</td>
        <td>${getBadgeForType(item.normalizedType)}</td>
        <td>${item.event}</td>
        <td>${getBadgeForStatus(item.status)}</td>
      </tr>
    `).join('');

    renderPagination(totalItems);
  }

  renderTable();

  pills.forEach(btn => {
    btn.addEventListener('click', () => {
      pills.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      currentPage = 1; // Reset về trang 1 khi lọc
      renderTable();
    });
  });
});
