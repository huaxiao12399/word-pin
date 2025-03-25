import crypto from 'crypto';

// 简单的密码哈希函数
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 生成安全的会话令牌
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;
    
    // 输入验证
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: '请输入有效的密码' });
    }

    // 获取密码列表并哈希处理
    const passwords = process.env.ACCESS_PASSWORDS?.split(',').map(p => p.trim()) || [];
    const hashedPasswords = passwords.map(p => hashPassword(p));
    const hashedInput = hashPassword(password);

    if (passwords.length === 0) {
      console.error('ACCESS_PASSWORDS environment variable is not set');
      return res.status(500).json({ error: '服务器配置错误' });
    }

    // 检查输入的密码是否在允许的密码列表中
    if (hashedPasswords.includes(hashedInput)) {
      const sessionToken = generateSessionToken();
      const cookieOptions = [
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        'Max-Age=86400', // 24小时过期
        'Secure' // 仅在HTTPS下传输
      ];

      // 设置安全的 cookie
      res.setHeader('Set-Cookie', [
        `authenticated=${sessionToken}; ${cookieOptions.join('; ')}`,
        `lastLogin=${Date.now()}; ${cookieOptions.join('; ')}`
      ]);

      // 记录成功的登录
      console.info(`Successful login at ${new Date().toISOString()}`);
      return res.status(200).json({ success: true });
    }

    // 记录失败的登录尝试（只记录时间，不记录密码）
    console.warn(`Failed login attempt at ${new Date().toISOString()}`);
    return res.status(401).json({ error: '密码错误' });
  } catch (error) {
    // 记录详细错误信息，但不返回给客户端
    console.error('Verification Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ error: '验证失败，请稍后重试' });
  }
} 