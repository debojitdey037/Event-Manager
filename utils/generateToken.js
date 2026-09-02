const jwt = require('jsonwebtoken');

const generateTokenAndSetCookie = (res, userId, role) => {
  const secret = process.env.JWT_SECRET || 'eventsphere_fallback_secret_key';
  const token = jwt.sign({ userId, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day in ms
  };

  res.cookie('token', token, cookieOptions);
  return token;
};

module.exports = generateTokenAndSetCookie;
