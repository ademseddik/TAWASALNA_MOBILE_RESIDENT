import React, { useState, forwardRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import MentionText from './MentionText';

const StyledTextInput = forwardRef(({ 
  value, 
  onChangeText, 
  placeholder, 
  style = {}, 
  mentionedUsers = [],
  onFocus,
  onBlur,
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  return (
    <View style={styles.container}>
      {/* Show styled text when not focused and there's text */}
      {!isFocused && value && value.trim() && (
        <View style={styles.styledTextContainer}>
          <MentionText 
            text={value} 
            mentionedUsers={mentionedUsers}
            style={[styles.styledText, style]}
          />
        </View>
      )}
      
      {/* Regular text input */}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={[
          styles.textInput, 
          style,
          // Hide text when showing styled version
          !isFocused && value && value.trim() && { color: 'transparent' }
        ]}
        multiline
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </View>
  );
});

StyledTextInput.displayName = 'StyledTextInput';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  styledTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  styledText: {
    fontSize: 16,
    lineHeight: 20,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 20,
  },
});

export default StyledTextInput; 