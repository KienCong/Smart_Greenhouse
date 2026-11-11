// =========================================================
// CẤU HÌNH API
// =========================================================
const OV_API_BASE = 'http://localhost:8080/api/telemetry';

// =========================================================
// LẤY GIÁ TRỊ CẢM BIẾN MỚI NHẤT TỪ API
// =========================================================
async function fetchOverviewSensorData() {
  try {
    const res = await fetch(`${OV_API_BASE}/latest`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const raw = data.raw || {};

    const tempEl  = document.getElementById('ovTempValue');
    const airEl   = document.getElementById('ovAirValue');
    const soilEl  = document.getElementById('ovSoilValue');
    const lightEl = document.getElementById('ovLightValue');

    if (tempEl && raw.air_temperature != null) {
      tempEl.textContent = `${Number(raw.air_temperature).toFixed(1)}°C`;
    }
    if (airEl && raw.air_humidity != null) {
      airEl.textContent = `${Number(raw.air_humidity).toFixed(1)}%`;
    }
    if (soilEl && raw.soil_moisture != null) {
      soilEl.textContent = `${Number(raw.soil_moisture).toFixed(1)}%`;
    } else if (soilEl) {
      soilEl.textContent = '—%'; // Không có dữ liệu độ ẩm đất
    }
    if (lightEl && raw.light_intensity != null) {
      lightEl.textContent = `${Math.round(raw.light_intensity)} lux`;
    }

    console.info('[Overview] Cập nhật cảm biến:', raw);
  } catch (err) {
    console.warn('[Overview] Không thể tải dữ liệu cảm biến:', err.message);
    // Giữ nguyên giá trị mặc định — không hiển thị lỗi để không phá vỡ UI
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const state = getAppState();
  const pumpToggle = document.getElementById('ovPumpToggle');
  const pumpLabel = document.getElementById('ovPumpLabel');
  const fanToggle = document.getElementById('ovFanToggle');
  const fanLabel = document.getElementById('ovFanLabel');

  function syncUI() {
    const s = getAppState();
    pumpToggle.checked = s.pumpOn;
    pumpLabel.textContent = s.pumpOn ? 'BẬT' : 'TẮT';
    pumpLabel.style.color = s.pumpOn ? '#16a34a' : '#64748b';

    fanToggle.checked = s.fanOn;
    fanLabel.textContent = s.fanOn ? 'BẬT' : 'TẮT';
    fanLabel.style.color = s.fanOn ? '#16a34a' : '#64748b';
    const pBadge = document.getElementById('ovPumpStatusBadge');
    if (pBadge) {
      pBadge.textContent = s.pumpOn ? 'ĐANG BẬT' : 'ĐANG TẮT';
      pBadge.style.color = s.pumpOn ? '#16a34a' : '#64748b';
      pBadge.style.background = s.pumpOn ? 'rgba(34,197,94,0.12)' : '#f1f5f9';
    }

    const fBadge = document.getElementById('ovFanStatusBadge');
    if (fBadge) {
      fBadge.textContent = s.fanOn ? 'ĐANG BẬT' : 'ĐANG TẮT';
      fBadge.style.color = s.fanOn ? '#16a34a' : '#64748b';
      fBadge.style.background = s.fanOn ? 'rgba(34,197,94,0.12)' : '#f1f5f9';
    }
  }

  syncUI();

  pumpToggle.addEventListener('change', (e) => {
    const s = getAppState();
    s.pumpOn = e.target.checked;
    saveAppState(s);
    addActivityLog('Máy bơm', s.pumpOn ? `Bật bơm (${s.pumpRunSec}s)` : 'Tắt bơm', 'Thành công');
    syncUI();
    showToast(s.pumpOn ? 'Đã bật Máy bơm nước' : 'Đã tắt Máy bơm nước');
  });

  fanToggle.addEventListener('change', (e) => {
    const s = getAppState();
    s.fanOn = e.target.checked;
    saveAppState(s);
    addActivityLog('Quạt', s.fanOn ? `Bật quạt (${s.fanRunMin}p)` : 'Tắt quạt', 'Thành công');
    syncUI();
    showToast(s.fanOn ? 'Đã bật Quạt thông gió' : 'Đã tắt Quạt thông gió');
  });

  // ================= DEVICE ACTIVITY CHART (BƠM & QUẠT) =================
  let deviceChartInstance = null;
  const canvasActivity = document.getElementById('deviceActivityChart');

  function renderDeviceActivityChart(pumpData, fanData) {
    if (!canvasActivity || !window.Chart) return;
    const ctx = canvasActivity.getContext('2d');
    const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];

    if (deviceChartInstance) {
      deviceChartInstance.destroy();
    }

    deviceChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: hours,
        datasets: [
          {
            label: 'Máy bơm nước (phút)',
            data: pumpData,
            backgroundColor: '#1890ff',
            hoverBackgroundColor: '#096dd9',
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          },
          {
            label: 'Quạt thông gió (phút)',
            data: fanData,
            backgroundColor: '#fa8c16',
            hoverBackgroundColor: '#d46b08',
            borderRadius: 4,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false // Đã có legend tùy chỉnh ở header card
          },
          tooltip: {
            backgroundColor: '#ffffff',
            titleColor: '#0f172a',
            bodyColor: '#334155',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.parsed.y} phút`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 60,
            ticks: {
              stepSize: 15,
              color: '#64748b',
              font: { size: 11 },
              callback: (val) => `${val}p`
            },
            grid: {
              color: '#f1f5f9',
              borderDash: [3, 3],
              drawBorder: false
            }
          },
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: { size: 11.5 }
            }
          }
        }
      }
    });

    // Cập nhật tổng thời lượng chạy hôm nay
    const totalPump = pumpData.reduce((a, b) => a + b, 0);
    const pumpRuns = pumpData.filter(v => v > 0).length;
    const totalFan = fanData.reduce((a, b) => a + b, 0);
    const fanRuns = fanData.filter(v => v > 0).length;

    const pumpSumEl = document.getElementById('ovPumpRunSummary');
    if (pumpSumEl) {
      pumpSumEl.innerHTML = `${totalPump} phút <span style="font-size:12px; font-weight:400; color:#64748b;">(${pumpRuns} lần)</span>`;
    }

    const fanSumEl = document.getElementById('ovFanRunSummary');
    if (fanSumEl) {
      fanSumEl.innerHTML = `${totalFan} phút <span style="font-size:12px; font-weight:400; color:#64748b;">(${fanRuns} lần)</span>`;
    }
  }

  // Khởi tạo dữ liệu hoạt động ban đầu
  const initialPumpData = [0, 0, 15, 20, 10, 0, 15, 0];
  const initialFanData = [0, 0, 20, 35, 45, 30, 10, 0];
  renderDeviceActivityChart(initialPumpData, initialFanData);

  // ================= NÚT LÀM MỚI (REFRESH) =================
  const refreshBtn = document.getElementById('refreshOverviewBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      refreshBtn.querySelector('span').textContent = 'Đang tải...';

      await fetchOverviewSensorData();

      // Cập nhật lại thời lượng hoạt động thiết bị (giữ dữ liệu hiện có)
      const newPumpData = [0, 0, 15, 20, 10, 0, 15, 5];
      const newFanData = [0, 0, 20, 35, 45, 30, 15, 0];
      renderDeviceActivityChart(newPumpData, newFanData);

      syncUI();
      refreshBtn.disabled = false;
      refreshBtn.querySelector('span').textContent = 'Làm mới';
      showToast('Đã làm mới dữ liệu tổng quan');
    });
  }

  // Tải dữ liệu cảm biến ngay khi trang mở
  fetchOverviewSensorData();

  // Tự động làm mới mỗi 60 giây
  setInterval(fetchOverviewSensorData, 60_000);
});
