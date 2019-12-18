import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import * as translationEn from 'assets/i18n/en.json';
import * as translationHe from 'assets/i18n/he.json';
import * as translationEs from 'assets/i18n/es.json';
import * as translationZh from 'assets/i18n/zh.json';

const TRANSLATIONS = {
  en: translationEn,
  he: translationHe,
  es: translationEs,
  zh: translationZh
};

export class TranslateUniversalLoader implements TranslateLoader {

  constructor() {}

  public getTranslation(lang: string): Observable<any> {
    return of(TRANSLATIONS[lang]);
  }
}

export function translateFactory() {
  return new TranslateUniversalLoader();
}
