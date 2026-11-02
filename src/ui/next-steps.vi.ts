import type { Outcome } from '../shared/outcomes';

export const nextSteps: Record<Outcome, string> = {
  A: 'Chưa phát hiện dấu hiệu theo bộ quy tắc hiện có. Bạn tự đọc lại tài liệu một lượt trước khi chia sẻ. Việc chia sẻ vẫn do người soạn thảo và người có thẩm quyền của đơn vị quyết định.',
  B: 'Giữ trong phạm vi nội bộ, chưa gửi ra ngoài. Xử lý các phát hiện dưới đây (ẩn thông tin cá nhân, gỡ địa chỉ mạng hoặc siêu dữ liệu), rồi soát lại. Cần chia sẻ rộng hơn thì xin ý kiến người có thẩm quyền của đơn vị.',
  C: 'Dừng xử lý tài liệu này. Không gửi, không tải lên, không dán vào công cụ khác, không chuyển sang thiết bị nối mạng. Báo người có thẩm quyền của đơn vị theo quy định để họ xem xét và xác định.'
};
