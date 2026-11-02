# Bộ mẫu giả lập

Dữ liệu giả lập do nhóm sinh để kiểm thử, không phải tài liệu thật. Mỗi tài liệu có lời nhắc giả lập. Đáp án trong ground_truth.csv và manifest.json độc lập với đầu ra lõi.

| Tiền tố | Nội dung |
|---|---|
| N | Nội dung nền, không có dấu hiệu theo đáp án |
| M | Dấu chỉ độ mật giả lập |
| K | Từ khóa minh họa |
| P | Thông tin cá nhân giả lập |
| W | Địa chỉ và đường dẫn mạng giả lập |
| E | Thuộc tính và dữ liệu ẩn |
| U | Kết hợp nhiều loại dấu hiệu |
| X | Tệp lỗi cần từ chối |

Chạy `npm run dataset` để sinh lại theo hạt giống ở generator_seed.txt. Không sửa quy tắc để làm đẹp kết quả. PDF mã hóa cần bộ tạo PDF của Python; mẫu ảnh được vẽ bằng mã. Chưa xác minh mở các tệp bằng phần mềm văn phòng.
