# Tổng hợp thử nghiệm

{"command":"Sinh báo cáo từ bằng chứng đã ghi","at":"2026-11-02T02:40:16.059Z","code_revision":"eecf96adb098c0e463419182eaad4ff0204f7f04","node":"v24.14.0","os":"Windows_NT 10.0.26300 x64"}

Chỉ mô tả trải nghiệm của n = 2, không suy rộng ra nhóm người dùng khác. Nguồn: CSV do người điều phối xuất; đã bỏ id và thời điểm tạo. Các phiếu ghi phiên bản 0.1.0, trước đợt kiện toàn này; không coi đây là buổi thử mới của bản phát hành hiện tại.

| Mã | Tự hoàn thành | Độ dễ hiểu |
|---|---|---|
| T02 | Hai trong ba nhiệm vụ | 3/5 |
| T01 | Ba nhiệm vụ | 5/5 |

Điểm dễ hiểu trung bình 4,0/5. Số nhiệm vụ cụ thể do người điều phối cung cấp; CSV chỉ ghi có hoặc một phần. Không ghi nguyên nhân cho kết quả của T02.

Thời lượng mỗi người: khoảng 5 đến 7 phút, ước lượng của người điều phối, không bấm giờ; không có thời điểm bắt đầu hay kết thúc.

## T02

- Phát hiện thừa hoặc thiếu: “Không”.
- Có dùng trước khi gửi tài liệu thật: “Có, Công cụ hữu ích”.
- Điều cần sửa: “Không”.

## T01

- Phát hiện thừa hoặc thiếu: “Không có”.
- Có dùng trước khi gửi tài liệu thật: “Có, công cụ này giúp phát hiện có gửi nhầm bí mật nhà nước hay không”.
- Điều cần sửa: “Có thể kiểm tra nhiều tài liệu một lúc”.

T01 hiểu phạm vi rộng hơn hành vi thật khi nói “phát hiện có gửi nhầm bí mật nhà nước”. Đây là phản hồi của người thử. Trạm chỉ báo dấu hiệu theo bộ quy tắc, không nhận biết hay xác định bí mật nhà nước. Câu phạm vi đã được bổ sung trên màn hình đầu và phiếu.

Đề nghị soát nhiều tài liệu một lúc được ghi là hướng phát triển, chưa triển khai. Trạm hiện chỉ soát một tài liệu mỗi lần.
