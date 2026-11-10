# Tích hợp API Backend cho trang Điều khiển thiết bị (`control.js`)

> **Ngày thực hiện:** 07/11/2026  
> **File thay đổi:**  
> - `FE/js/control.js` (kết nối API thực tế, cơ chế fallback, hỗ trợ lệnh tức thời và lập lịch)  
> - `backend/automation-service/src/main/java/com/smartgreenhouse/automation/controller/DeviceCommandController.java` (`@CrossOrigin`)  
> - `backend/automation-service/src/main/java/com/smartgreenhouse/automation/controller/DeviceScheduleController.java` (`@CrossOrigin`, API get & delete schedules)  
> - `backend/automation-service/src/main/java/com/smartgreenhouse/automation/service/DeviceScheduleService.java`  
> - `backend/automation-service/src/main/java/com/smartgreenhouse/automation/repository/DeviceScheduleRepository.java`

---

## 1. Tổng quan kiến trúc

Trang **Điều khiển thiết bị** (`control.html` & `control.js`) cung cấp 2 chế độ:
1. **Chế độ Tự động (AUTO):** Cài đặt ngưỡng cảm biến (độ ẩm đất, nhiệt độ) và thời gian hoạt động để hệ thống tự động kích hoạt bơm/quạt.
2. **Chế độ Thủ công (MANUAL):**
   - **Kích hoạt ngay (Tưới ngay / Bật quạt ngay):** Gửi lệnh điều khiển tức thời xuống ESP32 qua MQTT (`ON` / `OFF`).
   - **Đặt lịch hẹn giờ:** Gửi lịch trình lên máy chủ; `DeviceScheduleExecutor` của backend sẽ tự động phát lệnh `ON` khi tới giờ và `OFF` khi kết thúc thời lượng.
   - **Xem danh sách lịch:** Đồng bộ dữ liệu lịch trình từ MongoDB.

```
Frontend (control.js)
        │
        ├── [1] POST /devices/{deviceId}/commands (ON/OFF tức thì)
        ├── [2] POST /schedules/{fieldId}         (Đặt lịch hẹn giờ)
        └── [3] GET  /schedules/{fieldId}         (Lấy danh sách lịch)
        │
        ▼
API Gateway (Port 8080) / Trực tiếp (Port 8085)
        │
        ▼
automation-service (Spring Boot)
        │
        ├── Lưu trữ MongoDB: collections `device_commands`, `device_schedules`
        └── MqttCommandPublisher ──► MQTT Broker (1883) ──► ESP32 Gateway
```

---

## 2. Danh sách API Backend sử dụng

Base URL Gateway: `http://localhost:8080/api/automation`  
Base URL Trực tiếp (Fallback): `http://localhost:8085/api/automation`

| Endpoint | Method | Chức năng | Body / Tham số |
|---|---|---|---|
| `/devices/{deviceId}/commands` | `POST` | Gửi lệnh bật (`ON`) hoặc tắt (`OFF`) tức thời | `{ "fieldId": "...", "action": "ON" \| "OFF" }` |
| `/commands/{commandId}` | `GET` | Kiểm tra trạng thái thực thi của lệnh | `commandId` (Path variable) |
| `/schedules/{fieldId}` | `POST` | Tạo lịch hẹn giờ hoạt động cho thiết bị | `{ "deviceRef": "...", "startTime": "...", "durationSeconds": 300, "triggerType": "MANUAL" }` |
| `/schedules/{fieldId}` | `GET` | Lấy danh sách lịch đã tạo của khu vực | `fieldId` (Path variable) |
| `/schedules/{scheduleId}` | `DELETE` | Hủy / xóa lịch hẹn giờ | `scheduleId` (Path variable) |
| `/fields/{fieldId}/history` | `GET` | Lấy lịch sử tất cả lệnh điều khiển của khu vực | `fieldId` (Path variable) |

---

## 3. Quy ước thiết bị (`deviceId`)

Khớp với quy ước trong mã nguồn firmware ESP32 (`esp32_gateway/src/commands/CommandDispatcher.cpp`):

| Tab giao diện | Thiết bị | `deviceId` / `deviceRef` |
|---|---|---|
| **Tưới cây** (`tuoi-cay`) | Máy bơm nước | `PUMP_01` |
| **Quạt thông gió** (`quat-thong-gio`) | Quạt thông gió | `FAN_01` |

---

## 4. Các điểm cải tiến trong `FE/js/control.js`

1. **Auto-fallback giữa API Gateway và Direct Service:**
   - Mặc định gọi qua Gateway (`http://localhost:8080/api/automation`).
   - Nếu Gateway chưa bật hoặc gặp lỗi, tự động chuyển sang gọi trực tiếp `http://localhost:8085/api/automation`.
2. **Kích hoạt ngay (Run Now):**
   - Mở modal xác nhận $\rightarrow$ Người dùng bấm xác nhận $\rightarrow$ Gửi `POST /devices/{deviceId}/commands` với `action: "ON"`.
   - Thiết lập hẹn giờ trên client tự động gửi `action: "OFF"` sau khi hết thời lượng chạy cài đặt.
3. **Nút Dừng thiết bị (Stop Action):**
   - Khi bấm "Dừng" trên dòng lịch đang chạy (`RUNNING`), ngay lập tức gửi lệnh `POST /devices/{deviceId}/commands` với `action: "OFF"`.
4. **Đặt lịch hẹn giờ:**
   - Kiểm tra thời điểm chọn có ở tương lai hay không.
   - Định dạng ISO 8601 kèm time zone offset chuẩn (ví dụ `2026-11-08T06:00:00+07:00`) để Spring Boot ánh xạ chính xác vào `OffsetDateTime`.
   - Gửi `POST /schedules/{fieldId}`.
5. **Hiển thị danh sách lịch thông minh:**
   - Ưu tiên đồng bộ danh sách lịch từ MongoDB qua `GET /schedules/{fieldId}`.
   - Tự động tính toán trạng thái (`PENDING`, `RUNNING`, `DONE`) dựa trên `startTime` và `endTime`.
   - Nếu chưa kết nối được máy chủ, tự động chuyển về dữ liệu lưu tạm trong `localStorage`.

---

## 5. Cập nhật ở Backend `automation-service`

1. **Thêm `@CrossOrigin(origins = "*")`:**
   - Đã thêm vào `DeviceCommandController.java` và `DeviceScheduleController.java` để loại bỏ rào cản CORS của trình duyệt web.
2. **Bổ sung endpoint tra cứu và xóa lịch:**
   - `GET /api/automation/schedules/{fieldId}`: Lấy danh sách lịch theo khu vực sắp xếp theo thời gian mới nhất.
   - `DELETE /api/automation/schedules/{scheduleId}`: Cho phép người dùng hủy lịch đã tạo.

