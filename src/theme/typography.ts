import { Platform, TextStyle } from 'react-native';

const monoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'Space Mono',
});

export const typography = {
  h1: {
    fontFamily: undefined,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: 0.3,
  } as TextStyle,
  h2: {
    fontFamily: undefined,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: 0.2,
  } as TextStyle,
  h3: {
    fontFamily: undefined,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,
  body: {
    fontFamily: undefined,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,
  bodySmall: {
    fontFamily: undefined,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  } as TextStyle,
  caption: {
    fontFamily: undefined,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.3,
  } as TextStyle,
  mono: {
    fontFamily: monoFamily,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  } as TextStyle,
  monoSmall: {
    fontFamily: monoFamily,
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
  } as TextStyle,
  button: {
    fontFamily: undefined,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  } as TextStyle,
  tab: {
    fontFamily: undefined,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
    letterSpacing: 0.2,
  } as TextStyle,
};
