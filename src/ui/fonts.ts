export async function loadLocalFonts() {
  const sample = 'Soát sơ bộ tài liệu ắ ữ ỷ ề ặ';
  await Promise.allSettled([document.fonts.load('14px "Be Vietnam Pro"', sample), document.fonts.load('24px "Source Serif"', sample)]);
}
