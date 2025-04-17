import React from 'react';
import { Text } from 'react-native';

const ErrorText = ({ text }) => (
  <Text style={{ color: 'red', marginLeft: '7%' }}>{text}</Text>
);

export default ErrorText;