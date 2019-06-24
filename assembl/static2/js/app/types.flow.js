// @flow

export type RouterParams = {
  /** Fiction identifier */
  fictionId?: string,

  /** Landing page module identifier */
  landingPageModuleId?: string,

  /** Fiction phase identifier */
  phase: string,

  /** Question identifier */
  questionId?: string,

  /** Question index */
  questionIndex?: string,

  /** Discussion slug */
  slug: string,

  /** Fiction theme identifier */
  themeId?: string
};