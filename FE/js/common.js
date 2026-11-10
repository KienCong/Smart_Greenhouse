/* ==========================================================================
   Smart Greenhouse Dashboard - Shared State & Layout Helper (js/common.js)
   ========================================================================== */

const STORAGE_KEY = 'SMART_GREENHOUSE_STATE_V1';

const defaultState = {
  selectedZone: 'Nhà kính số 1',
  pumpOn: false,
  pumpRunSec: 30,
  pumpRestMin: 10,
  fanOn: false,
  fanRunMin: 15,
  fanRestMin: 30,
  autoRule: {
    enabled: true,
    mode: 'AUTO',
    minSoilHum: 35,
    maxPumpSec: 30,
    restMin: 10,
    scheduleEnabled: true,
    startTime: '06:00',
    endTime: '18:00',
    days: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  },
  zones: [
    {
      id: 1,
      // fieldId: MongoDB ObjectId của field này trong collection 'sensor_readings'
      // Lấy từ: db.getCollection('sensor_readings').findOne().field_id
      fieldId: 'REPLACE_WITH_FIELD_OBJECTID_1',
      name: 'Nhà kính số 1',
      area: 100,
      status: 'Hoạt động',
      badgeClass: 'badge-green',
      crop: 'Dưa lưới & Cà chua bi',
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 2,
      // fieldId: MongoDB ObjectId của field này trong collection 'sensor_readings'
      fieldId: 'REPLACE_WITH_FIELD_OBJECTID_2',
      name: 'Nhà kính số 2',
      area: 150,
      status: 'Bảo trì',
      badgeClass: 'badge-yellow',
      crop: 'Dâu tây giống Nhật',
      image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=400&q=80'
    }
  ],
  logs: [
    { time: '28/04/2025 10:12', type: 'Máy bơm', event: 'Bật bơm tưới (30s)', status: 'Thành công' },
    { time: '28/04/2025 10:05', type: 'Máy bơm', event: 'Kích hoạt tưới tự động (Độ ẩm đất < 35%)', status: 'Thành công' },
    { time: '28/04/2025 09:56', type: 'Quạt', event: 'Tắt quạt thông gió', status: 'Thành công' },
    { time: '28/04/2025 08:30', type: 'Quạt', event: 'Bật quạt thông gió (15p)', status: 'Thành công' },
    { time: '28/04/2025 07:21', type: 'Cảnh báo', event: 'Nhiệt độ nhà kính vượt ngưỡng an toàn (34.2°C)', status: 'Đã xử lý' },
    { time: '27/04/2025 18:32', type: 'Quạt', event: 'Bật quạt thông gió (15p)', status: 'Thành công' },
    { time: '27/04/2025 17:15', type: 'Máy bơm', event: 'Tưới cây theo lịch trình buổi chiều (45s)', status: 'Thành công' }
  ]
};

function getAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      return JSON.parse(JSON.stringify(defaultState));
    }
    return Object.assign({}, defaultState, JSON.parse(raw));
  } catch (e) {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveAppState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save state to localStorage', e);
  }
}

function addActivityLog(type, event, status = 'Thành công') {
  const state = getAppState();
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const timeStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  state.logs.unshift({ time: timeStr, type, event, status });
  saveAppState(state);
}

function showToast(message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast-box';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

/* ================= SIDEBAR MANAGEMENT ================= */
const SIDEBAR_NAV_ITEMS = [
  // {
  //   page: 'index.html',
  //   title: 'Tổng quan',
  //   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"/></svg>'
  // },
  {
    page: 'zones.html',
    title: 'Quản lý vườn',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"/></svg>'
  },
  {
    page: 'sensors.html',
    title: 'Cảm biến',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>'
  },
  {
    page: 'control.html',
    title: 'Điều khiển thiết bị',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.41 1.09H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
  },
  {
    page: 'history.html',
    title: 'Lịch sử',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  },
  {
    page: 'settings.html',
    title: 'Cài đặt',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>'
  }
];

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const isCollapsed = localStorage.getItem('SIDEBAR_COLLAPSED') === 'true';
  if (isCollapsed) {
    sidebar.classList.add('collapsed');
    document.documentElement.classList.add('sidebar-collapsed');
  } else {
    sidebar.classList.remove('collapsed');
    document.documentElement.classList.remove('sidebar-collapsed');
  }

  // Lấy tên file trang hiện tại để gán class active
  const currentPath = window.location.pathname;
  let currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'zones.html';
  if (!currentPage.endsWith('.html')) currentPage = 'zones.html';
  if (currentPage === 'index.html') currentPage = 'zones.html';

  const navHtml = SIDEBAR_NAV_ITEMS.map(item => {
    const isActive = (currentPage === item.page) ? 'active' : '';
    return `
      <a href="${item.page}" class="nav-link ${isActive}" title="${item.title}" data-page="${item.page}">
        ${item.icon}
        <span>${item.title}</span>
      </a>
    `;
  }).join('');

  sidebar.innerHTML = `
    <a href="zones.html" class="sidebar-brand">
      <div class="brand-logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
        </svg>
      </div>
      <span class="brand-title">Smart Greenhouse</span>
    </a>

    <nav class="sidebar-nav">
      ${navHtml}
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-footer-label">Trạng thái hệ thống</div>
      <div class="system-status">
        <span class="status-dot"></span>
        <span>Online</span>
      </div>
    </div>
  `;

  initSidebar();
}

window.toggleSidebar = function () {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    if (isCollapsed) {
      document.documentElement.classList.add('sidebar-collapsed');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
    }
    localStorage.setItem('SIDEBAR_COLLAPSED', isCollapsed ? 'true' : 'false');
  }
};

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Khôi phục trạng thái thu gọn từ localStorage
  if (localStorage.getItem('SIDEBAR_COLLAPSED') === 'true') {
    sidebar.classList.add('collapsed');
    document.documentElement.classList.add('sidebar-collapsed');
  } else {
    sidebar.classList.remove('collapsed');
    document.documentElement.classList.remove('sidebar-collapsed');
  }

  // Tự động gán title tooltip cho các nav-link khi thu gọn
  document.querySelectorAll('.nav-link').forEach(link => {
    const span = link.querySelector('span');
    if (span && !link.getAttribute('title')) {
      link.setAttribute('title', span.textContent.trim());
    }
  });

  const toggleBtn = document.querySelector('.menu-toggle');
  if (toggleBtn) {
    toggleBtn.onclick = function (e) {
      e.preventDefault();
      window.toggleSidebar();
    };
  }

  // Bật lại hiệu ứng chuyển động sau khi giao diện ban đầu đã ổn định
  setTimeout(() => {
    document.documentElement.classList.remove('preload-transitions');
  }, 80);
}

/* ================= TOPBAR MANAGEMENT ================= */
function renderTopbar() {
  const topbar = document.getElementById('topbar') || document.querySelector('.topbar');
  if (!topbar) return;

  const currentPath = window.location.pathname;
  let currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'zones.html';
  if (!currentPage.endsWith('.html')) currentPage = 'zones.html';
  if (currentPage === 'index.html') currentPage = 'zones.html';

  // Ở trang Tổng quan (overview.html) và Quản lý vườn (zones.html), không hiển thị mục chọn nhà kính
  const hideGreenhouseSelector = (currentPage === 'overview.html' || currentPage === 'zones.html');

  const state = getAppState();

  const selectorHtml = hideGreenhouseSelector ? '' : `
    <select id="greenhouseSelector" class="greenhouse-selector">
      ${state.zones.map(z => `<option value="${z.name}" ${z.name === state.selectedZone ? 'selected' : ''}>${z.name}</option>`).join('')}
    </select>
  `;

  topbar.innerHTML = `
    <div class="topbar-left">
      <button class="menu-toggle" title="Thu gọn menu" onclick="toggleSidebar()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      ${selectorHtml}
    </div>

    <div class="topbar-right">
      <span class="topbar-datetime" id="topbarDatetime">28/04/2025 &nbsp;10:24</span>
      <button class="notif-btn" title="Thông báo" onclick="showToast('Không có cảnh báo mới chưa đọc')">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 22a2.02 2.02 0 0 1-2.01-2h4a2.02 2.02 0 0 1-1.99 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
        <span class="notif-badge"></span>
      </button>
      <div class="user-profile" onclick="window.location.href='settings.html'">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
          alt="admin" class="user-avatar">
        <span>admin</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  `;

  // Gắn sự kiện chọn nhà kính nếu trang có hiển thị selector
  if (!hideGreenhouseSelector) {
    const selector = document.getElementById('greenhouseSelector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        const s = getAppState();
        s.selectedZone = e.target.value;
        saveAppState(s);
        showToast(`Đã chuyển sang ${s.selectedZone}`);
      });
    }
  }

  updateTopbarDatetime();
}

function updateTopbarDatetime() {
  const dtEl = document.getElementById('topbarDatetime');
  if (!dtEl) return;
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const tStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  dtEl.innerHTML = `${dStr} &nbsp;${tStr}`;
}

function initCommonLayout() {
  renderTopbar();
  renderSidebar();
}

// Cập nhật đồng hồ topbar mỗi 30 giây
setInterval(updateTopbarDatetime, 30000);

window.logout = function () {
  if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?')) {
    localStorage.removeItem('SMART_GREENHOUSE_USER');
    showToast('Đang đăng xuất...');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 400);
  }
};

document.addEventListener('DOMContentLoaded', initCommonLayout);

