document.addEventListener('DOMContentLoaded', () => {
  const modeAutoBtn = document.getElementById('modeAutoBtn');
  const modeManualBtn = document.getElementById('modeManualBtn');
  const tabBtns = document.querySelectorAll('.tab-btn');

  const autoConfigSection = document.getElementById('autoConfigSection');
  const manualConfigSection = document.getElementById('manualConfigSection');
  const autoScheduleCard = document.getElementById('autoScheduleCard');
  const manualScheduleCard = document.getElementById('manualScheduleCard');

  const ruleConfigTitle = document.getElementById('ruleConfigTitle');
  const manualListTitle = document.getElementById('manualListTitle');
  const lblManualTime = document.getElementById('lblManualTime');
  const lblManualDuration = document.getElementById('lblManualDuration');
  const lblRunNowText = document.getElementById('lblRunNowText');
  const lblScheduleManualText = document.getElementById('lblScheduleManualText');
  const manualAlertDesc = document.getElementById('manualAlertDesc');

  let currentMode = 'AUTO'; // 'AUTO' | 'MANUAL'

  // Khởi tạo danh sách lịch thủ công nếu chưa có trong state
  const state = getAppState();
  if (!state.manualSchedules || !state.manualSchedules.length) {
    state.manualSchedules = [
      {
        id: 1,
        device: 'Máy bơm',
        targetTab: 'tuoi-cay',
        scheduledTime: '27/10/2026 17:00',
        durationMinutes: 5,
        status: 'RUNNING'
      },
      {
        id: 2,
        device: 'Máy bơm',
        targetTab: 'tuoi-cay',
        scheduledTime: '27/10/2026 19:30',
        durationMinutes: 10,
        status: 'PENDING'
      },
      {
        id: 3,
        device: 'Máy bơm',
        targetTab: 'tuoi-cay',
        scheduledTime: '27/10/2026 08:00',
        durationMinutes: 15,
        status: 'DONE'
      },
      {
        id: 4,
        device: 'Quạt',
        targetTab: 'quat-thong-gio',
        scheduledTime: '27/10/2026 14:00',
        durationMinutes: 20,
        status: 'DONE'
      }
    ];
    saveAppState(state);
  }

  // Khởi tạo input datetime-local mặc định (thời điểm hiện tại + 10 phút)
  const manualScheduleTimeInput = document.getElementById('manualScheduleTime');
  if (manualScheduleTimeInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    manualScheduleTimeInput.value = localIso;
  }

  // Cập nhật giao diện theo chế độ AUTO / MANUAL
  function updateModeView(mode) {
    currentMode = mode;
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'tuoi-cay';

    if (mode === 'AUTO') {
      modeAutoBtn?.classList.add('active');
      modeManualBtn?.classList.remove('active');
      if (autoConfigSection) autoConfigSection.style.display = 'block';
      if (manualConfigSection) manualConfigSection.style.display = 'none';
      if (autoScheduleCard) autoScheduleCard.style.display = 'block';
      if (manualScheduleCard) manualScheduleCard.style.display = 'none';

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

      updateManualTabLabels(activeTab);
      renderManualScheduleTable();
    }
  }

  // Cập nhật nhãn và mô tả khi chuyển tab ở chế độ MANUAL
  function updateManualTabLabels(tab) {
    if (tab === 'quat-thong-gio') {
      if (ruleConfigTitle) ruleConfigTitle.textContent = 'Điều khiển quạt thủ công';
      if (manualListTitle) manualListTitle.textContent = 'Danh sách lịch quạt thủ công';
      if (lblManualTime) lblManualTime.textContent = 'Thời điểm bật quạt';
      if (lblManualDuration) lblManualDuration.textContent = 'Thời gian chạy quạt (phút)';
      if (lblRunNowText) lblRunNowText.textContent = 'Bật quạt ngay';
      if (lblScheduleManualText) lblScheduleManualText.textContent = 'Đặt lịch quạt';
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
      if (lblRunNowText) lblRunNowText.textContent = 'Tưới ngay';
      if (lblScheduleManualText) lblScheduleManualText.textContent = 'Đặt lịch tưới';
      if (manualAlertDesc) {
        manualAlertDesc.textContent = 'Máy bơm đang ở chế độ thủ công. Bạn có thể kích hoạt tưới ngay hoặc hẹn giờ thực thi độc lập với cảm biến độ ẩm đất.';
      }
    }
  }

  if (modeAutoBtn && modeManualBtn) {
    modeAutoBtn.addEventListener('click', () => updateModeView('AUTO'));
    modeManualBtn.addEventListener('click', () => updateModeView('MANUAL'));
  }

  // Khởi tạo các giá trị cài đặt AUTO từ localStorage
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
        renderManualScheduleTable();
      }
    });
  });

  // Lưu cấu hình chế độ AUTO
  const saveBtn = document.getElementById('saveRuleBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const stateObj = getAppState();
      stateObj.autoRule = stateObj.autoRule || {};
      const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'tuoi-cay';

      if (activeTab === 'quat-thong-gio') {
        stateObj.autoRule.fanOnTemp = Number(document.getElementById('inputMinSoil')?.value) || 32;
        stateObj.autoRule.fanMaxRunMin = Number(document.getElementById('inputMaxPumpSec')?.value) || 15;
        stateObj.autoRule.fanRestMin = Number(document.getElementById('inputRestMin')?.value) || 30;
        delete stateObj.autoRule.fanOffTemp;
        addActivityLog('Quạt', `Cài đặt quạt tự động: bật khi nhiệt độ > ${stateObj.autoRule.fanOnTemp}°C, chạy ${stateObj.autoRule.fanMaxRunMin} phút`, 'Thành công');
      } else {
        stateObj.autoRule.minSoilHum = Number(document.getElementById('inputMinSoil')?.value) || 35;
        stateObj.autoRule.maxPumpSec = Number(document.getElementById('inputMaxPumpSec')?.value) || 30;
        stateObj.autoRule.restMin = Number(document.getElementById('inputRestMin')?.value) || 10;
        delete stateObj.autoRule.maxSoilHum;
        addActivityLog('Máy bơm', `Cài đặt tưới tự động: bật khi độ ẩm < ${stateObj.autoRule.minSoilHum}%, tưới ${stateObj.autoRule.maxPumpSec}s`, 'Thành công');
      }

      stateObj.autoRule.startTime = document.getElementById('inputStartTime')?.value || '06:00';
      stateObj.autoRule.endTime = document.getElementById('inputEndTime')?.value || '18:00';
      saveAppState(stateObj);
      showToast('Đã lưu cấu hình quy tắc tự động thành công!');
    });
  }

  // ================= CASSAVA MANUAL IRRIGATION LOGIC =================

  // Render bảng danh sách lịch điều khiển thủ công
  function renderManualScheduleTable() {
    const tbody = document.getElementById('manualScheduleTableBody');
    if (!tbody) return;

    const stateObj = getAppState();
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'tuoi-cay';
    const schedules = (stateObj.manualSchedules || []).filter(item => item.targetTab === activeTab);

    if (!schedules.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:24px 16px;">Chưa có lịch điều khiển thủ công nào</td></tr>`;
      return;
    }

    tbody.innerHTML = schedules.map(item => {
      let badgeHtml = '';
      let actionHtml = '';

      if (item.status === 'RUNNING') {
        const text = activeTab === 'quat-thong-gio' ? 'Đang chạy quạt' : 'Đang tưới';
        badgeHtml = `<span class="badge badge-running">${text}</span>`;
        actionHtml = `<button type="button" class="btn-danger-sm" data-action="stop" data-id="${item.id}">Dừng</button>`;
      } else if (item.status === 'PENDING') {
        badgeHtml = `<span class="badge badge-blue">Chờ thực thi</span>`;
        actionHtml = `<button type="button" class="btn-secondary-sm" data-action="cancel" data-id="${item.id}">Hủy</button>`;
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

    // Gắn sự kiện nút Dừng và Hủy
    tbody.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const id = Number(btn.dataset.id);
        handleScheduleAction(id, action);
      });
    });
  }

  // Xử lý Dừng / Hủy lịch thủ công
  function handleScheduleAction(id, action) {
    const stateObj = getAppState();
    const item = (stateObj.manualSchedules || []).find(x => x.id === id);
    if (!item) return;

    if (action === 'stop') {
      item.status = 'CANCELLED';
      if (item.targetTab === 'quat-thong-gio') {
        stateObj.fanOn = false;
        addActivityLog('Quạt', 'Dừng quạt thủ công ngay lập tức', 'Thành công');
        showToast('Đã dừng quạt thông gió thành công!');
      } else {
        stateObj.pumpOn = false;
        addActivityLog('Máy bơm', 'Dừng tưới thủ công ngay lập tức', 'Thành công');
        showToast('Đã dừng máy bơm tưới thành công!');
      }
    } else if (action === 'cancel') {
      item.status = 'CANCELLED';
      addActivityLog(item.device, `Hủy lịch hẹn giờ ${item.scheduledTime}`, 'Thành công');
      showToast('Đã hủy lịch hẹn giờ thành công!');
    }

    saveAppState(stateObj);
    renderManualScheduleTable();
  }

  // Nút Làm mới danh sách thủ công
  const btnRefresh = document.getElementById('btnRefreshManualList');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      renderManualScheduleTable();
      showToast('Đã làm mới danh sách lịch thủ công!');
    });
  }

  // Đặt lịch thủ công (Schedule Manual)
  const btnScheduleManual = document.getElementById('btnScheduleManual');
  if (btnScheduleManual) {
    btnScheduleManual.addEventListener('click', () => {
      const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'tuoi-cay';
      const durationVal = Number(document.getElementById('manualDuration')?.value) || 5;
      const timeVal = document.getElementById('manualScheduleTime')?.value;

      let formattedTime = '';
      if (timeVal) {
        const d = new Date(timeVal);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        formattedTime = `${day}/${month}/${year} ${hours}:${mins}`;
      } else {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 15);
        formattedTime = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }

      const stateObj = getAppState();
      stateObj.manualSchedules = stateObj.manualSchedules || [];
      const newId = Date.now();
      const deviceName = activeTab === 'quat-thong-gio' ? 'Quạt' : 'Máy bơm';

      stateObj.manualSchedules.unshift({
        id: newId,
        device: deviceName,
        targetTab: activeTab,
        scheduledTime: formattedTime,
        durationMinutes: durationVal,
        status: 'PENDING'
      });

      saveAppState(stateObj);
      addActivityLog(deviceName, `Đặt lịch ${deviceName.toLowerCase()} thủ công vào ${formattedTime} (${durationVal} phút)`, 'Thành công');
      showToast(`Đã tạo lịch ${deviceName.toLowerCase()} thủ công thành công!`);
      renderManualScheduleTable();
    });
  }

  // ================= MODAL "TƯỚI NGAY" / "BẬT QUẠT NGAY" (CASSAVA STYLE) =================
  const runNowModal = document.getElementById('runNowModal');
  const btnRunNow = document.getElementById('btnRunNow');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');

  const modalConfirmTitle = document.getElementById('modalConfirmTitle');
  const modalConfirmDesc = document.getElementById('modalConfirmDesc');
  const modalZoneName = document.getElementById('modalZoneName');
  const modalDeviceName = document.getElementById('modalDeviceName');
  const modalDurationText = document.getElementById('modalDurationText');

  // Mở modal xác nhận
  if (btnRunNow) {
    btnRunNow.addEventListener('click', () => {
      const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'tuoi-cay';
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
    });
  }

  // Đóng modal
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
    modalConfirmBtn.addEventListener('click', () => {
      closeModal();
      const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'tuoi-cay';
      const durationVal = Number(document.getElementById('manualDuration')?.value) || 5;
      const stateObj = getAppState();
      stateObj.manualSchedules = stateObj.manualSchedules || [];

      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const deviceName = activeTab === 'quat-thong-gio' ? 'Quạt' : 'Máy bơm';

      // Chuyển các lịch đang chạy cũ thành DONE trước khi tạo lịch mới
      stateObj.manualSchedules.forEach(item => {
        if (item.targetTab === activeTab && item.status === 'RUNNING') {
          item.status = 'DONE';
        }
      });

      // Tạo lịch mới ở trạng thái RUNNING
      const newId = Date.now();
      stateObj.manualSchedules.unshift({
        id: newId,
        device: deviceName,
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
      addActivityLog(deviceName, `Kích hoạt ${deviceName.toLowerCase()} thủ công ngay lập tức (${durationVal} phút)`, 'Thành công');
      showToast(`Đã gửi lệnh kích hoạt ${deviceName.toLowerCase()} thành công!`);
      renderManualScheduleTable();
    });
  }
});
