import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Platform,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors } from '../constants/colors';
import { FontFamily } from '../constants/typography';

interface FormInputCardProps extends Omit<TextInputProps, 'style'> {
  label: string;
  isDropdown?: boolean;
  onDropdownPress?: () => void;
  containerStyle?: ViewStyle;
}

/**
 * FormInputCard — A card-style labeled input field.
 * Label sits above the input/placeholder text inside a rounded card.
 */
export const FormInputCard = forwardRef<TextInput, FormInputCardProps>(
  function FormInputCard(
    {
      label,
      isDropdown = false,
      onDropdownPress,
      containerStyle,
      ...inputProps
    },
    ref,
  ) {
    const content = (
      <View style={[styles.card, containerStyle]}>
        {/* Label + input stacked */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>{label}</Text>
          {isDropdown ? (
            <Text
              style={[
                styles.input,
                !inputProps.value && styles.placeholder,
              ]}
              numberOfLines={1}
            >
              {inputProps.value || inputProps.placeholder}
            </Text>
          ) : (
            <TextInput
              ref={ref}
              style={styles.input}
              placeholderTextColor={Colors.placeholder}
              returnKeyType="next"
              autoCapitalize="words"
              {...inputProps}
            />
          )}
        </View>

        {/* Dropdown chevron */}
        {isDropdown && (
          <View style={styles.chevronWrap}>
            <Text style={styles.chevron}>›</Text>
          </View>
        )}
      </View>
    );

    if (isDropdown) {
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onDropdownPress}
          accessibilityRole="combobox"
          accessibilityLabel={label}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return content;
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0B2C74',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 2px 10px rgba(11, 44, 116, 0.07)' } as any)
      : {}),
  },

  fieldWrap: {
    flex: 1,
    justifyContent: 'center',
  },

  label: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Colors.labelText,
    marginBottom: 3,
  },

  input: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Colors.textBody,
    padding: 0,
    margin: 0,
  },

  placeholder: {
    color: Colors.placeholder,
  },

  chevronWrap: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  chevron: {
    fontSize: 24,
    color: Colors.textMuted,
    transform: [{ rotate: '90deg' }],
    lineHeight: 24,
    marginTop: -2,
  },
});
