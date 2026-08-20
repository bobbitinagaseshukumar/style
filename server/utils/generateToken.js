const jwt = require('jsonwebtoken');

const generateToken = (userId, role, tokenVersion = 0) => {
    const secret = process.env.JWT_SECRET || 'Styleverse@2026SecureJWT#123456789';
    return jwt.sign({ id: userId, role, tokenVersion }, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

const sendTokenResponse = (user, statusCode, res, message="Token generated successfully") => {
    const token = generateToken(user.id, user.role, user.tokenVersion || 0);

    const options = {
        expires: new Date(
            Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    };

    user.password = undefined;

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        message,
        data: { user, token }
    });
};

module.exports = { generateToken, sendTokenResponse };
