import React, { ReactNode, useRef, useState } from 'react';
import {
    Platform,
    StyleProp,
    StyleSheet,
    TextInput,
    TextInputProps,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import { Colors } from '@/src/constants/colors';
import { IconLibrary } from '@/src/types/ui.types';

import CustomCalendarInput from '@/src/components/CustomCalendarInput';
import CustomDateInput from '@/src/components/CustomDateInput';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

export const formatLocalPhoneNumber = (text?: string): string => {
    if (!text) return '';
    let cleaned = text.replace(/\D/g, '');

    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('63')) {
        cleaned = cleaned.substring(2);
    }

    while (cleaned.length > 0 && cleaned[0] !== '9') {
        cleaned = cleaned.substring(1);
    }

    if (cleaned.length > 10) {
        cleaned = cleaned.substring(0, 10);
    }

    let formatted = cleaned;
    if (cleaned.length > 3) {
        formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    }
    if (cleaned.length > 6) {
        formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }

    return formatted;
};

export const cleanPhoneNumber = (formattedText?: string): string => {
    if (!formattedText) return '';
    let digits = formattedText.replace(/\D/g, '');

    if (digits.startsWith('63')) {
        digits = digits.substring(2);
    } else if (digits.startsWith('0')) {
        digits = digits.substring(1);
    }

    if (digits.length === 10) {
        return '0' + digits;
    }

    return digits;
};

export const formatCoordinate = (text?: string): string => {
    if (!text) return '';
    let cleaned = text.replace(/[^0-9.,-]/g, ''); 
    return cleaned;
};

/**
 * Comprehensive Unicode regex matching all standard and compound emojis,
 * skin tone modifiers, regional indicator flags, keycaps, and variation selectors.
 */
export const EMOJI_REGEX = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator})[\u{1F3FB}-\u{1F3FF}\u{E0020}-\u{E007F}\uFE00-\uFE0F\u200D\u20E3]*|[#*0-9]\uFE0F?\u20E3|[\uFE0E\uFE0F\u200D\u20E3]/gu;

/**
 * Matches zero-width spaces, joiners, non-printing format characters,
 * and directional isolation markers often bundled with emojis or mobile keyboards.
 */
export const INVISIBLE_CHARS_REGEX = /[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E\u2060-\u206F\uFFF0-\uFFFF]/gu;

/**
 * Strips all emoji characters, compound emoji sequences, variation selectors,
 * and zero-width invisible characters from a string without leaving ghost spaces.
 *
 * @param text - The raw input text.
 * @returns {string} The text stripped of emojis and zero-width characters.
 */
export const stripEmojis = (text: string): string => {
    if (!text) return '';
    return text
        .replace(EMOJI_REGEX, '')
        .replace(INVISIBLE_CHARS_REGEX, '');
};

/**
 * A highly customizable text input component that supports passwords, numbers, coordinates, dates, and calendars.
 */
interface CustomTextInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'style'> {
    label?: string;
    placeholder?: string;
    value?: string | Date | null | number;
    onChangeText?: ((text: string) => void) | ((date: Date) => void) | ((date: Date | null) => void) | ((value: string | Date | null) => void);
    secureTextEntry?: boolean;
    keyboardType?: TextInputProps['keyboardType'];
    isPasswordVisible?: boolean;
    onTogglePassword?: () => void;
    type?: 'text' | 'phone' | 'coordinate' | 'numerical' | 'date' | 'calendar';
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    icon?: string;
    iconLibrary?: IconLibrary;
    iconColor?: string;
    prefix?: string;
    children?: ReactNode;
    showTodayButton?: boolean;
    allowFutureDates?: boolean;
    defaultMode?: 'date' | 'month' | 'year';
    multiline?: boolean;
    maximumDate?: Date | null;
    dateFormat?: string;
    iconPosition?: 'left' | 'right';
    rightElement?: ReactNode;
    innerRightElement?: ReactNode;
    suffix?: string;
    allowEmojis?: boolean;
    disableEmojiKeyboard?: boolean;
    sanitizeText?: (text: string) => string;
    containerStyle?: StyleProp<ViewStyle>;
    hasError?: boolean;
    helperText?: string;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({ 
    label, 
    placeholder, 
    value, 
    onChangeText, 
    secureTextEntry, 
    keyboardType, 
    isPasswordVisible, 
    onTogglePassword,
    type = 'text',
    style,
    inputStyle,
    icon, 
    iconLibrary = 'Feather', 
    iconColor,
    prefix, 
    suffix,
    children,
    showTodayButton,
    allowFutureDates,
    defaultMode,
    multiline,
    maximumDate,
    dateFormat = 'MM/DD/YYYY',
    iconPosition,
    rightElement,
    innerRightElement,
    onFocus,
    onBlur,
    allowEmojis = false,
    disableEmojiKeyboard,
    sanitizeText,
    autoCorrect,
    containerStyle,
    hasError = false,
    helperText,
    ...props
}) => {
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [internalShowPassword, setInternalShowPassword] = useState(false);

    const [localValue, setLocalValue] = useState(() => {
        if (value === null || value === undefined) return '';
        let str = String(value);
        if (!allowEmojis) {
            str = stripEmojis(str);
        }
        if (sanitizeText) {
            str = sanitizeText(str);
        }
        return type === 'phone' ? formatLocalPhoneNumber(str) : str;
    });
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        setPrevValue(value);
        let incomingStr = value !== null && value !== undefined ? String(value) : '';
        if (!allowEmojis) {
            incomingStr = stripEmojis(incomingStr);
        }
        if (sanitizeText) {
            incomingStr = sanitizeText(incomingStr);
        }
        if (type === 'coordinate' || type === 'numerical') {
            const isMidDecimal = localValue.endsWith('.') && parseFloat(incomingStr) === parseFloat(localValue);
            if (!isMidDecimal && incomingStr !== localValue) {
                setLocalValue(incomingStr);
            }
        } else if (type === 'phone') {
            const formatted = formatLocalPhoneNumber(incomingStr);
            if (formatted !== localValue) {
                setLocalValue(formatted);
            }
        } else {
            setLocalValue(incomingStr);
        }
    }

    const handleTextChange = (text: string) => {
        let processedText = text;

        if (!allowEmojis) {
            processedText = stripEmojis(processedText);
        }

        if (sanitizeText) {
            processedText = sanitizeText(processedText);
        }

        if (type === 'phone') {
            processedText = formatLocalPhoneNumber(processedText);
        } else if (type === 'coordinate') {
            processedText = formatCoordinate(processedText);
        } else if (type === 'numerical') {
            if (keyboardType === 'number-pad' || keyboardType === 'numeric') {
                processedText = processedText.replace(/[^0-9]/g, '');
            } else {
                let cleaned = processedText.replace(/[^0-9.]/g, '');
                const parts = cleaned.split('.');
                if (parts.length > 2) {
                    cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
                }
                processedText = cleaned;
            }
        }

        if (processedText !== text) {
            if (Platform.OS === 'web') {
                const node = inputRef.current as unknown as HTMLInputElement | null;
                if (node && typeof node === 'object' && 'value' in node && node.value !== processedText) {
                    const cursor = node.selectionStart;
                    const diff = text.length - processedText.length;
                    node.value = processedText;
                    if (typeof cursor === 'number') {
                        const nextCursor = Math.max(0, cursor - diff);
                        node.setSelectionRange(nextCursor, nextCursor);
                    }
                }
            }
        }

        setLocalValue(processedText);
        if (onChangeText) {
            (onChangeText as (val: string) => void)(processedText);
        }
    };

    const shouldDisableEmoji = !allowEmojis || disableEmojiKeyboard;

    const finalKeyboardType = keyboardType 
        || (type === 'phone' 
            ? 'phone-pad' 
            : type === 'coordinate' 
            ? (Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'decimal-pad')
            : type === 'numerical' 
            ? 'decimal-pad' 
            : (shouldDisableEmoji && Platform.OS === 'ios' ? 'ascii-capable' : 'default'));

    const finalAutoCorrect = autoCorrect !== undefined
        ? autoCorrect
        : ((secureTextEntry || shouldDisableEmoji) ? false : undefined);

    const finalInputMode = (keyboardType === 'number-pad' || keyboardType === 'numeric')
        ? 'numeric'
        : (type === 'numerical' || type === 'coordinate' ? 'decimal' : (type === 'phone' ? 'tel' : undefined));

    const showPassword = isPasswordVisible !== undefined ? isPasswordVisible : internalShowPassword;
    const togglePassword = onTogglePassword || (() => setInternalShowPassword(!internalShowPassword));

    if (type === 'date') {
        return (
            <CustomDateInput 
                value={value as Date | null | undefined} 
                onChangeText={(date: Date) => {
                    if (onChangeText) {
                        (onChangeText as (val: Date | string) => void)(date);
                    }
                }}
                label={label}
            > 
                {children}
            </CustomDateInput>
        );
    }

    if (type === 'calendar') {
        return (
            <CustomCalendarInput 
                value={value as Date | null | undefined} 
                onChangeText={(date: string | Date) => {
                    if (onChangeText) {
                        (onChangeText as (val: string | Date) => void)(date);
                    }
                }}
                label={label}
                placeholder={placeholder}
                showTodayButton={showTodayButton}
                allowFutureDates={allowFutureDates}
                defaultMode={defaultMode}
                maximumDate={maximumDate}
                dateFormat={dateFormat}
                style={style}
                iconPosition={iconPosition}
            />
        );
    }

    return (
        <View style={[styles.container, style]}>
            {label && (
                <View style={styles.labelRow}>
                    <CustomText variant="label" style={styles.label}>
                        {label}
                    </CustomText>
                    {rightElement}
                </View>
            )}
            
            <View style={[
                styles.inputContainer,
                Boolean(suffix) && styles.inputContainerWithSuffix,
                { 
                    borderColor: hasError ? Colors.ERROR : (isFocused ? Colors.PRIMARY : Colors.GRAY_LIGHT),
                    backgroundColor: isFocused ? Colors.WHITE : Colors.BACKGROUND,
                },
                multiline && { height: 'auto', minHeight: 96, alignItems: 'flex-start', paddingVertical: 10 },
                containerStyle,
            ]}>
                
                {icon && (
                    <View style={styles.iconContainer}>
                        <CustomIcon 
                            name={icon} 
                            library={iconLibrary} 
                            size={20} 
                            color={iconColor || (isFocused ? Colors.PRIMARY : Colors.TEXT_SECONDARY)} 
                        />
                    </View>
                )}

                {prefix && (
                    <View style={styles.prefixContainer}>
                        <CustomText style={styles.prefixText}>
                            {prefix}
                        </CustomText>
                        <View style={styles.prefixSeparator} />
                    </View>
                )}

                <TextInput 
                    ref={inputRef}
                    style={[
                        styles.input,
                        multiline && { height: 'auto', minHeight: 72, textAlignVertical: 'top', paddingTop: 0, paddingBottom: 0 },
                        inputStyle
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.TEXT_PLACEHOLDER}
                    value={localValue}
                    onChangeText={handleTextChange} 
                    secureTextEntry={secureTextEntry && !showPassword}
                    keyboardType={finalKeyboardType} 
                    inputMode={finalInputMode}
                    autoCorrect={finalAutoCorrect}
                    onFocus={(e) => {
                        setIsFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        if (!allowEmojis) {
                            const cleaned = stripEmojis(localValue);
                            if (cleaned !== localValue) {
                                setLocalValue(cleaned);
                                (onChangeText as ((val: string) => void) | undefined)?.(cleaned);
                            }
                        }
                        onBlur?.(e);
                    }}
                    multiline={Boolean(multiline)}
                    numberOfLines={multiline ? (props.numberOfLines || 3) : 1}
                    {...props} 
                />

                {suffix && (
                    <View style={styles.suffixContainer}>
                        <View style={styles.suffixSeparator} />
                        <CustomText style={styles.suffixText}>
                            {suffix}
                        </CustomText>
                    </View>
                )}

                {innerRightElement}

                {secureTextEntry && (
                    <TouchableOpacity 
                        onPress={togglePassword}
                        style={styles.eyeIcon}
                    >
                        <CustomIcon 
                            library="Feather"
                            name={showPassword ? "eye" : "eye-off"} 
                            size={20} 
                            color={Colors.TEXT_SECONDARY} 
                        />
                    </TouchableOpacity>
                )}
            </View>

            {Boolean(helperText) && (
                <CustomText variant="caption" style={styles.helperText}>
                    {helperText}
                </CustomText>
            )}
            
            {children}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        marginLeft: 2,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        width: '100%',
    },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderWidth: 1,
        borderRadius: 12,
        height: 54,
        paddingHorizontal: 16,
    },
    inputContainerWithSuffix: {
        paddingLeft: 12,
        paddingRight: 10,
    },
    iconContainer: {
        marginRight: 12,
    },

    prefixContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    prefixText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
    prefixSeparator: {
        width: 1,
        height: 20,
        backgroundColor: Colors.GRAY_LIGHT,
        marginLeft: 8,
    },

    suffixContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 6,
        flexShrink: 0,
    },
    suffixSeparator: {
        width: 1,
        height: 18,
        backgroundColor: Colors.GRAY_LIGHT,
        marginRight: 6,
    },
    suffixText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.TEXT_SECONDARY,
    },

    input: {
        flex: 1,
        minWidth: 0,
        fontSize: 16,
        color: Colors.TEXT_PRIMARY,
        height: '100%',
        paddingVertical: 0,
        ...Platform.select({
            web: { outlineStyle: 'none' as unknown as TextStyle['outlineStyle'] }
        })
    },
    eyeIcon: {
        padding: 8,
    },
    helperText: {
        marginTop: 4,
        marginLeft: 2,
        color: Colors.TEXT_SECONDARY,
    },
});

export default CustomTextInput;
