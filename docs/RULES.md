# Bộ quy tắc

Nguồn sự thật là `rulepacks/demo-v1.json`. Mã quy tắc, mức và bảng định tuyến được đọc trực tiếp từ JSON; không chỉnh quy tắc để cải thiện số đo.

Trong giao diện, mở phần Tra cứu bộ quy tắc để xem mã, mức và tên, hoặc tìm theo nội dung. Nạp tệp JSON cục bộ để thay bộ quy tắc trong phiên hiện tại. Bộ nhập kiểm lược đồ, biên dịch biểu thức, kiểm cấu trúc dễ gây quá thời gian và thực hiện trong Worker có watchdog.

Quy tắc nội dung quét đơn vị văn bản; metadata tạo phát hiện dựa trên thuộc tính, liên kết, bình luận, thay đổi theo dõi, nội dung ẩn và đối tượng nhúng. Thuộc tính dạng văn bản được kiểm tra dấu dừng, còn phát hiện thuộc tính còn lại theo nhóm metadata để không đếm trùng với nội dung.

S3 luôn định tuyến C. Các mức khác dùng đúng bảng nơi đến trong JSON. Nhãn A chỉ biểu thị chưa có phát hiện chặn theo bộ quy tắc, quyết định cuối cùng vẫn thuộc người có thẩm quyền.
