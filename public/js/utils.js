// 通用前端工具函数（以 <script src="/js/utils.js"> 方式引入，挂在全局）

// 转义 HTML 特殊字符，防止 XSS。用于把用户输入拼进 innerHTML 前处理。
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (ch) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch];
  });
}
