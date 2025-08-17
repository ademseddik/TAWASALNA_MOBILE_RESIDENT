import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Login from './Login';

// Mock the useLogin hook to control its behavior in tests
jest.mock('../hooks/useLogin', () => ({
  useLogin: () => ({
    isConnected: true,
    email: '',
    password: '',
    showPassword: false,
    isChecked: false,
    isLoading: false,
    errors: {},
    emailTouched: false,
    passwordTouched: false,
    setState: jest.fn(),
    handleLogin: jest.fn(),
    toggleCheckbox: jest.fn(),
    toggleShowPassword: jest.fn(),
    handleEmailChange: jest.fn(),
    handlePasswordChange: jest.fn(),
    handleSignUp: jest.fn(),
    handleForgotPassword: jest.fn(),
    handleLanguageChange: jest.fn(),
  })
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() })
}));

// Mock translation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

// Basic render test
it('renders the Login screen', () => {
  const { getByText } = render(<Login />);
  expect(getByText('Login')).toBeTruthy();
  expect(getByText('Email')).toBeTruthy();
  expect(getByText('Password')).toBeTruthy();
});

// Example: Test login response structure
it('mocks a login response and checks its structure', async () => {
  // Example mock response
  const mockResponse = {
    data: {
      token: 'abc123',
      refreshToken: 'def456',
      id: 'userId',
    },
    status: 200,
  };
  // Simulate a login function
  const login = jest.fn(() => Promise.resolve(mockResponse));
  const response = await login('test@example.com', 'password');
  expect(response).toHaveProperty('data');
  expect(response.data).toHaveProperty('token');
  expect(response.data).toHaveProperty('refreshToken');
  expect(response.status).toBe(200);
});

// Example: Simulate user input (optional)
it('allows user to type email and password', () => {
  const { getByPlaceholderText } = render(<Login />);
  const emailInput = getByPlaceholderText('Your email');
  const passwordInput = getByPlaceholderText('*********');
  fireEvent.changeText(emailInput, 'test@example.com');
  fireEvent.changeText(passwordInput, 'password123');
  expect(emailInput.props.value).toBe('test@example.com');
  expect(passwordInput.props.value).toBe('password123');
}); 