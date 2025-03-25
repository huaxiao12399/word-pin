export function withAuth(handler) {
  return async (req, res) => {
    // 检查是否是登录页面或验证API
    if (req.url === '/login.html' || req.url === '/api/verify') {
      return handler(req, res);
    }

    // 检查 cookie 中的认证状态
    const authenticated = req.cookies?.authenticated === 'true';

    if (!authenticated) {
      // 如果是 API 请求，返回 401
      if (req.url.startsWith('/api/')) {
        return res.status(401).json({ error: '未授权访问' });
      }
      // 如果是页面请求，重定向到登录页
      return res.redirect('/login.html');
    }

    return handler(req, res);
  };
} 