/* @flow */
/* eslint-disable */
import { type EditorState } from 'draft-js';
import Immutable from 'immutable';

/* temporary dummy types */
type RawDraftContentState = {
  blocks: Array<Object>,
  entityMap: { [key: string]: Object }
};
type DraftBlockType = string;
type DraftInlineStyle = Immutable.OrderedSet<string>;
/* end temporary dummy types */

type ToolbarPosition = 'top' | 'bottom' | 'sticky';

export type IdeaMessageColumns = Array<IdeaMessageColumnFragment>;

export type TreeItem = {
  id: string,
  children?: Array<TreeItem>
};

type ChildType = TreeItem & {
  [string]: any
};

type DateRange = {
  startDate: moment$Moment,
  endDate: moment$Moment
};

type Preset = {
  id: string | number,
  range: DateRange,
  labelTranslationKey: string,
  type: string
};

export type Idea = {
  id: string,
  parentId: string,
  title: string,
  description: string,
  img: Object,
  numChildren: number,
  numContributors: number,
  numPosts: number,
  numVotes: number,
  order: number,
  ancestors: Array<string>,
  posts: Posts,
  messageColumns: IdeaMessageColumns,
  messageViewOverride: string
};

type Post = { ...PostFragment } & {
  messageClassifier: ?string,
  creationDate: string,
  parentId: number
};

type FictionPostPreview = {
  id: string,
  dbId: number,
  subjectEntries: LangstringEntries,
  bodyEntries: LangstringEntries,
  creationDate: string,
  creator: ?{|
    userId: string,
    displayName: ?string,
    isDeleted: ?boolean
  |},
  publicationState: string
};

type EditableDocument = ADocumentFragment & {
  file?: File
};

type LangstringEntry = {
  localeCode: string,
  value: string
};

type LangstringEntries = Array<LangstringEntry>;

type RichTextLangstringEntry = {
  localeCode: string,
  value: EditorState
};

type RichTextLangstringEntries = Array<RichTextLangstringEntry>;

type TitleEntries = {
  titleEntries: LangstringEntries
};

type RouterParams = {
  phase: string,
  slug: string,
  themeId: string
};

type ChatbotType = {
  link: string,
  name: string,
  titleEntries: { [string]: string }
};

type Partner = {
  link: string,
  logo: string,
  name: string
};

type Phase = Object; // TODO

type SocialMedia = {
  name: string,
  url: string
};

type Timeline = Array<Phase>;

type DebateVideo = {
  titleEntries: null | { [string]: string },
  descriptionEntriesTop: null | { [string]: string },
  videoUrl: null | string
};

type DebateData = Object & {
  chatbot: ChatbotType,
  chatframe: any, // TODO
  dates: {
    endDate: string,
    startDate: string
  },
  headerBackgroundUrl: string,
  headerLogoUrl: ?string,
  helpUrl: string,
  identifier: string,
  introduction: TitleEntries,
  logo: string,
  objectives: TitleEntries & {
    descriptionEntries: LangstringEntries,
    images: { img1Url: string, img2Url: string }
  },
  partners: Array<Partner>,
  slug: string,
  socialMedias: Array<SocialMedia>,
  termsOfUseUrl: ?string,
  timeline: Timeline,
  topic: TitleEntries,
  translationEnabled: boolean,
  translationEnabled: boolean,
  twitter: { backgroundImageUrl: string, id: string },
  useSocialMedia: boolean,
  video: DebateVideo,
  customHtmlCodeLandingPage: ?string,
  customHtmlCodeRegistrationPage: ?string
};

type Discussion = {
  id: string,
  // The file representing the logo of the debate. A file metadata object, described by the Document object.
  logoImage: ?{|
    // The MIME-Type of the file uploaded.
    mimeType: ?string,
    // A url to an image or a document to be attached.
    externalUrl: ?string,
    // The filename title.
    title: ?string
  |},
  // The file representing the header of the landing page. A file metadata object, described by the Document object.
  headerImage: ?{|
    // The MIME-Type of the file uploaded.
    mimeType: ?string,
    // The filename title.
    title: ?string,
    // A url to an image or a document to be attached.
    externalUrl: ?string
  |},
  // The title of the discussion, in the language specified by the input
  title: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. %s
  titleEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // The subtitle of the discussion, in the language specified by the input
  subtitle: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. %s
  subtitleEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // The value inside of the participation button in the landing page.
  buttonLabel: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. %s
  buttonLabelEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A URL for the homepage (optional). Often placed on the logo.
  homepageUrl: ?string,
  loginData: ?{|
    local: ?boolean,
    url: string
  |},
  // The start date of a discussion. A datetime that is either set in mutation, or calculated from the start of the first phase.
  startDate: ?any,
  // The end date of a discussion. A datetime that is either set in a mutation, or calculated from the end of last phase.
  endDate: ?any
};

type ErrorDef = {
  code: string,
  vars: { [string]: any }
};

type ValidationErrors = { [string]: Array<ErrorDef> };

type TextFragmentIdentifier = {
  xpathStart: string,
  xpathEnd: string,
  offsetStart: number,
  offsetEnd: number
};

type Tag = {
  id: string,
  value: string
};

type Extract = {
  textFragmentIdentifiers: Array<TextFragmentIdentifier>,
  id: string,
  creationDate: string,
  important: boolean,
  extractNature: string,
  extractAction: string,
  extractState: string,
  body: string,
  creator: AgentProfileInfoFragment,
  tags: Array<Tag>
};

type FieldIdentifier = 'EMAIL' | 'FULLNAME' | 'PASSWORD' | 'PASSWORD2' | 'USERNAME' | 'CUSTOM';

type SelectFieldOption = { label: string, id: string };

type ConfigurableField = {
  fieldType: string,
  id: string,
  identifier: FieldIdentifier,
  order: number,
  required: boolean,
  hidden: boolean,
  title: string,
  options?: Array<SelectFieldOption>,
  __typename: string
};

type OverlayPlacement = 'top' | 'right' | 'bottom' | 'left';

type RouterPath = {
  action: string,
  hash?: string,
  key: string,
  pathname: string,
  query?: { [key: string]: any },
  search: string
};

type FileDocument = {|
  externalUrl: ?string,
  mimeType: ?string,
  title: ?string
|};

type FileDocumentFile = {|
  externalUrl: ?File,
  mimeType: ?string,
  title: ?string
|};

type StrictFile = FileDocumentFile | FileDocument;

type Language = {
  locale: string,
  name: string,
  nativeName: string
};

type LandingPageModuleType = {
  defaultOrder: number,
  editableOrder: boolean,
  id: string,
  identifier: string,
  moduleId: string,
  required: boolean,
  title: string
};

type LandingPageModule = {
  body: ?string,
  configuration: Object,
  enabled: boolean,
  existsInDatabase: true,
  id: string,
  moduleType: LandingPageModuleType,
  order: number,
  subtitle: ?string,
  title: ?string
};

type MultilingualLandingPageModule = {
  body: ?string,
  bodyEntries?: RichTextLangstringEntries,
  configuration: Object,
  enabled: boolean,
  existsInDatabase: true,
  id: string,
  moduleType: LandingPageModuleType,
  order: number,
  subtitle: ?string,
  subtitleEntries: LangstringEntries,
  title: ?string,
  titleEntries: LangstringEntries
};
