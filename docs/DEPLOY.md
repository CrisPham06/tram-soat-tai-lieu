# Chạy và triển khai

[Mã nguồn](https://github.com/CrisPham06/tram-soat-tai-lieu) và [bản trình diễn](https://tram-soat-tai-lieu.vercel.app). Nhánh phát hành là main.

## Kiểm trước phát hành

Chạy `npm ci`, `npm run verify:all`. Không phát hành nếu cổng đỏ hoặc số liệu khác bản đối chiếu. Các công cụ trong `tools/maintainers/` phục vụ kiểm thử bổ sung; không phải mã chạy trên trình duyệt người dùng.

Trước commit xem `git status` và `git diff --cached --stat`. Không thêm chỉ dẫn cục bộ, cấu hình môi trường, khóa hay dữ liệu cá nhân. Giữ email noreply. Mọi thao tác viết lại lịch sử chỉ thực hiện trong đợt đã được chủ kho cho phép và sau khi có nhánh sao lưu cục bộ.

## Host

Kho đã nối Vercel. Preset Vite, build `npm run build:web`, đầu ra `dist`. Không bật phân tích sử dụng, theo dõi hiệu năng từ xa hoặc log drain. Kiểm HTTP công khai và các tiêu đề của cả trang công cụ lẫn trang phản hồi sau mỗi lần phát hành.

## Cấu hình phản hồi

Đặt VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào `.env.local` và giao diện biến môi trường của host. Không in hoặc commit giá trị. Chỉ dùng khóa công khai dành cho máy khách. Thiếu cấu hình, trang báo rõ và vẫn có JSON dự phòng.

Người vận hành áp migration và chạy phép kiểm trong `supabase/VERIFY.md`. Công cụ kiểm quyền thật không nằm trong kho công khai. Chỉ xóa bản ghi kỹ thuật đã xác định; không đưa chúng vào kết quả người dùng. Gói miễn phí có thể tạm dừng khi ít dùng, cần mở bảng điều khiển trước buổi thử.

## Ngoại tuyến và Release

Bản công khai chỉ dùng tài liệu giả lập để chấm. Khi dùng thật, mở HTML ngoại tuyến trên máy không nối mạng hoặc mạng LAN độc lập. Không nạp tài liệu đã xác định là bí mật nhà nước.

Build tạo gói ở `dist-release/`; thư mục này không commit. Người vận hành tạo GitHub Release từ thẻ đã phát hành, tải gói ZIP và bản ghi chú lên, rồi kiểm tên tệp và SHA-256. QR trong `docs/qr-demo.png` được sinh và giải mã lại bằng `tools/maintainers/make-qr.mjs`.
