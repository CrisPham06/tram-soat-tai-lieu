# Kiến trúc

Ứng dụng tĩnh, không có máy chủ nhận tài liệu.

```text
Chọn nơi đến và nạp một tệp / dán văn bản giả lập
  → giao diện kiểm giới hạn, hủy lượt cũ và đặt đồng hồ canh chừng
  → Worker nhận nội dung chỉ trong bộ nhớ
  → nhận dạng bằng nội dung, đối chiếu đuôi tệp
  → bộ đọc TXT / DOCX / XLSX / PPTX / PDF
  → các đơn vị nội dung, vị trí, thuộc tính và cảnh báo
  → bộ quy tắc đóng gói hoặc JSON nạp từ máy
  → phát hiện và định tuyến theo nơi đến
  → phiếu, bản dán đã che, in và tải JSON khi người dùng bấm
```

Bộ đọc và lõi ở `src/core/`, không phụ thuộc giao diện hay dịch vụ phản hồi. Dừng ở dấu hiệu mức cao; không trả đoạn trích hoặc bản dán ở trường hợp này. Worker chỉ trả số thứ tự và dòng của đoạn che, không trả văn bản gốc để tính lại trên luồng chính.

`src/ui/` giữ trạng thái trong bộ nhớ. Mỗi lượt có mã thế hệ; hủy Worker và bỏ mọi phản hồi của lượt cũ. Đổi nơi đến xóa phiếu và yêu cầu nạp lại. Xóa phiên dọn dữ liệu, bộ quy tắc nạp thêm và đưa tiêu điểm về nơi đến. Chế độ màu theo hệ thống lúc mở, chỉ đổi trong phiên.

Bản web và bản ngoại tuyến dùng cùng nguồn. HTML ngoại tuyến nhúng thư viện, phông và Worker; CSP dùng băm cho tập lệnh và kiểu dáng nhúng. Bản web chỉ dùng tài nguyên cùng nguồn, trang công cụ không có quyền kết nối.

```text
Liên kết thường tới /phan-hoi/
  → HTML và gói mã phản hồi riêng
  → kiểm biểu mẫu, cảnh báo dấu hiệu trong ô tự do
  → khóa gửi đồng thời trong phiên
  → Supabase bằng quyền công khai chỉ chèn câu trả lời
```

Trang phản hồi không nhận tài liệu. RLS, quyền theo cột, CHECK và khóa advisory nằm trong migration. Hạn mức, mất mạng hoặc thiếu cấu hình được báo rõ; người thử có thể tải JSON của phiếu chưa gửi nếu nội dung vượt qua kiểm tra.

Bộ mẫu và đáp án ở `datasets/synthetic/`; số đo ở `reports/`. `code_revision` định danh nội dung các thư mục nguồn đã chỉ định, không phụ thuộc lịch sử phát hành; cách tính ở `reports/quality.md`.
