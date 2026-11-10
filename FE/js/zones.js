document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('zonesContainer');
  const btnAdd = document.getElementById('btnAddZone');

  function renderZones() {
    if (!container) return;
    const s = getAppState();
    container.innerHTML = s.zones.map(z => `
      <div class="zone-card">
        <img src="${z.image}" alt="${z.name}" class="zone-thumb">
        <div class="zone-details">
          <div class="zone-title">${z.name}</div>
          <div class="zone-meta">Diện tích: ${z.area} m²</div>
          <div class="zone-meta">Trạng thái: <span class="badge ${z.badgeClass}">${z.status}</span></div>
          <div class="zone-actions">
            <button class="btn btn-outline" onclick="selectAndViewZone('${z.name}')">Xem chi tiết</button>
            <button class="icon-btn" title="Đổi trạng thái (${z.status === 'Hoạt động' ? 'Bảo trì' : 'Hoạt động'})" onclick="toggleZoneStatus(${z.id})">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            </button>
            <button class="icon-btn delete-zone-btn" title="Xóa khu vực này" onclick="deleteZone(${z.id}, '${z.name}')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.selectAndViewZone = function(zoneName) {
    const s = getAppState();
    s.selectedZone = zoneName;
    saveAppState(s);
    window.location.href = 'overview.html';
  };

  window.toggleZoneStatus = function(zoneId) {
    const s = getAppState();
    const z = s.zones.find(item => item.id === zoneId);
    if (z) {
      if (z.status === 'Hoạt động') {
        z.status = 'Bảo trì';
        z.badgeClass = 'badge-yellow';
      } else {
        z.status = 'Hoạt động';
        z.badgeClass = 'badge-green';
      }
      saveAppState(s);
      renderZones();
      showToast(`Đã đổi trạng thái ${z.name} sang ${z.status}`);
    }
  };

  window.deleteZone = function(zoneId, zoneName) {
    const s = getAppState();

    // Giữ an toàn: Cần ít nhất 1 khu vực để hệ thống không bị rỗng
    if (s.zones.length <= 1) {
      showToast('Cần giữ lại ít nhất 1 khu vực nhà kính trong hệ thống!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa "${zoneName}" khỏi hệ thống không?`)) {
      return;
    }

    // Xóa khu vực
    s.zones = s.zones.filter(item => item.id !== zoneId);

    // Nếu khu vực đang chọn trên thanh Topbar bị xóa, tự động chuyển về khu vực đầu tiên còn lại
    if (s.selectedZone === zoneName && s.zones.length > 0) {
      s.selectedZone = s.zones[0].name;
    }

    saveAppState(s);
    addActivityLog('Lệnh điều khiển', `Xóa khu vực ${zoneName}`, 'Thành công');
    initCommonLayout();
    renderZones();
    showToast(`Đã xóa ${zoneName} thành công!`);
  };

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      const s = getAppState();
      const nextNum = s.zones.length + 1;
      const name = prompt('Nhập tên khu vực nhà kính mới:', `Nhà kính số ${nextNum}`);
      if (!name) return;
      const area = Number(prompt('Nhập diện tích (m²):', '120')) || 120;
      s.zones.push({
        id: Date.now(),
        name,
        area,
        status: 'Hoạt động',
        badgeClass: 'badge-green',
        crop: 'Rau thủy canh',
        image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80'
      });
      saveAppState(s);
      initCommonLayout();
      renderZones();
      showToast(`Đã thêm ${name}`);
    });
  }

  renderZones();
});
