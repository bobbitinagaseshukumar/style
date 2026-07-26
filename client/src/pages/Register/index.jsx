import React from 'react';
import AuthPage from '../Login';

// /register renders the same AuthPage starting in register mode
const Register = () => <AuthPage initialMode="register" />;

export default Register;
