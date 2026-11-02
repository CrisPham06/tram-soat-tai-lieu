# Chất lượng bản kiện toàn

{"command":"Sinh báo cáo từ bằng chứng đã ghi","at":"2026-11-02T02:40:16.059Z","code_revision":"eecf96adb098c0e463419182eaad4ff0204f7f04","node":"v24.14.0","os":"Windows_NT 10.0.26300 x64"}

## Định danh nguồn

Lấy mọi tệp trong src, tests, rulepacks, public, sắp đường dẫn tương đối theo thứ tự ký tự. Với mỗi tệp, dùng git hash-object --no-filters để băm đúng byte. Ghép mỗi dòng thành đường dẫn, ký tự NUL, mã băm tệp và LF, rồi băm toàn chuỗi bằng git hash-object --stdin. Kết quả là code_revision, không phụ thuộc commit, chỉ mục hoặc trạng thái sửa của kho. Bộ đo dùng tools/maintainers/meta.mjs.

Bản đối chiếu cũ được lưu nguyên trước sửa. reports/baseline-metrics.json bổ sung định danh bản gốc bằng băm danh sách git ls-tree ở HEAD cũ; trường revision_method nói rõ phép tính khác. Không dùng định danh đó để tuyên bố hai cây nguồn bằng nhau.

## Kết quả kiểm

- Chuỗi sạch: 17/17 cổng xanh, npm ci trong thư mục mới và không sao chép tệp môi trường. Cấu hình phản hồi được truyền trong môi trường tiến trình, không ghi giá trị vào báo cáo.
- Kiểm thử đơn vị: 72/72 xanh. Bao phủ dòng 82.95%, nhánh 61.53%, hàm 83.75%, câu lệnh 70.56%.
- Các ca điều phối và giao diện mở rộng: 15/15 xanh. Nhóm lỗi tái hiện trước sửa: 6; đã sửa 6; chưa sửa 0. Đánh số đoạn che là cải tiến riêng, không cộng vào số lỗi. Không phát hiện lỗi lõi mới qua phạm vi đã rà.
- Axe bản mới ở máy: 72 trạng thái, 0 vi phạm ở mọi mức; gồm sáng/tối và bốn chiều rộng. Bản host cũ trước đẩy: 72 trạng thái, 136 vi phạm; ảnh và kết quả này không được gán cho mã mới.
- Tương phản tính từ token CSS lấy trong trình duyệt: tối thiểu chữ 4,651:1, điều khiển 3,619:1. Đây là phép tính cặp màu, kèm kiểm axe; không phải chứng nhận mọi tình huống thị giác.
- Gói ban đầu 731862 B, ngân sách 819200 B. JS gzip 665675 B, CSS gzip 7103 B, phông 59084 B.
- Bộ đo và định tuyến giữ nguyên: khớp; precision 100,00%, recall toàn bộ 86,84%, recall không dừng sớm 100,00%. Đối chiếu trình duyệt 100,00% trên 176 dòng.
- Audit dependency: {"info":0,"low":0,"moderate":12,"high":0,"critical":0,"total":12}. Kết quả có phạm vi dependency của lockfile, không phải kiểm toàn bộ mã nguồn thư viện.

## Hiệu năng và giới hạn

Đo cục bộ với tệp 13450805 B: thao tác 1.768,262 ms. Long Task trong cửa sổ Worker nằm trong JSON gốc; phần chuẩn bị File của bộ thử được ghi riêng. Số heap là ảnh chụp, chưa đo đỉnh toàn bộ tiến trình. CLS tích lũy qua các thao tác của phép thử là 0,132, không phải chỉ số riêng lúc tải trang. Long Task thô lớn nhất 749 ms; trong cửa sổ xử lý Worker có 0 Long Task. Không bỏ phần chậm do bộ thử chuẩn bị File khỏi dữ liệu gốc.

Số đo host trước đẩy có một lượt, ở bằng chứng nội bộ before/performance.json. Phép kiểm sau phát hành sẽ được ghi riêng, không sửa số đo cũ. Chưa kiểm thử tải đồng thời hoặc tài liệu thật.

Nguồn: checks/build/verify.json, checks/unit/, checks/security/, checks/quality/, metrics.json, analysis.json, browser_agreement.json và security-live.json. Bằng chứng ảnh đầy đủ, nhật ký sạch và kết quả host sau phát hành được bàn giao ngoài kho.
