import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import en from './en.json';
import ko from './ko.json';

const i18n = new I18n({ en, ko });

const locale = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = locale;
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;

export function t(scope: string, options?: Record<string, string | number>) {
  return i18n.t(scope, options);
}

export function isKorean() {
  return i18n.locale === 'ko';
}
