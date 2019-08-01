/* @flow */
/* eslint-disable */
import { type EditorState } from 'draft-js';
import Immutable from 'immutable';
import type { PostsOrderTypes } from './graphql_types.flow';

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

type PostWithChildren = {
  children: Array<PostWithChildren>
} & Post;

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

export type PostsDisplayModes = 'full' | 'summary';

export interface PostsFilterItem {
  id: string;
  labelMsgId: string;
}

type PostsGroupPolicy = {
  comparator: (a: PostWithChildren, b: PostWithChildren) => 1 | 0 | -1, // how to compare groups of posts
  reverse: boolean
};

export interface PostsOrderPolicy extends PostsFilterItem {
  // if null, posts are flattened
  postsGroupPolicy: any; // FIXME null | PostsGroupPolicy;
  graphqlPostsOrder: PostsOrderTypes; // graphql criterion for postsOrder (backend sort)
}

export interface PostsDisplayPolicy extends PostsFilterItem {
  displayMode: PostsDisplayModes;
}

export type PostsFiltersStatus = {
  onlyMyPosts: boolean,
  myPostsAndAnswers: boolean
};

export interface PostsFilterPolicy extends PostsFilterItem {
  excludedPolicies: string[]; // list of policies that are exclusives of this policy.
  filterField: string;
}
