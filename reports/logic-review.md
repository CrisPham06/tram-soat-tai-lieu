# Rà soát logic

{"command":"Sinh báo cáo từ bằng chứng đã ghi","at":"2026-11-02T02:40:16.059Z","code_revision":"eecf96adb098c0e463419182eaad4ff0204f7f04","node":"v24.14.0","os":"Windows_NT 10.0.26300 x64"}

| Tình huống | Kết quả ban đầu | Sau sửa | Ca kiểm |
|---|---|---|---|
| Xóa phiên và đưa tiêu điểm về lựa chọn nơi đến | Tái hiện lỗi | Xanh | reset-focus |
| Sửa lựa chọn ở chế độ dán đưa tiêu điểm về ô dán | Tái hiện lỗi | Xanh | paste-edit-focus |
| Tổng số lần phát hiện khớp danh sách và JSON | Tái hiện lỗi | Xanh | finding-count |
| Đoạn che có số và dòng, đánh dấu bằng chữ và gạch dưới | Chưa có, cải tiến yêu cầu mới | Xanh | numbered-redactions |
| Ô góp ý cảnh báo dấu hiệu độ mật hoặc thông tin cá nhân | Tái hiện lỗi | Xanh | feedback-sensitive-warning |
| Vùng khai báo có tên riêng và nội dung nằm trong landmark | Tái hiện lỗi | Xanh | axe-landmarks |
| Đổi nơi đến xóa phiếu và yêu cầu soát lại | Tái hiện lỗi | Xanh | destination-clears-sheet-with-notice |
| Xóa phiên trong khi đọc, kết quả muộn bị bỏ | Đã đúng | Xanh | session-cancels-late-read |
| Hai tệp liên tiếp, kết quả lượt mới được giữ | Kiểm tra mở rộng trên bản mới | Xanh | rapid-files-latest-wins |
| Khóa thay bộ quy tắc trong khi đang đọc tài liệu | Kiểm tra mở rộng trên bản mới | Xanh | rulepack-locked-during-read |
| Tệp trống, đúng và vượt giới hạn, đuôi sai, lỗi, mật khẩu, ảnh quét | Kiểm tra mở rộng trên bản mới | Xanh | file-refusals-and-boundary |
| SHA-256, tên tệp đặc biệt, JSON, đổi màu, tài liệu khác và trạng thái in | Kiểm tra mở rộng trên bản mới | Xanh | sheet-json-hash-theme-and-new-session |
| Dán rỗng, khoảng trắng, quá dài và mức dừng không có đoạn trích | Kiểm tra mở rộng trên bản mới | Xanh | paste-empty-long-and-stop |
| Bộ quy tắc lỗi cú pháp, thiếu trường và regex nguy hiểm | Kiểm tra mở rộng trên bản mới | Xanh | rulepack-rejects-invalid-and-dangerous |
| Bàn phím mở chọn tệp, Esc hộp thoại và vùng thông báo kết quả | Kiểm tra mở rộng trên bản mới | Xanh | keyboard-drop-dialog-and-live-region |

Phản hồi gửi hai lần, mất mạng, sai mã, hạn mức và lỗi trùng: checks/security/feedback_mock.json. Tên tệp rất dài: tests/core.test.ts. Toàn bộ kết quả mẫu: results.csv và browser_agreement.json.

Số nhóm lỗi tái hiện: 6; đã sửa 6; chưa sửa 0; lỗi lõi mới cần người dùng quyết: 0. Nhóm lỗi trợ năng có thể chứa nhiều quy tắc axe. Không đếm một ca yêu cầu mới thành lỗi của bản cũ.
