document.addEventListener('DOMContentLoaded', () => {
  // Bảng màu chuẩn quy ước theo cảm biến (Cassava Smart Farming style)
  const SENSOR_THEMES = {
    temp: { color: '#ff4d4f', unit: '°C', name: 'Nhiệt độ không khí' },
    air: { color: '#1890ff', unit: '%', name: 'Độ ẩm không khí' },
    soil: { color: '#13c2c2', unit: '%', name: 'Độ ẩm đất' },
    light: { color: '#faad14', unit: 'lux', name: 'Cường độ ánh sáng' }
  };

  // Dữ liệu mẫu theo các khung thời gian
  const DATA_SETS = {
    '24h': {
      labels: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '24:00'],
      temp: [23.5, 23.1, 24.0, 26.8, 32.4, 34.2, 30.1, 27.5, 28.4],
      air: [88.2, 92.1, 86.4, 76.5, 56.2, 58.7, 68.3, 75.0, 72.3],
      soil: [46.5, 46.2, 45.8, 44.1, 40.2, 38.6, 41.5, 43.0, 42.7],
      light: [0, 0, 120, 480, 890, 985, 410, 30, 0]
    },
    '7d': {
      labels: ['22/04', '23/04', '24/04', '25/04', '26/04', '27/04', '28/04'],
      temp: [26.8, 27.2, 28.5, 29.1, 27.8, 26.9, 28.4],
      air: [74.5, 76.0, 71.2, 68.4, 73.1, 75.8, 72.3],
      soil: [40.1, 42.5, 45.0, 43.8, 41.2, 44.6, 42.7],
      light: [510, 580, 620, 540, 490, 530, 562]
    },
    '30d': {
      labels: ['30/03', '04/04', '09/04', '14/04', '19/04', '24/04', '28/04'],
      temp: [25.4, 26.1, 27.0, 28.9, 29.5, 27.3, 28.4],
      air: [76.8, 74.2, 72.0, 69.5, 68.0, 73.5, 72.3],
      soil: [44.0, 43.2, 45.8, 42.0, 40.5, 43.1, 42.7],
      light: [480, 510, 550, 600, 580, 540, 562]
    }
  };

  const chartInstances = {};
  let currentRange = '7d';

  // Hàm tạo Gradient Fill 2 tầng kiểu AreaChart Recharts
  function createGradient(ctx, colorHex) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 190);
    // Chuyển hex sang rgba
    let r = 0, g = 0, b = 0;
    if (colorHex.length === 7) {
      r = parseInt(colorHex.slice(1, 3), 16);
      g = parseInt(colorHex.slice(3, 5), 16);
      b = parseInt(colorHex.slice(5, 7), 16);
    }
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.32)`);
    gradient.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, 0.02)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
    return gradient;
  }

  // Khởi tạo hoặc cập nhật biểu đồ
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
        labels: labels,
        datasets: [{
          label: theme.name,
          data: data,
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
        interaction: {
          mode: 'index',
          intersect: false
        },
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
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: { size: 11.5 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8
            }
          },
          y: {
            grid: {
              color: '#f1f5f9',
              borderDash: [3, 3],
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: { size: 11 },
              callback: (val) => `${val} ${theme.unit}`
            }
          }
        }
      }
    });

    // Cập nhật các giá trị thống kê Min / Max / Avg / Current lên giao diện
    updateStatsDisplay(typeKey, data);
  }

  function updateStatsDisplay(typeKey, data) {
    if (!data || !data.length) return;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const sum = data.reduce((a, b) => a + b, 0);
    const avg = (sum / data.length).toFixed(1);
    const current = data[data.length - 1];
    const unit = SENSOR_THEMES[typeKey].unit;

    const elMin = document.getElementById(`${typeKey}Min`);
    const elMax = document.getElementById(`${typeKey}Max`);
    const elAvg = document.getElementById(`${typeKey}Avg`);
    const elCur = document.getElementById(`${typeKey}Current`);

    if (elMin) elMin.textContent = `${min} ${unit}`;
    if (elMax) elMax.textContent = `${max} ${unit}`;
    if (elAvg) elAvg.textContent = `${avg} ${unit}`;
    if (elCur) elCur.textContent = current;
  }

  // Tải toàn bộ 4 biểu đồ theo khung thời gian
  function loadAllCharts(rangeKey) {
    const d = DATA_SETS[rangeKey] || DATA_SETS['7d'];
    renderSensorChart('chartTemp', 'temp', d.labels, d.temp);
    renderSensorChart('chartAir', 'air', d.labels, d.air);
    renderSensorChart('chartSoil', 'soil', d.labels, d.soil);
    renderSensorChart('chartLight', 'light', d.labels, d.light);
  }

  // Khởi tạo hiển thị lần đầu
  loadAllCharts(currentRange);

  // Xử lý bộ lọc nút pill
  const filterBtns = document.querySelectorAll('.time-btn-pill');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRange = btn.getAttribute('data-range') || '7d';
      loadAllCharts(currentRange);
      showToast(`Đã tải dữ liệu lịch sử ${btn.textContent.trim().toLowerCase()}`);
    });
  });

  // Nút làm mới
  const refreshBtn = document.getElementById('refreshSensorsBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadAllCharts(currentRange);
      const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
      ['temp', 'air', 'soil', 'light'].forEach(k => {
        const tEl = document.getElementById(`${k}Time`);
        if (tEl) tEl.textContent = nowStr;
      });
      showToast('Đã làm mới dữ liệu cảm biến');
    });
  }

  // Nút xuất CSV
  const exportBtn = document.getElementById('exportSensorBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const d = DATA_SETS[currentRange] || DATA_SETS['7d'];
      let csvContent = "Moc thoi gian,Nhiet do (C),Do am khong khi (%),Do am dat (%),Anh sang (lux)\n";
      for (let i = 0; i < d.labels.length; i++) {
        csvContent += `${d.labels[i]},${d.temp[i]},${d.air[i]},${d.soil[i]},${d.light[i]}\n`;
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
