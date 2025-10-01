
export function validateImageFile(file, t,message) {
  const img_size = file.size / 1024 / 1024;
  const isImg = file.type.includes('image');

  if (!isImg) {
    message.error(t('请上传图片'));
    return false;
  }

  // 允许的 MIME 类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  // 允许的后缀名
  const fileName = file.name.toLowerCase();
  const allowedSuffixes = ['.jpg', '.jpeg', '.png', '.webp'];

  const isAllowedType = allowedTypes.includes(file.type);
  const hasValidSuffix = allowedSuffixes.some(suffix => fileName.endsWith(suffix));

  if (!isAllowedType && !hasValidSuffix) {
    message.error(t('対応形式：JPG、PNG、WebPのみ'));
    return false;
  }

  if (img_size > 10) {
    message.info(t('图片大小不能超过10M哦'));
    return false;
  }

  return true;
};