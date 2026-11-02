# ESP32 Greenhouse Gateway

Dự án Gateway trung tâm cho hệ thống nhà kính thông minh (Smart Greenhouse) xây dựng trên nền tảng **ESP32** và **PlatformIO (Arduino Framework)**.

---

## 📋 Mục lục
1. [Yêu cầu hệ thống & Môi trường](#1-yêu-cầu-hệ-thống--môi-trường)
2. [Cấu hình hệ thống trước khi nạp](#2-cấu-hình-hệ-thống-trước-khi-nạp)
3. [Hướng dẫn Build (Biên dịch mã nguồn)](#3-hướng-dẫn-build-biên-dịch-mã-nguồn)
4. [Hướng dẫn Nạp Firmware vào ESP32 (Upload)](#4-hướng-dẫn-nạp-firmware-vào-esp32-upload)
5. [Theo dõi Serial Monitor (Xem Log)](#5-theo-dõi-serial-monitor-xem-log)
6. [Xử lý sự cố thường gặp (Troubleshooting)](#6-xử-lý-sự-cố-thường-gặp-troubleshooting)
7. [Cấu trúc mã nguồn](#7-cấu-trúc-mã-nguồn)

---

## 1. Yêu cầu hệ thống & Môi trường

1. **Phần cứng:**
   * Board **ESP32 Dev Module** (ESP32-WROOM-32 / NodeMCU-32S / ESP32 30-pin hoặc 38-pin).
   * Cáp Micro-USB hoặc Type-C có chức năng truyền dữ liệu (Data Cable).
   * Máy tính đã cài Driver nạp chip nạp tương ứng (thường là **CP210x** hoặc **CH340/CH341**).

2. **Phần mềm:**
   * **Visual Studio Code** (VS Code).
   * Extension **PlatformIO IDE** (cài đặt trực tiếp từ Extensions Marketplace trong VS Code).

---

## 2. Cấu hình hệ thống trước khi nạp

Mở file [`include/app_config.h`](include/app_config.h) và cập nhật các thông số tương ứng với môi trường mạng của bạn:

```c
// 1. Cấu hình WiFi
#define WIFI_SSID       "TEN_WIFI_CUA_BAN"       // Tên WiFi (hỗ trợ băng tần 2.4GHz)
#define WIFI_PASSWORD   "MAT_KHAU_WIFI"          // Mật khẩu WiFi

// 2. Cấu hình MQTT Broker
// QUAN TRỌNG: Phải là địa chỉ IP LAN của máy tính/server chạy Mosquitto Broker.
// KHÔNG dùng "localhost" hay "127.0.0.1" vì ESP32 là thiết bị độc lập.
#define MQTT_HOST       "192.168.1.100"          // Thay bằng IP LAN thực tế (kiểm tra bằng ipconfig)
#define MQTT_PORT       1883

// 3. Cấu hình Gateway & Topic
#define FIELD_ID        "field01"
#define GATEWAY_ID      "gateway01"
#define MQTT_CLIENT_ID  "esp32-gateway-01"
#define MQTT_TOPIC_PREFIX "greenhouse"

// 4. Cấu hình phần cứng
#define LED_PIN         2                        // LED báo trạng thái (thường là GPIO 2)
#define LED_ACTIVE_HIGH 1                        // 1: Mức HIGH sáng, 0: Mức LOW sáng
```

---

## 3. Hướng dẫn Build (Biên dịch mã nguồn)

### Cách 1: Dùng giao diện VS Code (Khuyên dùng)
1. Mở thư mục `esp32_gateway` bằng VS Code.
2. Nhìn xuống thanh trạng thái màu xanh/tím ở cạnh dưới màn hình VS Code:
   * Nhấp vào biểu tượng **dấu tích (✓)** (`PlatformIO: Build`).
3. Hoặc vào biểu tượng **PlatformIO** (hình đầu người ngoài hành tinh ở thanh bên trái) -> Chọn `Default` -> **Build**.

### Cách 2: Dùng dòng lệnh (Terminal / PowerShell)
Mở Terminal trong thư mục `esp32_gateway` và chạy lệnh:

* Nếu lệnh `pio` đã có trong PATH:
  ```powershell
  pio run
  ```
* Nếu chưa gán biến môi trường, sử dụng trực tiếp PlatformIO Core:
  ```powershell
  & "$env:USERPROFILE\.platformio\penv\Scripts\platformio.exe" run
  ```

> **Ghi chú về thư mục build:** Trong `platformio.ini`, dự án đã được định cấu hình `build_dir = C:/Users/<User>/.pio_builds/esp32_gateway` để tránh xung đột đường dẫn tiếng Việt có dấu (`Năm 4`).

---

## 4. Hướng dẫn Nạp Firmware vào ESP32 (Upload)

1. Cắm cáp USB nối ESP32 với máy tính.
2. Kiểm tra cổng COM:
   * Mở **Device Manager** trên Windows -> mục **Ports (COM & LPT)** xem ESP32 nhận cổng nào (ví dụ: `COM3`, `COM4`...).
3. Tiến hành nạp:

### Cách 1: Nạp qua giao diện VS Code
* Nhấp vào biểu tượng **mũi tên trỏ sang phải (➔)** (`PlatformIO: Upload`) ở thanh trạng thái dưới cùng của VS Code.

### Cách 2: Nạp qua dòng lệnh Terminal
```powershell
pio run -t upload
```
Hoặc:
```powershell
& "$env:USERPROFILE\.platformio\penv\Scripts\platformio.exe" run -t upload
```

> **Mẹo (Tip):** Nếu phần mềm hiển thị dòng chữ `Connecting........_____.....` rồi báo lỗi timeout không nạp được:
> * Hãy **nhấn và giữ nút `BOOT` (hoặc `IO0`)** trên bo mạch ESP32 ngay khi thấy chữ `Connecting...`, sau khi bắt đầu nạp được thì thả tay ra.

---

## 5. Theo dõi Serial Monitor (Xem Log)

Sau khi nạp xong, bạn có thể theo dõi tiến trình khởi động, trạng thái kết nối WiFi và MQTT qua Serial Monitor:

1. **Cách mở:**
   * Nhấp vào biểu tượng **hình ổ cắm / phích cắm** (`PlatformIO: Serial Monitor`) ở thanh dưới cùng của VS Code.
   * Hoặc gõ lệnh:
     ```powershell
     pio device monitor
     ```
2. **Tốc độ Baud:** Dự án sử dụng baudrate `115200` (đã cấu hình sẵn trong `platformio.ini`).
3. **Log mẫu khi chạy thành công:**
   ```text
   ================================
    ESP32 GREENHOUSE GATEWAY
   ================================
   [LED] OFF
   [WIFI] Connecting to MyHomeWiFi
   .....
   [WIFI] Connected
   [WIFI] IP: 192.168.1.150
   [MQTT] Command topic:
   greenhouse/field01/devices/PUMP_01/command
   [MQTT] Connecting...
   [MQTT] Connected
   [MQTT] Subscribed successfully
   ```

---

## 6. Xử lý sự cố thường gặp (Troubleshooting)

| Lỗi | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **`A fatal error occurred: Failed to connect to ESP32: Timed out...`** | ESP32 không tự nhảy vào chế độ Bootloader | Giữ nút `BOOT` trên board ESP32 khi terminal hiện chữ `Connecting...` |
| **Không tìm thấy cổng COM trong Device Manager** | Thiếu driver USB-to-UART hoặc cáp USB chỉ là cáp sạc | 1. Cài driver **CP210x** hoặc **CH340**.<br>2. Đổi cáp USB có khả năng truyền dữ liệu. |
| **`[WIFI] Initial connection timeout`** | Sai SSID/Password hoặc WiFi phát ở tần số 5GHz | Kiểm tra lại `app_config.h`. ESP32 chỉ kết nối được sóng WiFi tần số **2.4GHz**. |
| **`[MQTT] Failed, state=-2`** | Không kết nối được đến máy chủ MQTT Broker | 1. Đảm bảo broker Mosquitto đang chạy.<br>2. Kiểm tra tường lửa (Firewall) trên máy tính chạy Mosquitto đã mở port `1883`.<br>3. Kiểm tra xem máy chạy Mosquitto đã cấu hình `listener 1883 0.0.0.0` và `allow_anonymous true` chưa. |
| **`cannot open map file ... No such file or directory`** | Đường dẫn chứa ký tự Unicode tiếng Việt | Đã được khắc phục tự động bằng biến `build_dir` trong file `platformio.ini`. |

---

## 7. Cấu trúc mã nguồn

```text
esp32_gateway/
├── include/
│   └── app_config.h             # Cấu hình chân GPIO, WiFi, MQTT, Topic
├── src/
│   ├── commands/
│   │   ├── CommandDispatcher.h  # Khai báo điều phối lệnh điều khiển
│   │   └── CommandDispatcher.cpp# Xử lý lệnh điều khiển (bơm ON/OFF,...)
│   ├── mqtt/
│   │   ├── MqttManager.h        # Khai báo quản lý MQTT (non-blocking)
│   │   ├── MqttManager.cpp      # Quản lý kết nối, nhận & gửi MQTT
│   │   ├── TopicBuilder.h       # Định dạng quy chuẩn topic MQTT
│   │   └── TopicBuilder.cpp
│   ├── network/
│   │   ├── WifiManager.h        # Khai báo quản lý kết nối WiFi (non-blocking)
│   │   └── WifiManager.cpp      # Quản lý kết nối & tự động reconnect WiFi
│   ├── system/
│   │   ├── LedStatus.h          # Điều khiển LED trạng thái
│   │   └── LedStatus.cpp
│   └── main.cpp                 # Điểm khởi chạy (setup và loop)
├── platformio.ini               # File cấu hình môi trường PlatformIO
└── README.md                    # Tài liệu hướng dẫn sử dụng
```
