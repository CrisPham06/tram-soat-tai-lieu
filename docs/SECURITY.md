# An ninh và ranh giới

Tài liệu chỉ ở trong bộ nhớ trang và Worker. Bộ đọc đóng gói sẵn, không tải thư viện sau khi nhận tài liệu. Không lưu phiên, gửi tài liệu, phân tích sử dụng hoặc báo lỗi từ xa. Trang công cụ không chứa gói Supabase.

## Ranh giới đầu vào

Nhận dạng bằng nội dung, đối chiếu đuôi; kiểm giới hạn trước giải nén; chặn đường dẫn gói bất thường, khai báo thực thể XML và cấu trúc quá sâu. Worker có đồng hồ canh chừng và mã thế hệ để bỏ kết quả cũ. Dấu hiệu mức dừng không có đoạn trích hay bản dán; khóa sao chép. React hiển thị bằng nút văn bản; tên tệp bỏ ký tự điều khiển và đổi chiều.

## CSP

Bản web chỉ dùng tập lệnh, kiểu dáng và phông cùng nguồn. Trang công cụ giữ `connect-src 'none'`. Trang phản hồi chỉ cho địa chỉ Supabase đã cấu hình. Tiêu đề HTTP chặn đóng khung, kiểu nội dung sai và rò địa chỉ tham chiếu. Kết quả đọc host nằm trong `reports/security-live.json`; cấu hình không thay thế cho phép kiểm host.

HTML ngoại tuyến dùng băm chính xác cho tập lệnh và kiểu dáng nhúng, cho phông dữ liệu nhúng và Worker blob. Đây là ngoại lệ đóng gói tệp đơn. Không cho kết nối mạng. `frame-ancestors` chỉ có tác dụng trong tiêu đề HTTP, không có trong meta.

## Phản hồi

Chỉ trang riêng gửi câu trả lời khi người thử bấm gửi. Máy khách không lưu phiên xác thực, không nối lệnh đọc sau chèn. RLS, CHECK, quyền chèn theo cột và khóa advisory trong migration giới hạn bề mặt công khai. Không dùng khóa quản trị. Công cụ kiểm quyền thật nằm ngoài kho, chỉ dùng dữ liệu kỹ thuật giả lập.

## Giới hạn bằng chứng

Quy tắc có thể báo thừa hoặc bỏ sót. Bộ đọc và thư viện ngoài vẫn có rủi ro sai lệch hoặc chuỗi cung ứng. Khóa công khai có thể bị dùng gửi rác; khóa advisory tuần tự hóa kiểm hạn mức, không chống mọi kiểu lạm dụng. Quét chuỗi khóa và audit dependency không phải chứng nhận toàn bộ mã không có lỗ hổng.
