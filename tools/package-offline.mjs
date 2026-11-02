import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { zipSync, strToU8 } from 'fflate';
export function packageOffline() {
  const directory = 'dist-release'; mkdirSync(directory, { recursive: true });
  const files = {
    'tram-soat-tai-lieu.html': readFileSync('dist-offline/tram-soat-tai-lieu.html'),
    'README_OFFLINE.txt': strToU8('Giải nén gói vào một thư mục.\nMở tram-soat-tai-lieu.html bằng Chrome trên máy không nối mạng hoặc mạng LAN độc lập của đơn vị.\nBản trình diễn chỉ dùng tài liệu giả lập; không nạp tài liệu đã xác định là bí mật nhà nước.\n')
  };
  const sums = Object.entries(files).map(([path, bytes]) => createHash('sha256').update(bytes).digest('hex') + '  ' + path).join('\n') + '\n';
  files['SHA256SUMS.txt'] = strToU8(sums);
  writeFileSync(directory + '/tram-soat-tai-lieu-offline.zip', zipSync(files));
  const version = JSON.parse(readFileSync('package.json','utf8')).version;
  writeFileSync(directory + `/tram-soat-tai-lieu-offline-v${version}.zip`, zipSync(files));
  writeFileSync(directory + '/RELEASE_NOTES.md', `# Trạm soát tài liệu v${version}\n\nSoát sơ bộ từng tài liệu bằng bộ quy tắc minh họa.\nSửa tiêu điểm, trạng thái và số đếm trên phiếu.\nĐánh số các đoạn đã che trong chế độ dán.\nGiữ nguyên lõi, bộ đọc và bảng định tuyến của bản đối chiếu.\nChỉ dùng tài liệu giả lập; không xác định bí mật nhà nước hoặc độ mật.\nMở HTML trên máy không nối mạng hoặc mạng LAN độc lập.\n`);
  writeFileSync(directory + '/SHA256SUMS.txt', sums);
  if (existsSync('dist')) copyFileSync(directory + '/tram-soat-tai-lieu-offline.zip', 'dist/tram-soat-tai-lieu-offline.zip');
}
