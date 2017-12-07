/* redux action types */
// @flow
export const UPDATE_CONTENT_LOCALE_BY_ID: 'UPDATE_CONTENT_LOCALE_BY_ID' = 'UPDATE_CONTENT_LOCALE_BY_ID';
export const UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE: 'UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE' =
  'UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE';
export const UPDATE_CONTENT_LOCALE: 'UPDATE_CONTENT_LOCALE' = 'UPDATE_CONTENT_LOCALE';
export const CREATE_RESOURCE: 'CREATE_RESOURCE' = 'CREATE_RESOURCE';
export const DELETE_RESOURCE: 'DELETE_RESOURCE' = 'DELETE_RESOURCE';
export const UPDATE_RESOURCE_DOCUMENT: 'UPDATE_RESOURCE_DOCUMENT' = 'UPDATE_RESOURCE_DOCUMENT';
export const UPDATE_RESOURCE_EMBED_CODE: 'UPDATE_RESOURCE_EMBED_CODE' = 'UPDATE_RESOURCE_EMBED_CODE';
export const UPDATE_RESOURCE_IMAGE: 'UPDATE_RESOURCE_IMAGE' = 'UPDATE_RESOURCE_IMAGE';
export const UPDATE_RESOURCE_TEXT: 'UPDATE_RESOURCE_TEXT' = 'UPDATE_RESOURCE_TEXT';
export const UPDATE_RESOURCE_TITLE: 'UPDATE_RESOURCE_TITLE' = 'UPDATE_RESOURCE_TITLE';
export const UPDATE_RESOURCES: 'UPDATE_RESOURCES' = 'UPDATE_RESOURCES';
export const UPDATE_RC_PAGE_TITLE: 'UPDATE_RC_PAGE_TITLE' = 'UPDATE_RC_PAGE_TITLE';
export const UPDATE_RC_HEADER_IMAGE: 'UPDATE_RC_HEADER_IMAGE' = 'UPDATE_RC_HEADER_IMAGE';
export const UPDATE_RC_PAGE: 'UPDATE_RC_PAGE' = 'UPDATE_RC_PAGE';
export const UPDATE_SECTIONS: 'UPDATE_SECTIONS' = 'UPDATE_SECTIONS';
export const UPDATE_SECTION_TITLE: 'UPDATE_SECTION_TITLE' = 'UPDATE_SECTION_TITLE';
export const UPDATE_SECTION_URL: 'UPDATE_SECTION_URL' = 'UPDATE_SECTION_URL';
export const TOGGLE_EXTERNAL_PAGE: 'TOGGLE_EXTERNAL_PAGE' = 'TOGGLE_EXTERNAL_PAGE';
export const CREATE_SECTION: 'CREATE_SECTION' = 'CREATE_SECTION';
export const DELETE_SECTION: 'DELETE_SECTION' = 'DELETE_SECTION';
export const MOVE_UP_SECTION: 'MOVE_UP_SECTION' = 'MOVE_UP_SECTION';
export const MOVE_DOWN_SECTION: 'MOVE_DOWN_SECTION' = 'MOVE_DOWN_SECTION';
export const UPDATE_LEGAL_NOTICE_ENTRY: 'UPDATE_LEGAL_NOTICE_ENTRY' = 'UPDATE_LEGAL_NOTICE_ENTRY';
export const UPDATE_TERMS_AND_CONDITIONS_ENTRY: 'UPDATE_TERMS_AND_CONDITIONS_ENTRY' = 'UPDATE_TERMS_AND_CONDITIONS_ENTRY';
export const UPDATE_LEGAL_NOTICE_AND_TERMS: 'UPDATE_LEGAL_NOTICE_AND_TERMS' = 'UPDATE_LEGAL_NOTICE_AND_TERMS';

export type UpdateContentLocaleById = {
  type: typeof UPDATE_CONTENT_LOCALE_BY_ID,
  id: string,
  value: string
};

export type UpdateContentLocaleByOriginalLocale = {
  type: typeof UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE,
  originalLocale: string,
  value: string
};

export type ContentLocaleInfo = {
  contentLocale: string,
  originalLocale: string
};

export type ContentLocaleMapping = {
  [string]: ContentLocaleInfo
};

export type UpdateContentLocale = {
  type: typeof UPDATE_CONTENT_LOCALE,
  data: ContentLocaleMapping
};

export type UpdateRCPageTitle = {
  locale: string,
  value: string,
  type: typeof UPDATE_RC_PAGE_TITLE
};

export type UpdateResourcesCenterHeaderImage = {
  value: File,
  type: typeof UPDATE_RC_HEADER_IMAGE
};

export type UpdateResourcesCenterPage = {
  headerImage: File | null,
  titleEntries: Array<any> // TODO: use type automatically created from flow
};

export type CreateResource = {
  id: string,
  order: number,
  type: typeof CREATE_RESOURCE
};

export type DeleteResource = {
  id: string,
  type: typeof DELETE_RESOURCE
};

export type UpdateResourceDocument = {
  id: string,
  value: string,
  type: typeof UPDATE_RESOURCE_DOCUMENT
};

export type UpdateResourceEmbedCode = {
  id: string,
  value: string,
  type: typeof UPDATE_RESOURCE_EMBED_CODE
};

export type UpdateResourceImage = {
  id: string,
  value: string,
  type: typeof UPDATE_RESOURCE_IMAGE
};

export type UpdateResourceText = {
  id: string,
  locale: string,
  value: string,
  type: typeof UPDATE_RESOURCE_TEXT
};

export type UpdateResourceTitle = {
  id: string,
  locale: string,
  value: string,
  type: typeof UPDATE_RESOURCE_TITLE
};

export type ResourceInfo = {
  id: string
};

export type ResourcesArray = Array<ResourceInfo>;

export type UpdateResources = {
  resources: ResourcesArray,
  type: typeof UPDATE_RESOURCES
};

export type SectionInfo = {
  id: string
};

export type SectionsArray = Array<SectionInfo>;

export type UpdateSections = {
  sections: SectionsArray,
  type: typeof UPDATE_SECTIONS
};

export type UpdateSectionTitle = {
  id: string,
  locale: string,
  value: string,
  type: typeof UPDATE_SECTION_TITLE
};

export type UpdateSectionUrl = {
  id: string,
  value: string,
  type: typeof UPDATE_SECTION_URL
};

export type ToggleExternalPage = {
  id: string,
  type: typeof TOGGLE_EXTERNAL_PAGE
};

export type CreateSection = {
  id: string,
  order: number,
  type: typeof CREATE_SECTION
};

export type DeleteSection = {
  id: string,
  type: typeof DELETE_SECTION
};

export type UpSection = {
  id: string,
  type: typeof MOVE_UP_SECTION
};

export type DownSection = {
  id: string,
  type: typeof MOVE_DOWN_SECTION
};

export type UpdateLegalNoticeEntry = {
  type: typeof UPDATE_LEGAL_NOTICE_ENTRY,
  locale: string,
  value: string
};

export type UpdateTermsAndConditionsEntry = {
  type: typeof UPDATE_TERMS_AND_CONDITIONS_ENTRY,
  locale: string,
  value: string
};

export type UpdateLegalNoticeAndTerms = {
  legalNoticeEntries: Array<LangStringEntryInput>,
  termsAndConditionsEntries: Array<LangStringEntryInput>,
  type: typeof UPDATE_LEGAL_NOTICE_AND_TERMS
};

type BasicAction = {
  type: string
};

// TODO: create type for all possible action types

type ResourcesCenterActions =
  | UpdateRCPageTitle
  | UpdateResourcesCenterHeaderImage
  | UpdateResourcesCenterPage
  | CreateResource
  | DeleteResource
  | UpdateResourceDocument
  | UpdateResourceEmbedCode
  | UpdateResourceImage
  | UpdateResourceText
  | UpdateResourceTitle
  | UpdateResources;

type LegalNoticeAndTermsActions = UpdateLegalNoticeEntry | UpdateTermsAndConditionsEntry | UpdateLegalNoticeAndTerms;

type SectionActions = CreateSection | DeleteSection | UpSection | DownSection;

export type Action =
  | UpdateContentLocaleById
  | UpdateContentLocaleByOriginalLocale
  | ResourcesCenterActions
  | LegalNoticeAndTermsActions
  | SectionActions
  | BasicAction;