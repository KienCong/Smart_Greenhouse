document.addEventListener('DOMContentLoaded', () => {

  // =========================================================
  // CẤU HÌNH API
  // =========================================================
  const API_BASE_URL = 'http://localhost:8080/api/telemetry';

  // Mapping key backend (raw map) → key frontend
  const SENSOR_KEY_MAP = {
    temp:  'air_temperature',
    air:   'air_humidity',
    soil:  'soil_moisture',
    light: 'light_intensity'
  };

  // Bảng màu chuẩn quy ước theo cảm biến
  const SENSOR_THEMES = {
    temp:  { color: '#ff4d4f', unit: '°C',  name: 'Nhiệt độ không khí' },
    air:   { color: '#1890ff', unit: '%',   name: 'Độ ẩm không khí' },
    soil:  { color: '#13c2c2', unit: '%',   name: 'Độ ẩm đất' },
    light: { color: '#faad14', unit: 'lux', name: 'Cường độ ánh sáng' }
  };

  const chartInstances = {};
  let currentRange = '7d';

  // Dữ liệu hiện tại dùng để xuất CSV (được cập nhật sau mỗi lần fetch)
  let currentChartData = null;

  // =========================================================
  // HELPER: Tính khoảng thời gian từ range key
  // =========================================================
  function getRangeInstants(rangeKey) {
    const now = new Date();
    const to = now.toISOString();
    let from;
    if (rangeKey === '24h') {
      from = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    } else if (rangeKey === '7d') {
      from = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (rangeKey === '30d') {
      from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      from = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    return { from, to };
  }

  // =========================================================
  // HELPER: Format timestamp thành label hiển thị
  // =========================================================
  function formatLabel(isoString, rangeKey) {
    const d = new Date(isoString);
    const pad = n => String(n).padStart(2, '0');
    if (rangeKey === '24h') {
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  }

  // =========================================================
  // HELPER: Format thời gian cập nhật
  // =========================================================
  function formatUpdateTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // =========================================================
  // HELPER: Tạo Gradient Fill
  // =========================================================
  function createGradient(ctx, colorHex) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 190);
    let r = 0, g = 0, b = 0;
    if (colorHex.length === 7) {
      r = parseInt(colorHex.slice(1, 3), 16);
      g = parseInt(colorHex.slice(3, 5), 16);
      b = parseInt(colorHex.slice(5, 7), 16);
    }
    gradient.addColorStop(0,    `rgba(${r}, ${g}, ${b}, 0.32)`);
    gradient.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, 0.02)`);
    gradient.addColorStop(1,    `rgba(${r}, ${g}, ${b}, 0.0)`);
    return gradient;
  }

  // =========================================================
  // RENDER CHART
  // =========================================================
  function renderSensorChart(canvasId, typeKey, labels, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;
    const ctx = canvas.getContext('2d');
    const theme = SENSOR_THEMES[typeKey];

    if (chartInstances[canvasId]) {
      chartInstances[canvasId].destroy();
    }

    const gradientBg = createGradient(ctx, theme.color);

    chartInstances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: theme.name,
          data,
          borderColor: theme.color,
          backgroundColor: gradientBg,
          borderWidth: 2.2,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: theme.color,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: '#ffffff',
            titleColor: '#0f172a',
            bodyColor: '#334155',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: (context) => ` ${theme.name}: ${context.parsed.y} ${theme.unit}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            ticks: {
              color: '#64748b',
              font: { size: 11.5 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8
            }
          },
          y: {
            grid: { color: '#f1f5f9', borderDash: [3, 3], drawBorder: false },
            ticks: {
              color: '#64748b',
              font: { size: 11 },
              callback: (val) => `${val} ${theme.unit}`
            }
          }
        }
      }
    });
  }

  // =========================================================
  // CẬP NHẬT THỐNG KÊ từ Summary API
  // =========================================================
  function updateStatsFromSummary(typeKey, stats, currentVal) {
    const unit = SENSOR_THEMES[typeKey].unit;
    const round1 = v => v != null ? parseFloat(v.toFixed(1)) : '—';

    const elMin = document.getElementById(`${typeKey}Min`);
    const elMax = document.getElementById(`${typeKey}Max`);
    const elAvg = document.getElementById(`${typeKey}Avg`);
    const elCur = document.getElementById(`${typeKey}Current`);

    if (elMin) elMin.textContent = stats ? `${round1(stats.min)} ${unit}` : '—';
    if (elMax) elMax.textContent = stats ? `${round1(stats.max)} ${unit}` : '—';
    if (elAvg) elAvg.textContent = stats ? `${round1(stats.average)} ${unit}` : '—';
    if (elCur && currentVal != null) elCur.textContent = parseFloat(currentVal.toFixed(1));
  }

  // =========================================================
  // HIỂN THỊ TRẠNG THÁI LOADING / LỖI
  // =========================================================
  function setCardLoading(typeKey, loading) {
    const canvasIds = { temp: 'chartTemp', air: 'chartAir', soil: 'chartSoil', light: 'chartLight' };
    const canvas = document.getElementById(canvasIds[typeKey]);
    if (!canvas) return;
    const box = canvas.closest('.sensor-chart-box');
    if (!box) return;
    if (loading) {
      if (!box.querySelector('.chart-loading-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'chart-loading-overlay';
        overlay.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.75);border-radius:8px;font-size:13px;color:#64748b;z-index:10;';
        overlay.textContent = 'Đang tải dữ liệu...';
        box.style.position = 'relative';
        box.appendChild(overlay);
      }
    } else {
      const overlay = box.querySelector('.chart-loading-overlay');
      if (overlay) overlay.remove();
    }
  }

  // =========================================================
  // FETCH: Lấy dữ liệu chart + summary từ API
  // =========================================================
  async function fetchSensorData(fieldId, rangeKey) {
    const { from, to } = getRangeInstants(rangeKey);
    const params = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=500`;

    const [chartRes, summaryRes] = await Promise.all([
      fetch(`${API_BASE_URL}/fields/${fieldId}/chart?${params}`),
      fetch(`${API_BASE_URL}/fields/${fieldId}/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
    ]);

    if (!chartRes.ok) throw new Error(`Chart API lỗi: ${chartRes.status}`);
    if (!summaryRes.ok) throw new Error(`Summary API lỗi: ${summaryRes.status}`);

    const chartData   = await chartRes.json();
    const summaryData = await summaryRes.json();
    return { chartData, summaryData };
  }

  // =========================================================
  // FETCH: Lấy giá trị mới nhất (toàn bộ hệ thống)
  // =========================================================
  async function fetchLatest() {
    const res = await fetch(`${API_BASE_URL}/latest`);
    if (!res.ok) throw new Error(`Latest API lỗi: ${res.status}`);
    return res.json();
  }

  // =========================================================
  // XỬ LÝ DỮ LIỆU CHART: ChartPoint[] → { labels, temp, air, soil, light }
  // =========================================================
  function parseChartPoints(points, rangeKey) {
    const labels = [];
    const temp  = [];
    const air   = [];
    const soil  = [];
    const light = [];

    for (const pt of points) {
      labels.push(formatLabel(pt.timestamp, rangeKey));
      const raw = pt.values || {};
      temp.push( raw[SENSOR_KEY_MAP.temp]  != null ? parseFloat(Number(raw[SENSOR_KEY_MAP.temp]).toFixed(1))  : null);
      air.push(  raw[SENSOR_KEY_MAP.air]   != null ? parseFloat(Number(raw[SENSOR_KEY_MAP.air]).toFixed(1))   : null);
      soil.push( raw[SENSOR_KEY_MAP.soil]  != null ? parseFloat(Number(raw[SENSOR_KEY_MAP.soil]).toFixed(1))  : null);
      light.push(raw[SENSOR_KEY_MAP.light] != null ? parseFloat(Number(raw[SENSOR_KEY_MAP.light]).toFixed(1)) : null);
    }

    return { labels, temp, air, soil, light };
  }

  // =========================================================
  // LOAD CHARTS từ API (có fieldId)
  // =========================================================
  async function loadChartsFromAPI(fieldId, rangeKey) {
    ['temp', 'air', 'soil', 'light'].forEach(k => setCardLoading(k, true));

    try {
      const { chartData, summaryData } = await fetchSensorData(fieldId, rangeKey);

      const parsed = parseChartPoints(chartData.points || [], rangeKey);
      currentChartData = parsed;

      // Render 4 biểu đồ
      renderSensorChart('chartTemp',  'temp',  parsed.labels, parsed.temp);
      renderSensorChart('chartAir',   'air',   parsed.labels, parsed.air);
      renderSensorChart('chartSoil',  'soil',  parsed.labels, parsed.soil);
      renderSensorChart('chartLight', 'light', parsed.labels, parsed.light);

      // Cập nhật Summary (Min / Max / Avg)
      const stats = summaryData.statistics || {};
      const lastIdx = (arr) => arr.filter(v => v != null).at(-1) ?? null;

      updateStatsFromSummary('temp',  stats[SENSOR_KEY_MAP.temp],  lastIdx(parsed.temp));
      updateStatsFromSummary('air',   stats[SENSOR_KEY_MAP.air],   lastIdx(parsed.air));
      updateStatsFromSummary('soil',  stats[SENSOR_KEY_MAP.soil],  lastIdx(parsed.soil));
      updateStatsFromSummary('light', stats[SENSOR_KEY_MAP.light], lastIdx(parsed.light));

      // Cập nhật thời gian làm mới
      const nowStr = formatUpdateTime(new Date());
      ['temp', 'air', 'soil', 'light'].forEach(k => {
        const tEl = document.getElementById(`${k}Time`);
        if (tEl) tEl.textContent = nowStr;
      });

    } catch (err) {
      console.error('[Sensors] Lỗi tải dữ liệu từ API:', err);
      const isCorsOrNetwork = err instanceof TypeError && err.message.includes('fetch');
      if (isCorsOrNetwork) {
        showToast('⚠️ Không thể kết nối backend (kiểm tra CORS hoặc server port 8080)');
      } else {
        showToast('⚠️ Không thể tải dữ liệu cảm biến: ' + err.message);
      }
    } finally {
      ['temp', 'air', 'soil', 'light'].forEach(k => setCardLoading(k, false));
    }
  }

  // =========================================================
  // LOAD CURRENT VALUE từ /latest API
  // =========================================================
  async function loadLatestValues() {
    try {
      const latest = await fetchLatest();
      const raw = latest.raw || {};
      const nowStr = formatUpdateTime(new Date());

      const mapping = [
        { key: 'temp',  apiKey: SENSOR_KEY_MAP.temp },
        { key: 'air',   apiKey: SENSOR_KEY_MAP.air },
        { key: 'soil',  apiKey: SENSOR_KEY_MAP.soil },
        { key: 'light', apiKey: SENSOR_KEY_MAP.light }
      ];

      mapping.forEach(({ key, apiKey }) => {
        const val = raw[apiKey];
        const elCur = document.getElementById(`${key}Current`);
        const tEl   = document.getElementById(`${key}Time`);
        if (elCur && val != null) elCur.textContent = parseFloat(Number(val).toFixed(1));
        if (tEl) tEl.textContent = nowStr;
      });
    } catch (err) {
      console.warn('[Sensors] Không lấy được giá trị mới nhất:', err);
    }
  }

  // =========================================================
  // HELPER: Lấy Field ID hiện tại (hỗ trợ test & production)
  // =========================================================
  function getFieldId() {
    const state = typeof getAppState === 'function' ? getAppState() : {};
    const zones = state.zones || [];
    const selectedZoneName = state.selectedZone;
    const zone = zones.find(z => z.name === selectedZoneName) || zones[0];

    // TODO: Khi deploy thực tế, thay bằng: return zone ? zone.fieldId : null;
    return '6ae17860acc00a053d9c7a7e'; // Hardcode để test
  }

  // =========================================================
  // ENTRY POINT: Lấy fieldId từ state, sau đó load dữ liệu
  // =========================================================
  async function initSensorsPage() {
    const fieldId = getFieldId();
    if (!fieldId) {
      // Không có fieldId → chỉ thử lấy latest (không cần fieldId)
      await loadLatestValues();
      showToast('⚠️ Chưa cấu hình Field ID cho vườn. Hiển thị giá trị mới nhất.');
      return;
    }

    // Tải đồng thời: giá trị hiện tại + chart theo range
    await Promise.all([
      loadLatestValues(),
      loadChartsFromAPI(fieldId, currentRange)
    ]);
  }

  // Khởi chạy lần đầu
  initSensorsPage();

  // =========================================================
  // XỬ LÝ NÚT BỘ LỌC THỜI GIAN
  // =========================================================
  const filterBtns = document.querySelectorAll('.time-btn-pill');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.getAttribute('data-range') || '7d';

      showToast(`Đang tải dữ liệu ${btn.textContent.trim().toLowerCase()}...`);

      const fieldId = getFieldId();

      if (fieldId) {
        await loadChartsFromAPI(fieldId, currentRange);
        showToast(`Đã tải dữ liệu ${btn.textContent.trim().toLowerCase()}`);
      } else {
        showToast('⚠️ Chưa cấu hình Field ID cho vườn');
      }
    });
  });

  // =========================================================
  // NÚT TÙY CHỈNH NGÀY (date range picker)
  // =========================================================
  const startDateInput = document.getElementById('sensorStartDate');
  const endDateInput   = document.getElementById('sensorEndDate');

  async function loadCustomRange() {
    if (!startDateInput || !endDateInput) return;
    const fromVal = startDateInput.value;
    const toVal   = endDateInput.value;
    if (!fromVal || !toVal) return;

    const from = new Date(fromVal + 'T00:00:00').toISOString();
    const to   = new Date(toVal   + 'T23:59:59').toISOString();

    const fieldId = getFieldId();

    if (!fieldId) {
      showToast('⚠️ Chưa cấu hình Field ID cho vườn');
      return;
    }

    ['temp', 'air', 'soil', 'light'].forEach(k => setCardLoading(k, true));
    filterBtns.forEach(b => b.classList.remove('active'));

    try {
      const params = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=500`;
      const [chartRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/fields/${fieldId}/chart?${params}`),
        fetch(`${API_BASE_URL}/fields/${fieldId}/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      ]);

      if (!chartRes.ok || !summaryRes.ok) throw new Error('API lỗi');

      const chartData   = await chartRes.json();
      const summaryData = await summaryRes.json();

      const parsed = parseChartPoints(chartData.points || [], 'custom');
      currentChartData = parsed;

      renderSensorChart('chartTemp',  'temp',  parsed.labels, parsed.temp);
      renderSensorChart('chartAir',   'air',   parsed.labels, parsed.air);
      renderSensorChart('chartSoil',  'soil',  parsed.labels, parsed.soil);
      renderSensorChart('chartLight', 'light', parsed.labels, parsed.light);

      const stats  = summaryData.statistics || {};
      const lastOf = arr => arr.filter(v => v != null).at(-1) ?? null;
      updateStatsFromSummary('temp',  stats[SENSOR_KEY_MAP.temp],  lastOf(parsed.temp));
      updateStatsFromSummary('air',   stats[SENSOR_KEY_MAP.air],   lastOf(parsed.air));
      updateStatsFromSummary('soil',  stats[SENSOR_KEY_MAP.soil],  lastOf(parsed.soil));
      updateStatsFromSummary('light', stats[SENSOR_KEY_MAP.light], lastOf(parsed.light));

      const nowStr = formatUpdateTime(new Date());
      ['temp', 'air', 'soil', 'light'].forEach(k => {
        const tEl = document.getElementById(`${k}Time`);
        if (tEl) tEl.textContent = nowStr;
      });

      showToast(`Đã tải dữ liệu từ ${fromVal} đến ${toVal}`);
    } catch (err) {
      console.error('[Sensors] Lỗi tải range tùy chỉnh:', err);
      showToast('⚠️ Không thể tải dữ liệu cho khoảng thời gian này');
    } finally {
      ['temp', 'air', 'soil', 'light'].forEach(k => setCardLoading(k, false));
    }
  }

  if (endDateInput) {
    endDateInput.addEventListener('change', loadCustomRange);
  }
  if (startDateInput) {
    startDateInput.addEventListener('change', () => {
      if (endDateInput && endDateInput.value) loadCustomRange();
    });
  }

  // =========================================================
  // NÚT LÀM MỚI
  // =========================================================
  const refreshBtn = document.getElementById('refreshSensorsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      showToast('Đang làm mới dữ liệu cảm biến...');
      await initSensorsPage();
      showToast('Đã làm mới dữ liệu cảm biến');
    });
  }

  // =========================================================
  // NÚT XUẤT CSV
  // =========================================================
  const exportBtn = document.getElementById('exportSensorBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const d = currentChartData;
      if (!d || !d.labels || !d.labels.length) {
        showToast('Không có dữ liệu để xuất');
        return;
      }
      let csvContent = 'Moc thoi gian,Nhiet do (C),Do am khong khi (%),Do am dat (%),Anh sang (lux)\n';
      for (let i = 0; i < d.labels.length; i++) {
        csvContent += `${d.labels[i]},${d.temp[i] ?? ''},${d.air[i] ?? ''},${d.soil[i] ?? ''},${d.light[i] ?? ''}\n`;
      }
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart_greenhouse_sensors_${currentRange}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Đã xuất file dữ liệu cảm biến CSV thành công');
    });
  }
});
