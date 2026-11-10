# Smart Greenhouse - Bảng điều khiển nhà kính thông minh

Dự án giao diện Frontend Web được tách thành các trang riêng biệt theo thiết kế hệ thống **Smart Greenhouse**.

## Cấu trúc thư mục chuẩn hóa
```text
FE/
├── login.html              # Trang Đăng nhập hệ thống (Glassmorphism Dark Theme, validation, demo account)
├── index.html              # Trang khởi động mặc định (Tự động chuyển hướng ngay sang zones.html)
├── zones.html              # Trang Quản lý vườn (Danh sách Nhà kính & Thêm khu vực mới - trang mở đầu tiên)
├── overview.html           # Trang Tổng quan (Dashboard 4 cảm biến, Biểu đồ 24h, Trạng thái thiết bị khi xem chi tiết 1 vườn)
├── sensors.html            # Trang Dữ liệu cảm biến (Biểu đồ Sparkline & Xuất CSV)
├── control.html            # Trang Điều khiển thiết bị (Chế độ AUTO/MANUAL, hẹn giờ, lịch hoạt động)
├── history.html            # Trang Lịch sử hoạt động (Bảng lọc sự kiện Máy bơm, Quạt, Cảnh báo)
├── settings.html           # Trang Cài đặt hệ thống (Cấu hình MQTT, Đăng xuất & Khôi phục dữ liệu)
├── css/
│   ├── style.css           # Master stylesheet (import các module bên dưới)
│   ├── base.css            # Biến màu sắc (:root), reset CSS và font chữ
│   ├── layout.css          # Khung Sidebar cố định, Topbar và Content-area
│   ├── components.css      # Nút bấm, switch toggle, badges, thẻ card, bảng, toast
│   └── pages/              # Stylesheet đặc thù theo từng trang
│       ├── login.css       # Hiệu ứng ánh sáng nền, thẻ đăng nhập kính mờ glassmorphism
│       ├── dashboard.css   # 4 thẻ metrics, biểu đồ 24h & danh sách thiết bị
│       ├── sensors.css     # Thẻ dữ liệu cảm biến & biểu đồ sparkline
│       ├── control.css     # Giao diện hẹn giờ bật/tắt thiết bị
│       ├── rules.css       # Tab chuyển, chế độ AUTO/MANUAL và chọn ngày
│       ├── history.css     # Bộ lọc phân loại và bảng dữ liệu
│       └── zones.css       # Danh sách card khu vực nhà kính (lưới 2 cột cân đối)
└── js/
    ├── common.js           # Đồng bộ dữ liệu, thu gọn sidebar & hàm logout
    ├── login.js            # Logic xác thực form đăng nhập, ẩn/hiện password, demo account
    ├── overview.js         # Logic biểu đồ 24h và công tắc nhanh trang Tổng quan
    ├── sensors.js          # Logic 4 biểu đồ vùng và xuất file CSV trang Cảm biến
    ├── control.js          # Logic cài đặt ngưỡng & lịch trình trang Quy tắc tự động
    ├── history.js          # Logic bộ lọc sự kiện trang Lịch sử hoạt động
    ├── zones.js            # Logic quản lý và thêm mới khu vực nhà kính
    └── settings.js         # Logic cài đặt và reset trạng thái
```

## Tài khoản thử nghiệm (Demo Account)
* **Tài khoản:** `admin`
* **Mật khẩu:** `123456`

## Cách chạy giao diện
1. Mở file `login.html` hoặc `index.html` trên trình duyệt (Chrome, Edge, Firefox, Safari) hoặc mở thư mục dự án bằng tiện ích **Live Server** trên VS Code.
2. Click vào các mục trên thanh menu bên trái để chuyển qua lại giữa các file `.html` riêng biệt. Mọi thao tác bật/tắt bơm, quạt, thêm khu vực hay lưu quy tắc đều được lưu tự động và đồng bộ giữa các trang.
