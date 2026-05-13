import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Icon, Icons, IconName } from './Icon';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: ViewStyle;
}

/**
 * Reusable search input component
 */
export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  style
}: SearchInputProps) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.container, style]}>
       <Icon name={Icons.search} size={16} color="#52525B" accessible accessibilityLabel="Search" />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#52525B"
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
         <TouchableOpacity onPress={handleClear} accessibilityLabel="Clear search">
           <Icon name={Icons.x} size={16} color="#71717A" accessible accessibilityLabel="Clear" accessibilityHint="Clears the search input" />
         </TouchableOpacity>
      )}
    </View>
  );
}

interface ToggleButtonGroupProps<T extends string> {
  options: { value: T; label: string }[];
  selectedValue: T;
  onValueChange: (value: T) => void;
}

/**
 * Toggle button group (e.g., kg/lb, dark/light)
 */
export function ToggleButtonGroup<T extends string>({
  options,
  selectedValue,
  onValueChange,
}: ToggleButtonGroupProps<T>) {
  return (
    <View style={styles.toggleContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.toggleButton,
            selectedValue === option.value && styles.toggleButtonActive,
          ]}
          onPress={() => onValueChange(option.value)}
        >
          <Text
            style={[
              styles.toggleText,
              selectedValue === option.value && styles.toggleTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface ViewStyle {
  [key: string]: any;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#27272A',
    gap: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    padding: 0,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#F97316',
  },
  toggleText: {
    fontSize: 14,
    color: '#71717A',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
  },
});

export default SearchInput;