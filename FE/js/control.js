document.addEventListener('DOMContentLoaded', () => {

  // =========================================================
  // CẤU HÌNH API AUTOMATION-SERVICE
  // =========================================================
  const API_GATEWAY_URL = 'http://localhost:8080/api/automation';
  const API_DIRECT_URL  = 'http://localhost:8085/api/automation';

  // Mapping tab → deviceId quy ước chuẩn (khớp với firmware esp32_gateway & backend)
  const DEVICE_MAP = {
    'tuoi-cay':      { id: 'PUMP_01', name: 'Máy bơm tưới', type: 'pump' },
    'quat-thong-gio': { id: 'FAN_01',  name: 'Quạt thông gió', type: 'fan' }
  };

  // Timer tự động ngắt theo tab
  const autoOffTimers = {
    'tuoi-cay': null,
    'quat-thong-gio': null
  };

  // Helper lấy Field ID hiện tại
  function getActiveFieldId() {
    const state = typeof getAppState === 'function' ? getAppState() : {};
    const zones = state.zones || [];
    const selectedZoneName = state.selectedZone;
    const zone = zones.find(z => z.name === selectedZoneName) || zones[0];
    
    return (zone && zone.fieldId && !zone.fieldId.startsWith('REPLACE'))
      ? zone.fieldId
      : '6ae17860acc00a053d9c7a7e';
  }

  // Wrapper fetch có auto fallback giữa API Gateway (8080) và Direct Service (8085)
  async function apiFetch(path, options = {}) {
    options.headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    try {
      const res = await fetch(`${API_GATEWAY_URL}${path}`, options);
      if (res.ok || res.status < 500) return res;
      throw new Error(`Gateway returned ${res.status}`);
    } catch (gatewayErr) {
      try {
        return await fetch(`${API_DIRECT_URL}${path}`, options);
      } catch (directErr) {
        throw new Error('Không thể kết nối đến automation-service (cả port 8080 và 8085 đều không phản hồi)');
      }
    }
  }

  // =========================================================
  // CÁC PHẦN TỬ GIAO DIỆN
  // =========================================================
  const modeAutoBtn = document.getElementById('modeAutoBtn');
  const modeManualBtn = document.getElementById('modeManualBtn');
  const tabBtns = document.querySelectorAll('.tab-btn');

  const autoConfigSection = document.getElementById('autoConfigSection');
  const manualConfigSection = document.getElementById('manualConfigSection');
  const autoScheduleCard = document.getElementById('autoScheduleCard');
  const manualScheduleCard = document.getElementById('manualScheduleCard');
  const ruleAutoSwitchWrapper = document.getElementById('ruleAutoSwitchWrapper');

  const ruleConfigTitle = document.getElementById('ruleConfigTitle');
  const manualListTitle = document.getElementById('manualListTitle');
  const lblManualTime = document.getElementById('lblManualTime');
  const lblManualDuration = document.getElementById('lblManualDuration');
  const manualAlertDesc = document.getElementById('manualAlertDesc');

  let currentMode = 'AUTO'; // 'AUTO' | 'MANUAL'

  // Khởi tạo input datetime-local mặc định (thời điểm hiện tại + 5 phút)
  const manualScheduleTimeInput = document.getElementById('manualScheduleTime');
  if (manualScheduleTimeInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    manualScheduleTimeInput.value = localIso;
  }

  // Helper lấy active tab hiện tại
  function getActiveTab() {
    return document.querySelector('.tab-btn.active')?.dataset.tab || 'tuoi-cay';
  }

  // Helper kiểm tra thiết bị của tab hiện tại đang bật hay tắt
  function isDeviceRunning(tab) {
    const stateObj = getAppState();
    return tab === 'quat-thong-gio' ? !!stateObj.fanOn : !!stateObj.pumpOn;
  }

  // =========================================================
  // ĐỒNG BỘ NÚT "TƯỚI NGAY / BẬT QUẠT" VÀ "DỪNG"
  // =========================================================
  function updateRunButtonUI() {
    const btn = document.getElementById('btnRunNow');
    if (!btn) return;

    const activeTab = getActiveTab();
    const running = isDeviceRunning(activeTab);

    if (running) {
      // Khi đang hoạt động: Chuyển sang nút DỪNG màu đỏ
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-danger');
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="5" width="14" height="14" rx="2"></rect>
        </svg>
        <span id="lblRunNowText">${activeTab === 'quat-thong-gio' ? 'Dừng quạt' : 'Dừng tưới'}</span>
      `;
      btn.title = `Nhấn để dừng ${activeTab === 'quat-thong-gio' ? 'quạt' : 'máy bơm'} ngay lập tức`;
    } else {
      // Khi đang tắt: Trở về nút TƯỚI NGAY / BẬT QUẠT NGAY màu xanh
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-primary');
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span id="lblRunNowText">${activeTab === 'quat-thong-gio' ? 'Bật quạt ngay' : 'Tưới ngay'}</span>
      `;
      btn.title = `Kích hoạt ${activeTab === 'quat-thong-gio' ? 'quạt' : 'máy bơm'} ngay lập tức`;
    }
  }

  // =========================================================
  // CHUYỂN CHẾ ĐỘ AUTO / MANUAL
  // =========================================================
  function updateModeView(mode) {
    currentMode = mode;
    const activeTab = getActiveTab();

    if (mode === 'AUTO') {
      modeAutoBtn?.classList.add('active');
      modeManualBtn?.classList.remove('active');
      if (autoConfigSection) autoConfigSection.style.display = 'block';
      if (manualConfigSection) manualConfigSection.style.display = 'none';
      if (autoScheduleCard) autoScheduleCard.style.display = 'block';
      if (manualScheduleCard) manualScheduleCard.style.display = 'none';

      // Ở chế độ AUTO: HIỂN THỊ nút switch Bật ở card header
      if (ruleAutoSwitchWrapper) ruleAutoSwitchWrapper.style.display = 'flex';

      if (ruleConfigTitle) {
        ruleConfigTitle.textContent = activeTab === 'quat-thong-gio'
          ? 'Cấu hình quạt thông gió tự động'
          : 'Cấu hình tưới tự động';
      }
    } else {
      modeManualBtn?.classList.add('active');
      modeAutoBtn?.classList.remove('active');
      if (autoConfigSection) autoConfigSection.style.display = 'none';
      if (manualConfigSection) manualConfigSection.style.display = 'block';
      if (autoScheduleCard) autoScheduleCard.style.display = 'none';
      if (manualScheduleCard) manualScheduleCard.style.display = 'block';

      // Ở chế độ THỦ CÔNG (MANUAL): BỎ ĐI button switch Bật theo yêu cầu
      if (ruleAutoSwitchWrapper) ruleAutoSwitchWrapper.style.display = 'none';

      updateManualTabLabels(activeTab);
      updateRunButtonUI();
      loadManualSchedules();
    }
  }

  // Cập nhật nhãn và mô tả khi chuyển tab ở chế độ MANUAL
  function updateManualTabLabels(tab) {
    if (tab === 'quat-thong-gio') {
      if (ruleConfigTitle) ruleConfigTitle.textContent = 'Điều khiển quạt thủ công';
      if (manualListTitle) manualListTitle.textContent = 'Danh sách lịch quạt thủ công';
      if (lblManualTime) lblManualTime.textContent = 'Thời điểm bật quạt';
      if (lblManualDuration) lblManualDuration.textContent = 'Thời gian chạy quạt (phút)';
      if (manualAlertDesc) {
        manualAlertDesc.textContent = 'Quạt thông gió đang ở chế độ thủ công. Bạn có thể kích hoạt chạy ngay hoặc hẹn giờ thực thi độc lập với cảm biến nhiệt độ.';
      }
      const durInput = document.getElementById('manualDuration');
      if (durInput && Number(durInput.value) <= 5) durInput.value = 15;
    } else {
      if (ruleConfigTitle) ruleConfigTitle.textContent = 'Điều khiển tưới thủ công';
      if (manualListTitle) manualListTitle.textContent = 'Danh sách lịch tưới thủ công';
      if (lblManualTime) lblManualTime.textContent = 'Thời điểm tưới';
      if (lblManualDuration) lblManualDuration.textContent = 'Thời gian tưới (phút)';
      if (manualAlertDesc) {
        manualAlertDesc.textContent = 'Máy bơm đang ở chế độ thủ công. Bạn có thể kích hoạt tưới ngay hoặc hẹn giờ thực thi độc lập với cảm biến độ ẩm đất.';
      }
    }
  }

  if (modeAutoBtn && modeManualBtn) {
    modeAutoBtn.addEventListener('click', () => updateModeView('AUTO'));
    modeManualBtn.addEventListener('click', () => updateModeView('MANUAL'));
  }

  // =========================================================
  // KHỞI TẠO GIÁ TRỊ AUTO TỪ LOCALSTORAGE
  // =========================================================
  const s = getAppState();
  if (s && s.autoRule) {
    const inputMinSoil = document.getElementById('inputMinSoil');
    const inputMaxPumpSec = document.getElementById('inputMaxPumpSec');
    const inputRestMin = document.getElementById('inputRestMin');
    const inputStartTime = document.getElementById('inputStartTime');
    const inputEndTime = document.getElementById('inputEndTime');

    if (inputMinSoil) inputMinSoil.value = s.autoRule.minSoilHum ?? 35;
    if (inputMaxPumpSec) inputMaxPumpSec.value = s.autoRule.maxPumpSec ?? 30;
    if (inputRestMin) inputRestMin.value = s.autoRule.restMin ?? 10;
    if (inputStartTime) inputStartTime.value = s.autoRule.startTime || '06:00';
    if (inputEndTime) inputEndTime.value = s.autoRule.endTime || '18:00';
  }

  // Sự kiện chuyển Tab (Tưới cây / Quạt thông gió)
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      const lblOn = document.getElementById('lblThresholdOn');
      const lblMax = document.getElementById('lblMaxRun');
      const inputMinSoil = document.getElementById('inputMinSoil');
      const inputMaxPumpSec = document.getElementById('inputMaxPumpSec');
      const inputRestMin = document.getElementById('inputRestMin');
      const stateObj = getAppState();

      if (currentMode === 'AUTO') {
        if (tab === 'quat-thong-gio') {
          if (ruleConfigTitle) ruleConfigTitle.textContent = 'Cấu hình quạt thông gió tự động';
          if (lblOn) lblOn.textContent = 'Ngưỡng bật quạt (nhiệt độ °C)';
          if (lblMax) lblMax.textContent = 'Thời gian chạy quạt tối đa (phút)';
          if (inputMinSoil) inputMinSoil.value = stateObj.autoRule?.fanOnTemp ?? 32;
          if (inputMaxPumpSec) inputMaxPumpSec.value = stateObj.autoRule?.fanMaxRunMin ?? 15;
          if (inputRestMin) inputRestMin.value = stateObj.autoRule?.fanRestMin ?? 30;
        } else {
          if (ruleConfigTitle) ruleConfigTitle.textContent = 'Cấu hình tưới tự động';
          if (lblOn) lblOn.textContent = 'Ngưỡng bật bơm (độ ẩm đất %)';
          if (lblMax) lblMax.textContent = 'Thời gian tưới tối đa (giây)';
          if (inputMinSoil) inputMinSoil.value = stateObj.autoRule?.minSoilHum ?? 35;
          if (inputMaxPumpSec) inputMaxPumpSec.value = stateObj.autoRule?.maxPumpSec ?? 30;
          if (inputRestMin) inputRestMin.value = stateObj.autoRule?.restMin ?? 10;
        }
      } else {
        updateManualTabLabels(tab);
        updateRunButtonUI();
        loadManualSchedules();
      }
    });
  });

  // Lưu cấu hình chế độ AUTO
  const saveBtn = document.getElementById('saveRuleBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const stateObj = getAppState();
      stateObj.autoRule = stateObj.autoRule || {};
      const activeTab = getActiveTab();

      if (activeTab === 'quat-thong-gio') {
        stateObj.autoRule.fanOnTemp = Number(document.getElementById('inputMinSoil')?.value) || 32;
        stateObj.autoRule.fanMaxRunMin = Number(document.getElementById('inputMaxPumpSec')?.value) || 15;
        stateObj.autoRule.fanRestMin = Number(document.getElementById('inputRestMin')?.value) || 30;
        addActivityLog('Quạt', `Cài đặt quạt tự động: bật khi nhiệt độ > ${stateObj.autoRule.fanOnTemp}°C, chạy ${stateObj.autoRule.fanMaxRunMin} phút`, 'Thành công');
      } else {
        stateObj.autoRule.minSoilHum = Number(document.getElementById('inputMinSoil')?.value) || 35;
        stateObj.autoRule.maxPumpSec = Number(document.getElementById('inputMaxPumpSec')?.value) || 30;
        stateObj.autoRule.restMin = Number(document.getElementById('inputRestMin')?.value) || 10;
        addActivityLog('Máy bơm', `Cài đặt tưới tự động: bật khi độ ẩm < ${stateObj.autoRule.minSoilHum}%, tưới ${stateObj.autoRule.maxPumpSec}s`, 'Thành công');
      }

      stateObj.autoRule.startTime = document.getElementById('inputStartTime')?.value || '06:00';
      stateObj.autoRule.endTime = document.getElementById('inputEndTime')?.value || '18:00';
      saveAppState(stateObj);
      showToast('Đã lưu cấu hình quy tắc tự động thành công!');
    });
  }

  // =========================================================
  // BACKEND API: GỬI LỆNH ĐIỀU KHIỂN THIẾT BỊ (ON / OFF)
  // =========================================================
  async function sendDeviceCommand(deviceId, action) {
    const fieldId = getActiveFieldId();

    try {
      const res = await apiFetch(`/devices/${deviceId}/commands`, {
        method: 'POST',
        body: JSON.stringify({
          fieldId: fieldId,
          action: action
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Mã lỗi ${res.status}: ${errorText || res.statusText}`);
      }

      const data = await res.json();
      console.log(`[Automation API] Lệnh ${action} gửi thành công:`, data);
      return data;
    } catch (err) {
      console.error('[Automation API] Lỗi gửi lệnh điều khiển:', err);
      throw err;
    }
  }

  // =========================================================
  // BACKEND API: TẠO LỊCH HẸN GIỜ (SCHEDULE)
  // =========================================================
  async function createDeviceSchedule(deviceRef, startTimeIso, durationSeconds) {
    const fieldId = getActiveFieldId();

    try {
      const res = await apiFetch(`/schedules/${fieldId}`, {
        method: 'POST',
        body: JSON.stringify({
          deviceRef: deviceRef,
          startTime: startTimeIso,
          durationSeconds: durationSeconds,
          triggerType: 'MANUAL'
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Mã lỗi ${res.status}: ${errorText || res.statusText}`);
      }

      const data = await res.json();
      console.log('[Automation API] Tạo lịch thành công:', data);
      return data;
    } catch (err) {
      console.error('[Automation API] Lỗi tạo lịch:', err);
      throw err;
    }
  }

  // =========================================================
  // BACKEND API: TẢI DANH SÁCH LỊCH TỪ BACKEND
  // =========================================================
  async function fetchBackendSchedules() {
    const fieldId = getActiveFieldId();
    try {
      const res = await apiFetch(`/schedules/${fieldId}`, { method: 'GET' });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (e) {
      console.warn('[Automation API] Không thể tải lịch từ backend, chuyển sang dữ liệu local:', e.message);
      return null;
    }
  }

  // =========================================================
  // BACKEND API: XÓA LỊCH HẸN GIỜ (HỦY LỊCH PENDING)
  // =========================================================
  async function deleteBackendSchedule(scheduleId) {
    try {
      const res = await apiFetch(`/schedules/${scheduleId}`, { method: 'DELETE' });
      return res.ok;
    } catch (e) {
      console.warn('[Automation API] Lỗi xóa lịch trên backend:', e.message);
      return false;
    }
  }

  // =========================================================
  // HÀM DỪNG THIẾT BỊ NGAY LẬP TỨC (DÙNG CHO NÚT DỪNG LỚN)
  // =========================================================
  async function stopActiveDevice() {
    const activeTab = getActiveTab();
    const currentDevice = DEVICE_MAP[activeTab];

    showToast(`Đang gửi lệnh dừng ${currentDevice.name.toLowerCase()}...`);

    // Xóa timer auto-off nếu có
    if (autoOffTimers[activeTab]) {
      clearTimeout(autoOffTimers[activeTab]);
      autoOffTimers[activeTab] = null;
    }

    try {
      await sendDeviceCommand(currentDevice.id, 'OFF');
      showToast(`Đã dừng ${currentDevice.name.toLowerCase()} thành công!`);
    } catch (err) {
      showToast(`⚠️ Không thể kết nối backend: ${err.message}. Đã dừng trạng thái.`);
    }

    const stateObj = getAppState();
    if (activeTab === 'quat-thong-gio') {
      stateObj.fanOn = false;
    } else {
      stateObj.pumpOn = false;
    }

    // Chuyển các lịch đang RUNNING của tab này thành DONE
    (stateObj.manualSchedules || []).forEach(item => {
      if (item.targetTab === activeTab && item.status === 'RUNNING') {
        item.status = 'DONE';
      }
    });

    addActivityLog(currentDevice.name, `Dừng ${currentDevice.name.toLowerCase()} thủ công ngay lập tức`, 'Thành công');
    saveAppState(stateObj);

    // Cập nhật lại giao diện nút và bảng
    updateRunButtonUI();
    loadManualSchedules();
  }

  // =========================================================
  // RENDER BẢNG DANH SÁCH LỊCH THỦ CÔNG
  // LƯU Ý: Dòng RUNNING không cho click dừng tại đây, mà phải dùng nút Dừng lớn
  // =========================================================
  const PAGE_SIZE = 10; // Số dòng mỗi trang
  let currentPage = 1;  // Trang hiện tại (bắt đầu từ 1)
  let cachedScheduleList = []; // Cache toàn bộ danh sách để phân trang

  // Render phần trang vào DOM
  function renderPagination(totalItems) {
    const paginationEl = document.getElementById('manualPagination');
    const infoEl       = document.getElementById('manualPaginationInfo');
    const numbersEl    = document.getElementById('manualPageNumbers');
    const prevBtn      = document.getElementById('manualPagePrev');
    const nextBtn      = document.getElementById('manualPageNext');
    if (!paginationEl) return;

    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    if (totalPages <= 1) {
      paginationEl.style.display = 'none';
      return;
    }

    paginationEl.style.display = 'flex';

    const from = Math.min((currentPage - 1) * PAGE_SIZE + 1, totalItems);
    const to   = Math.min(currentPage * PAGE_SIZE, totalItems);

    // Vô hiệu hóa nút Trước / Tiếp
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

    // Render số trang (hiện tối đa 5 nút số, có dấu "…" khi cần)
    if (numbersEl) {
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

      numbersEl.innerHTML = pages.map(p =>
        p === '…'
          ? `<span style="padding:0 4px; color:#94a3b8;">…</span>`
          : `<button class="btn ${p === currentPage ? 'btn-primary' : 'btn-outline'}"
                     data-page="${p}"
                     style="padding:4px 10px; font-size:12.5px; min-width:32px;">${p}</button>`
      ).join('');

      numbersEl.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          currentPage = Number(btn.dataset.page);
          renderSchedulePage();
        });
      });
    }

    if (prevBtn) {
      prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderSchedulePage(); } };
    }
    if (nextBtn) {
      nextBtn.onclick = () => { if (currentPage < totalPages) { currentPage++; renderSchedulePage(); } };
    }
  }

  // Render trang hiện tại từ cachedScheduleList
  function renderSchedulePage() {
    const tbody = document.getElementById('manualScheduleTableBody');
    const activeTab = getActiveTab();
    if (!tbody) return;

    const totalItems = cachedScheduleList.length;

    if (!totalItems) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:24px 16px;">Chưa có lịch điều khiển thủ công nào</td></tr>`;
      const paginationEl = document.getElementById('manualPagination');
      if (paginationEl) paginationEl.style.display = 'none';
      return;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = cachedScheduleList.slice(start, start + PAGE_SIZE);

    tbody.innerHTML = pageItems.map(item => {
      let badgeHtml = '';
      let actionHtml = '';

      if (item.status === 'RUNNING') {
        const text = activeTab === 'quat-thong-gio' ? 'Đang chạy quạt' : 'Đang tưới';
        badgeHtml = `<span class="badge badge-running">${text}</span>`;
        // KHÔNG cho click Dừng tại đây, hiển thị chỉ báo trạng thái rõ ràng
        actionHtml = `<span style="color:#059669; font-size:12px; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
          <span style="width:6px; height:6px; border-radius:50%; background:#10b981;"></span>Đang chạy
        </span>`;
      } else if (item.status === 'PENDING') {
        badgeHtml = `<span class="badge badge-blue">Chờ thực thi</span>`;
        actionHtml = `<button type="button" class="btn-secondary-sm" data-action="cancel" data-id="${item.id}" data-is-backend="${!!item.isBackend}">Hủy</button>`;
      } else if (item.status === 'DONE') {
        badgeHtml = `<span class="badge badge-green">Hoàn tất</span>`;
        actionHtml = `<span style="color:#94a3b8; font-size:12px;">—</span>`;
      } else {
        badgeHtml = `<span class="badge badge-yellow">Đã dừng / Hủy</span>`;
        actionHtml = `<span style="color:#94a3b8; font-size:12px;">—</span>`;
      }

      return `
        <tr>
          <td><strong style="color:#1e293b;">${item.scheduledTime}</strong></td>
          <td>${item.durationMinutes} phút</td>
          <td>${badgeHtml}</td>
          <td style="text-align:right;">${actionHtml}</td>
        </tr>
      `;
    }).join('');

    // Gắn sự kiện CHỈ cho nút HỦY lịch chờ (PENDING)
    tbody.querySelectorAll('button[data-action="cancel"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const isBackend = btn.dataset.isBackend === 'true';
        showToast('Đang hủy lịch hẹn giờ...');
        if (isBackend) {
          await deleteBackendSchedule(id);
        }
        const stateObj = getAppState();
        const localItem = (stateObj.manualSchedules || []).find(x => String(x.id) === String(id));
        if (localItem) localItem.status = 'CANCELLED';
        saveAppState(stateObj);
        showToast('Đã hủy lịch hẹn giờ thành công!');
        loadManualSchedules();
      });
    });

    renderPagination(totalItems);
  }

  async function loadManualSchedules() {
    const tbody = document.getElementById('manualScheduleTableBody');
    if (!tbody) return;

    const activeTab = getActiveTab();
    const currentDevice = DEVICE_MAP[activeTab];

    // Thử lấy danh sách lịch thực từ backend
    const backendList = await fetchBackendSchedules();

    let displayList = [];

    if (backendList && Array.isArray(backendList)) {
      const now = new Date();
      displayList = backendList
        .filter(item => {
          const ref = (item.deviceRef || '').toUpperCase();
          return activeTab === 'quat-thong-gio'
            ? (ref.includes('FAN') || ref.includes('QUAT'))
            : (ref.includes('PUMP') || ref.includes('BOM'));
        })
        .map(item => {
          const start = new Date(item.startTime);
          const end = item.endTime ? new Date(item.endTime) : new Date(start.getTime() + (item.durationSeconds || 0) * 1000);
          
          let status = 'PENDING';
          if (now >= start && now < end) {
            status = 'RUNNING';
          } else if (now >= end) {
            status = 'DONE';
          }

          const pad = n => String(n).padStart(2, '0');
          const timeFormatted = `${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()} ${pad(start.getHours())}:${pad(start.getMinutes())}`;

          return {
            id: item.id,
            device: currentDevice.name,
            targetTab: activeTab,
            scheduledTime: timeFormatted,
            durationMinutes: Math.round((item.durationSeconds || 0) / 60),
            status: status,
            isBackend: true
          };
        });
    }

    // Nếu backend chưa có hoặc rỗng, dùng dữ liệu local
    if (!displayList.length) {
      const stateObj = getAppState();
      displayList = (stateObj.manualSchedules || []).filter(item => item.targetTab === activeTab);
    }

    // Lưu cache và reset về trang 1 khi tải lại danh sách mới
    cachedScheduleList = displayList;
    currentPage = 1;
    renderSchedulePage();
  }

  // Nút Làm mới danh sách thủ công
  const btnRefresh = document.getElementById('btnRefreshManualList');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', async () => {
      showToast('Đang làm mới danh sách lịch...');
      await loadManualSchedules();
      updateRunButtonUI();
      showToast('Đã làm mới danh sách lịch!');
    });
  }

  // =========================================================
  // ĐẶT LỊCH THỦ CÔNG (SCHEDULE MANUAL)
  // =========================================================
  const btnScheduleManual = document.getElementById('btnScheduleManual');
  if (btnScheduleManual) {
    btnScheduleManual.addEventListener('click', async () => {
      const activeTab = getActiveTab();
      const currentDevice = DEVICE_MAP[activeTab];
      const durationVal = Number(document.getElementById('manualDuration')?.value) || 5;
      const timeVal = document.getElementById('manualScheduleTime')?.value;

      if (!timeVal) {
        showToast('⚠️ Vui lòng chọn thời điểm thực thi');
        return;
      }

      const targetDate = new Date(timeVal);
      const now = new Date();

      if (targetDate <= now) {
        showToast('⚠️ Thời điểm đặt lịch phải ở trong tương lai');
        return;
      }

      // Format ISO có time zone offset (ví dụ +07:00) cho OffsetDateTime của Spring Boot
      const tzOffset = -targetDate.getTimezoneOffset();
      const sign = tzOffset >= 0 ? '+' : '-';
      const pad = n => String(Math.floor(Math.abs(n))).padStart(2, '0');
      const offsetStr = `${sign}${pad(tzOffset / 60)}:${pad(tzOffset % 60)}`;
      const startTimeIso = new Date(targetDate.getTime() - targetDate.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 19) + offsetStr;

      showToast(`Đang đặt lịch ${currentDevice.name.toLowerCase()} trên máy chủ...`);

      try {
        await createDeviceSchedule(currentDevice.id, startTimeIso, durationVal * 60);
        showToast(`Đã lưu lịch ${currentDevice.name.toLowerCase()} lên hệ thống tự động!`);
      } catch (err) {
        console.warn('[Automation API] Không thể lưu lịch lên backend:', err);
        showToast(`⚠️ Chưa kết nối được backend (${err.message}). Đã lưu lịch tạm trên máy.`);
      }

      const padNum = n => String(n).padStart(2, '0');
      const formattedTime = `${padNum(targetDate.getDate())}/${padNum(targetDate.getMonth() + 1)}/${targetDate.getFullYear()} ${padNum(targetDate.getHours())}:${padNum(targetDate.getMinutes())}`;

      const stateObj = getAppState();
      stateObj.manualSchedules = stateObj.manualSchedules || [];
      stateObj.manualSchedules.unshift({
        id: Date.now(),
        device: currentDevice.name,
        targetTab: activeTab,
        scheduledTime: formattedTime,
        durationMinutes: durationVal,
        status: 'PENDING'
      });
      saveAppState(stateObj);

      addActivityLog(currentDevice.name, `Đặt lịch ${currentDevice.name.toLowerCase()} vào ${formattedTime} (${durationVal} phút)`, 'Thành công');
      loadManualSchedules();
    });
  }

  // =========================================================
  // XỬ LÝ NÚT CHÍNH (TƯỚI NGAY / BẬT QUẠT NGAY hoặc DỪNG)
  // =========================================================
  const runNowModal = document.getElementById('runNowModal');
  const btnRunNow = document.getElementById('btnRunNow');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');

  const modalConfirmTitle = document.getElementById('modalConfirmTitle');
  const modalConfirmDesc = document.getElementById('modalConfirmDesc');
  const modalZoneName = document.getElementById('modalZoneName');
  const modalDeviceName = document.getElementById('modalDeviceName');
  const modalDurationText = document.getElementById('modalDurationText');

  // Khi click vào nút chính (btnRunNow):
  // - Nếu thiết bị đang CHẠY -> Dừng thiết bị ngay (gọi stopActiveDevice)
  // - Nếu thiết bị đang TẮT  -> Mở Modal xác nhận kích hoạt
  if (btnRunNow) {
    btnRunNow.addEventListener('click', async () => {
      const activeTab = getActiveTab();
      const running = isDeviceRunning(activeTab);

      if (running) {
        // ĐANG CHẠY: Nhấn nút Dừng
        await stopActiveDevice();
      } else {
        // ĐANG TẮT: Mở modal xác nhận kích hoạt
        const currentDevice = DEVICE_MAP[activeTab];
        const durationVal = Number(document.getElementById('manualDuration')?.value) || 5;
        const stateObj = getAppState();

        if (modalZoneName) modalZoneName.textContent = stateObj.selectedZone || 'Nhà kính số 1';

        if (activeTab === 'quat-thong-gio') {
          if (modalConfirmTitle) modalConfirmTitle.textContent = 'Bật quạt ngay?';
          if (modalConfirmDesc) modalConfirmDesc.textContent = 'Bạn có chắc chắn muốn kích hoạt quạt thông gió ngay bây giờ không?';
          if (modalDeviceName) modalDeviceName.textContent = 'Quạt thông gió';
        } else {
          if (modalConfirmTitle) modalConfirmTitle.textContent = 'Tưới ngay?';
          if (modalConfirmDesc) modalConfirmDesc.textContent = 'Bạn có chắc chắn muốn kích hoạt máy bơm tưới ngay bây giờ không?';
          if (modalDeviceName) modalDeviceName.textContent = 'Máy bơm tưới';
        }

        if (modalDurationText) modalDurationText.textContent = `${durationVal} phút`;
        if (runNowModal) runNowModal.classList.add('show');
      }
    });
  }

  function closeModal() {
    if (runNowModal) runNowModal.classList.remove('show');
  }

  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);
  if (runNowModal) {
    runNowModal.addEventListener('click', (e) => {
      if (e.target === runNowModal) closeModal();
    });
  }

  // Kích hoạt ngay lập tức từ Modal
  if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener('click', async () => {
      closeModal();
      const activeTab = getActiveTab();
      const currentDevice = DEVICE_MAP[activeTab];
      const durationVal = Number(document.getElementById('manualDuration')?.value) || 5;

      showToast(`Đang gửi lệnh kích hoạt ${currentDevice.name.toLowerCase()} xuống thiết bị...`);

      try {
        await sendDeviceCommand(currentDevice.id, 'ON');
        showToast(`Đã bật ${currentDevice.name.toLowerCase()} thành công!`);
      } catch (err) {
        showToast(`⚠️ Không thể kết nối backend: ${err.message}. Đã bật trạng thái.`);
      }

      // Cập nhật state local sang BẬT
      const stateObj = getAppState();
      stateObj.manualSchedules = stateObj.manualSchedules || [];

      const now = new Date();
      const pad = n => String(n).padStart(2, '0');
      const timeStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      // Chuyển các lịch đang chạy cũ thành DONE
      stateObj.manualSchedules.forEach(item => {
        if (item.targetTab === activeTab && item.status === 'RUNNING') {
          item.status = 'DONE';
        }
      });

      // Thêm lịch RUNNING mới vào danh sách
      stateObj.manualSchedules.unshift({
        id: Date.now(),
        device: currentDevice.name,
        targetTab: activeTab,
        scheduledTime: timeStr,
        durationMinutes: durationVal,
        status: 'RUNNING'
      });

      if (activeTab === 'quat-thong-gio') {
        stateObj.fanOn = true;
      } else {
        stateObj.pumpOn = true;
      }

      saveAppState(stateObj);
      addActivityLog(currentDevice.name, `Kích hoạt ${currentDevice.name.toLowerCase()} thủ công ngay lập tức (${durationVal} phút)`, 'Thành công');

      // CẬP NHẬT NÚT SANG TRẠNG THÁI "DỪNG" MÀU ĐỎ NGAY LẬP TỨC
      updateRunButtonUI();
      loadManualSchedules();

      // Hẹn giờ tự động tắt sau khi hết thời gian chạy
      if (durationVal > 0) {
        if (autoOffTimers[activeTab]) clearTimeout(autoOffTimers[activeTab]);

        autoOffTimers[activeTab] = setTimeout(async () => {
          try {
            await sendDeviceCommand(currentDevice.id, 'OFF');
            console.log(`[Auto Stop] Đã tự động ngắt ${currentDevice.name} sau ${durationVal} phút`);
          } catch (e) {
            console.warn('[Auto Stop] Lỗi gửi lệnh ngắt tự động:', e.message);
          }
          const s = getAppState();
          if (activeTab === 'quat-thong-gio') s.fanOn = false;
          else s.pumpOn = false;
          saveAppState(s);

          updateRunButtonUI();
          loadManualSchedules();
          showToast(`Đã hoàn tất chu kỳ ${currentDevice.name.toLowerCase()} (${durationVal} phút)`);
        }, durationVal * 60 * 1000);
      }
    });
  }

  // Khởi tạo ban đầu
  updateRunButtonUI();
});
