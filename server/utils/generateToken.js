const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

const sendTokenResponse = (user, statusCode, res, message="Token generated successfully") => {
    const token = generateToken(user.id, user.role);

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
