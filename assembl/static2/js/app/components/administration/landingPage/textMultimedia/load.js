// @flow
import { convertEntriesToI18nRichText, convertEntriesToI18nValue } from '../../../form/utils';
import type { TextMultimediaFormValues } from './types.flow';

/* fake promises that returns the same */
export const load = async (landingPageModule: MultilingualLandingPageModule) =>
  new Promise((res) => {
    res(landingPageModule);
  });

export const postLoadFormat = (landingPageModule: MultilingualLandingPageModule): TextMultimediaFormValues => ({
  body: landingPageModule.bodyEntries ? convertEntriesToI18nRichText(landingPageModule.bodyEntries) : {},
  title: landingPageModule && landingPageModule.titleEntries ? convertEntriesToI18nValue(landingPageModule.titleEntries) : {}
});