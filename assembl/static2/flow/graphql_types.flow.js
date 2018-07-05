/* @flow */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type PublicationStates =
  | 'DELETED_BY_ADMIN'
  | 'DELETED_BY_USER'
  | 'DRAFT'
  | 'MODERATED_TEXT_NEVER_AVAILABLE'
  | 'MODERATED_TEXT_ON_DEMAND'
  | 'PUBLISHED'
  | 'SUBMITTED_AWAITING_MODERATION'
  | 'SUBMITTED_IN_EDIT_GRACE_PERIOD'
  | 'WIDGET_SCOPED';

export type SentimentTypes = 'DISAGREE' | 'DONT_UNDERSTAND' | 'LIKE' | 'MORE_INFO';

export type LangStringEntryInput = {|
  value?: ?string,
  localeCode: string
|};

export type GaugeChoiceSpecificationInput = {|
  id?: ?string,
  labelEntries: Array<?LangStringEntryInput>,
  value: number
|};

export type SectionTypesEnum = 'ADMINISTRATION' | 'CUSTOM' | 'DEBATE' | 'HOMEPAGE' | 'RESOURCES_CENTER' | 'SYNTHESES';

export type SelectFieldOptionInput = {|
  id?: ?string,
  labelEntries: Array<?LangStringEntryInput>,
  order: number
|};

export type QuestionInput = {|
  id?: ?string,
  titleEntries: Array<?LangStringEntryInput>
|};

export type VideoInput = {|
  titleEntries?: ?Array<?LangStringEntryInput>,
  descriptionEntriesTop?: ?Array<?LangStringEntryInput>,
  descriptionEntriesBottom?: ?Array<?LangStringEntryInput>,
  descriptionEntriesSide?: ?Array<?LangStringEntryInput>,
  htmlCode?: ?string
|};

export type TokenCategorySpecificationInput = {|
  id?: ?string,
  titleEntries: Array<?LangStringEntryInput>,
  totalNumber: number,
  typename?: ?string,
  color: string
|};

export type FieldDataInput = {|
  configurableFieldId: string,
  id: string,
  valueData: any
|};

export type AllIdeasQueryQueryVariables = {|
  lang: string,
  identifier: string
|};

export type AllIdeasQueryQuery = {|
  ideas: ?Array<?{|
    // The ID of the object.
    id: string,
    title: ?string,
    description: ?string,
    numPosts: ?number,
    numContributors: ?number,
    numChildren: ?number,
    img: ?{|
      externalUrl: ?string
    |},
    order: ?number,
    parentId: ?string,
    ancestors: ?Array<?string>
  |}>,
  rootIdea: ?(
    | {
        // The ID of the object.
        id: string
      }
    | {})
|};

export type AllLanguagePreferencesQueryVariables = {|
  inLocale: string
|};

export type AllLanguagePreferencesQuery = {|
  defaultPreferences: ?{|
    languages: ?Array<?{|
      locale: ?string,
      name: ?string
    |}>
  |}
|};

export type DebateThematicsQueryQueryVariables = {|
  lang: string,
  identifier: string
|};

export type DebateThematicsQueryQuery = {|
  thematics: ?Array<?{|
    // The ID of the object.
    id: string,
    // An identifier correspond to a specific phase.
    identifier: ?string,
    title: ?string,
    description: ?string,
    numPosts: ?number,
    numContributors: ?number,
    img: ?{|
      externalUrl: ?string
    |}
  |}>
|};

export type DiscussionPreferencesQueryVariables = {|
  inLocale: string
|};

export type DiscussionPreferencesQuery = {|
  discussionPreferences: ?{|
    languages: ?Array<?{|
      locale: ?string,
      name: ?string,
      nativeName: ?string
    |}>
  |}
|};

export type IdeaQueryVariables = {|
  lang: string,
  id: string
|};

export type IdeaQuery = {|
  // The ID of the object
  idea: ?(
    | {
        // The ID of the object.
        id: string,
        title: ?string,
        synthesisTitle: ?string,
        description: ?string,
        img: ?{|
          externalUrl: ?string
        |},
        announcement: ?{|
          title: ?string,
          body: ?string
        |}
      }
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {})
|};

export type IdeaWithPostsQueryVariables = {|
  id: string,
  lang?: ?string
|};

export type IdeaWithPostsQuery = {|
  // The ID of the object
  idea: ?(
    | {
        // The ID of the object.
        id: string,
        numPosts: ?number,
        numContributors: ?number,
        messageColumns: ?Array<?{|
          // A CSS color that will be used to theme the column.
          color: ?string,
          columnSynthesis: ?{|
            // The ID of the object.
            id: string,
            subject: ?string,
            body: ?string,
            mySentiment: ?SentimentTypes,
            sentimentCounts: ?{|
              disagree: ?number,
              dontUnderstand: ?number,
              like: ?number,
              moreInfo: ?number
            |}
          |},
          index: ?number,
          // Identifier for the column, will match :py:attr:`assembl.models.generic.Content.message_classifier`
          messageClassifier: string,
          name: ?string,
          numPosts: ?number,
          title: ?string
        |}>,
        messageViewOverride: ?string,
        posts: ?{|
          edges: Array<?{|
            // The item at the end of the edge
            node: ?{|
              // The ID of the object.
              id: string,
              parentId: ?string,
              creationDate: ?any,
              publicationState: ?PublicationStates,
              originalLocale: ?string,
              // Classifier for column views
              messageClassifier: ?string,
              sentimentCounts: ?{|
                like: ?number,
                disagree: ?number,
                dontUnderstand: ?number,
                moreInfo: ?number
              |}
            |}
          |}>
        |}
      }
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {})
|};

export type LandingPageQueryVariables = {|
  lang: string
|};

export type LandingPageQuery = {|
  discussion: ?{|
    titleEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    title: ?string,
    subtitleEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    subtitle: ?string,
    buttonLabelEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    buttonLabel: ?string,
    headerImage: ?{|
      externalUrl: ?string,
      mimeType: ?string,
      title: ?string
    |},
    logoImage: ?{|
      externalUrl: ?string,
      mimeType: ?string,
      title: ?string
    |}
  |}
|};

export type LandingPageModuleTypesQueryVariables = {|
  lang?: ?string
|};

export type LandingPageModuleTypesQuery = {|
  landingPageModuleTypes: ?Array<?{|
    defaultOrder: number,
    identifier: string,
    required: ?boolean,
    title: ?string,
    titleEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>
  |}>
|};

export type LandingPageModulesQueryVariables = {|
  lang: string
|};

export type LandingPageModulesQuery = {|
  landingPageModules: ?Array<?{|
    configuration: ?string,
    enabled: ?boolean,
    existsInDatabase: ?boolean,
    // The ID of the object.
    id: string,
    order: number,
    moduleType: ?{|
      defaultOrder: number,
      editableOrder: ?boolean,
      identifier: string,
      required: ?boolean,
      title: ?string
    |}
  |}>
|};

export type LegalContentsQueryVariables = {|
  lang?: ?string
|};

export type LegalContentsQuery = {|
  legalContents: ?{|
    legalNotice: ?string,
    termsAndConditions: ?string,
    cookiesPolicy: ?string,
    privacyPolicy: ?string,
    legalNoticeEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    termsAndConditionsEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    cookiesPolicyEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    privacyPolicyEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>
  |}
|};

export type LocalesQueryQueryVariables = {|
  lang: string
|};

export type LocalesQueryQuery = {|
  locales: ?Array<?{|
    localeCode: string,
    label: string
  |}>
|};

export type PostQueryVariables = {|
  contentLocale: string,
  id: string
|};

export type PostQuery = {|
  // The ID of the object
  post: ?(
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {
        // The ID of the object.
        id: string,
        dbId: ?number,
        subjectEntries: ?Array<?{|
          value: ?string,
          localeCode: string
        |}>,
        bodyEntries: ?Array<?{|
          value: ?string,
          localeCode: string
        |}>,
        sentimentCounts: ?{|
          disagree: ?number,
          dontUnderstand: ?number,
          like: ?number,
          moreInfo: ?number
        |},
        mySentiment: ?SentimentTypes,
        indirectIdeaContentLinks: ?Array<?{|
          idea: ?{|
            // The ID of the object.
            id: string,
            title: ?string,
            messageViewOverride: ?string
          |}
        |}>,
        creator: ?{|
          // The ID of the object.
          id: string,
          userId: number,
          displayName: ?string,
          isDeleted: ?boolean
        |},
        modificationDate: ?any,
        bodyMimeType: string,
        publicationState: ?PublicationStates,
        extracts: ?Array<?{|
          // The ID of the object.
          id: string,
          creationDate: ?any,
          important: ?boolean,
          body: string,
          lang: string,
          extractNature: ?string,
          extractAction: ?string,
          textFragmentIdentifiers: ?Array<?{|
            xpathStart: ?string,
            xpathEnd: ?string,
            offsetStart: ?number,
            offsetEnd: ?number
          |}>,
          creator: ?{|
            // The ID of the object.
            id: string,
            userId: number,
            displayName: ?string,
            isDeleted: ?boolean
          |}
        |}>,
        attachments: ?Array<?{|
          id: string,
          document: ?{|
            id: string,
            title: ?string,
            externalUrl: ?string,
            mimeType: ?string,
            avChecked: ?string
          |}
        |}>
      }
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {})
|};

export type ProfileFieldsQueryVariables = {|
  lang: string
|};

export type ProfileFieldsQuery = {|
  profileFields: ?Array<?{|
    // The ID of the object.
    id: string,
    configurableField:
      | {
          fieldType: string,
          // The ID of the object.
          id: string,
          identifier: ?string,
          titleEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>,
          title: ?string,
          order: ?number,
          required: ?boolean
        }
      | {
          // The ID of the object.
          id: string,
          identifier: ?string,
          titleEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>,
          title: ?string,
          order: ?number,
          required: ?boolean,
          options: ?Array<?{|
            // The ID of the object.
            id: string,
            order: number,
            label: ?string,
            labelEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>
          |}>
        },
    valueData: ?any
  |}>
|};

export type QuestionPostsQueryVariables = {|
  id: string,
  first: number,
  after: string,
  fromNode?: ?string
|};

export type QuestionPostsQuery = {|
  // The ID of the object
  question: ?(
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {
        // The ID of the object.
        id: string,
        posts: ?{|
          pageInfo: {|
            // When paginating forwards, the cursor to continue.
            endCursor: ?string,
            // When paginating forwards, are there more items?
            hasNextPage: boolean
          |},
          edges: Array<?{|
            // The item at the end of the edge
            node: ?{|
              // The ID of the object.
              id: string,
              originalLocale: ?string
            |}
          |}>
        |}
      }
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {})
|};

export type QuestionQueryVariables = {|
  lang: string,
  id: string
|};

export type QuestionQuery = {|
  // The ID of the object
  question: ?(
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {
        title: ?string,
        // The ID of the object.
        id: string,
        numPosts: ?number,
        numContributors: ?number,
        totalSentiments: number,
        thematic: ?{|
          // The ID of the object.
          id: string,
          title: ?string,
          img: ?{|
            externalUrl: ?string,
            mimeType: ?string
          |}
        |}
      }
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {})
|};

export type ResourcesCenterPageQueryVariables = {|
  lang?: ?string
|};

export type ResourcesCenterPageQuery = {|
  resourcesCenter: ?{|
    title: ?string,
    titleEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    headerImage: ?{|
      externalUrl: ?string,
      mimeType: ?string
    |}
  |}
|};

export type ResourcesQueryQueryVariables = {|
  lang?: ?string
|};

export type ResourcesQueryQuery = {|
  resources: ?Array<?{|
    // The ID of the object.
    id: string,
    title: ?string,
    text: ?string,
    titleEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    textEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    embedCode: ?string,
    doc: ?{|
      externalUrl: ?string,
      title: ?string,
      mimeType: ?string
    |},
    image: ?{|
      externalUrl: ?string,
      mimeType: ?string
    |}
  |}>
|};

export type RootIdeaStatsQuery = {|
  rootIdea: ?(
    | {
        // The ID of the object.
        id: string,
        numPosts: ?number
      }
    | {
        // The ID of the object.
        id: string,
        numPosts: ?number
      }),
  totalSentiments: ?number,
  numParticipants: ?number,
  visitsAnalytics: ?{|
    sumVisitsLength: ?number,
    nbPageviews: ?number,
    nbUniqPageviews: ?number
  |}
|};

export type RootIdeasQueryQueryVariables = {|
  lang: string
|};

export type RootIdeasQueryQuery = {|
  rootIdea: ?(
    | {
        children: ?Array<?{|
          // The ID of the object.
          id: string,
          title: ?string,
          description: ?string,
          numPosts: ?number,
          numContributors: ?number,
          img: ?{|
            externalUrl: ?string
          |}
        |}>
      }
    | {})
|};

export type SectionsQueryQueryVariables = {|
  lang?: ?string
|};

export type SectionsQueryQuery = {|
  hasResourcesCenter: ?boolean,
  hasSyntheses: ?boolean,
  sections: ?Array<?{|
    // The ID of the object.
    id: string,
    sectionType: string,
    order: number,
    title: ?string,
    titleEntries: ?Array<?{|
      value: ?string,
      localeCode: string
    |}>,
    url: ?string
  |}>
|};

export type SynthesesQueryQueryVariables = {|
  lang: string
|};

export type SynthesesQueryQuery = {|
  syntheses: ?Array<?{|
    // The ID of the object.
    id: string,
    subject: ?string,
    creationDate: ?any,
    img: ?{|
      externalUrl: ?string
    |},
    post: ?{|
      // The ID of the object.
      id: string
    |}
  |}>
|};

export type SynthesisQueryQueryVariables = {|
  id: string,
  lang?: ?string
|};

export type SynthesisQueryQuery = {|
  // The ID of the object
  synthesisPost: ?(
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string,
        publishesSynthesis: ?{|
          // The ID of the object.
          id: string,
          subject: ?string,
          introduction: ?string,
          conclusion: ?string,
          creationDate: ?any,
          img: ?{|
            externalUrl: ?string
          |},
          ideas: ?Array<?(
            | {
                // The ID of the object.
                id: string,
                ancestors: ?Array<?string>,
                title: ?string,
                synthesisTitle: ?string,
                live: ?(
                  | {
                      // The ID of the object.
                      id: string,
                      order: ?number,
                      numPosts: ?number,
                      numContributors: ?number,
                      messageColumns: ?Array<?{|
                        // A CSS color that will be used to theme the column.
                        color: ?string,
                        columnSynthesis: ?{|
                          // The ID of the object.
                          id: string,
                          subject: ?string,
                          body: ?string,
                          mySentiment: ?SentimentTypes,
                          sentimentCounts: ?{|
                            disagree: ?number,
                            dontUnderstand: ?number,
                            like: ?number,
                            moreInfo: ?number
                          |}
                        |},
                        index: ?number,
                        // Identifier for the column, will match :py:attr:`assembl.models.generic.Content.message_classifier`
                        messageClassifier: string,
                        name: ?string,
                        numPosts: ?number,
                        title: ?string
                      |}>,
                      messageViewOverride: ?string,
                      img: ?{|
                        externalUrl: ?string
                      |},
                      posts: ?{|
                        edges: Array<?{|
                          // The item at the end of the edge
                          node: ?{|
                            sentimentCounts: ?{|
                              like: ?number,
                              disagree: ?number,
                              dontUnderstand: ?number,
                              moreInfo: ?number
                            |},
                            publicationState: ?PublicationStates
                          |}
                        |}>
                      |}
                    }
                  | {})
              }
            | {})>
        |}
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      }
    | {
        // The ID of the object.
        id: string
      })
|};

export type TabsConditionQueryVariables = {|
  lang: string
|};

export type TabsConditionQuery = {|
  hasResourcesCenter: ?boolean,
  hasSyntheses: ?boolean,
  hasLegalNotice: ?boolean,
  hasTermsAndConditions: ?boolean,
  hasCookiesPolicy: ?boolean,
  hasPrivacyPolicy: ?boolean,
  discussion: ?{|
    homepageUrl: ?string
  |}
|};

export type TextFieldsQueryVariables = {|
  lang: string
|};

export type TextFieldsQuery = {|
  textFields: ?Array<?(
    | {
        fieldType: string,
        // The ID of the object.
        id: string,
        identifier: ?string,
        titleEntries: ?Array<?{|
          localeCode: string,
          value: ?string
        |}>,
        title: ?string,
        order: ?number,
        required: ?boolean
      }
    | {
        // The ID of the object.
        id: string,
        identifier: ?string,
        titleEntries: ?Array<?{|
          localeCode: string,
          value: ?string
        |}>,
        title: ?string,
        order: ?number,
        required: ?boolean,
        options: ?Array<?{|
          // The ID of the object.
          id: string,
          order: number,
          label: ?string,
          labelEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>
        |}>
      })>
|};

export type ThematicQueryQueryVariables = {|
  lang: string,
  id: string
|};

export type ThematicQueryQuery = {|
  // The ID of the object
  thematic: ?(
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {
        title: ?string,
        img: ?{|
          externalUrl: ?string,
          mimeType: ?string
        |},
        // The ID of the object.
        id: string,
        numPosts: ?number,
        numContributors: ?number,
        totalSentiments: number,
        video: ?{|
          title: ?string,
          descriptionTop: ?string,
          descriptionBottom: ?string,
          descriptionSide: ?string,
          htmlCode: ?string
        |},
        questions: ?Array<?{|
          title: ?string,
          // The ID of the object.
          id: string,
          posts: ?{|
            edges: Array<?{|
              // The item at the end of the edge
              node: ?{|
                // The ID of the object.
                id: string,
                originalLocale: ?string
              |}
            |}>
          |}
        |}>
      }
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {})
|};

export type ThematicsQueryQueryVariables = {|
  identifier: string
|};

export type ThematicsQueryQuery = {|
  thematics: ?Array<?{|
    // The ID of the object.
    id: string,
    order: ?number,
    titleEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    img: ?{|
      externalUrl: ?string,
      mimeType: ?string,
      title: ?string
    |},
    video: ?{|
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      descriptionEntriesTop: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      descriptionEntriesBottom: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      descriptionEntriesSide: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      htmlCode: ?string
    |},
    questions: ?Array<?{|
      // The ID of the object.
      id: string,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>
    |}>
  |}>
|};

export type TimelineQueryVariables = {|
  lang: string
|};

export type TimelineQuery = {|
  timeline: ?Array<?{|
    // The ID of the object.
    id: string,
    identifier: ?string,
    isThematicsTable: ?boolean,
    title: ?string,
    titleEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    start: ?any,
    end: ?any
  |}>
|};

export type VoteSessionQueryVariables = {|
  discussionPhaseId: number,
  lang: string
|};

export type VoteSessionQuery = {|
  voteSession: ?{|
    // The ID of the object.
    id: string,
    headerImage: ?{|
      title: ?string,
      mimeType: ?string,
      externalUrl: ?string
    |},
    seeCurrentVotes: boolean,
    titleEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    subTitleEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    instructionsSectionTitleEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    instructionsSectionContentEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    propositionsSectionTitleEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    title: ?string,
    subTitle: ?string,
    instructionsSectionTitle: ?string,
    instructionsSectionContent: ?string,
    propositionsSectionTitle: ?string,
    proposals: Array<?{|
      // The ID of the object.
      id: string,
      title: ?string,
      description: ?string,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      descriptionEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      order: ?number,
      voteResults: {|
        numParticipants: number,
        participants: Array<?{|
          // The ID of the object.
          id: string,
          userId: number,
          displayName: ?string,
          isDeleted: ?boolean
        |}>
      |},
      modules: Array<?(
        | {
            // The ID of the object.
            id: string,
            voteSessionId: string,
            instructions: ?string,
            titleEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>,
            instructionsEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>,
            isCustom: boolean,
            exclusiveCategories: ?boolean,
            tokenCategories: Array<?{|
              // The ID of the object.
              id: string,
              totalNumber: number,
              // categories which have the same typename will be comparable (example: "positive")
              typename: string,
              title: ?string,
              titleEntries: ?Array<?{|
                localeCode: string,
                value: ?string
              |}>,
              color: ?string
            |}>,
            voteSpecTemplateId: ?string,
            voteType: ?string,
            myVotes: Array<?(
              | {
                  voteValue: number,
                  proposalId: string,
                  tokenCategoryId: string
                }
              | {})>,
            numVotes: number,
            tokenVotes: Array<?{|
              tokenCategoryId: string,
              numToken: number
            |}>
          }
        | {
            // The ID of the object.
            id: string,
            voteSessionId: string,
            instructions: ?string,
            titleEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>,
            instructionsEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>,
            isCustom: boolean,
            choices: ?Array<?{|
              // The ID of the object.
              id: string,
              value: number,
              label: ?string,
              labelEntries: ?Array<?{|
                localeCode: string,
                value: ?string
              |}>
            |}>,
            voteSpecTemplateId: ?string,
            voteType: ?string,
            myVotes: Array<?(
              | {}
              | {
                  selectedValue: number,
                  proposalId: string
                })>,
            numVotes: number,
            averageLabel: ?string,
            averageResult: number
          }
        | {
            // The ID of the object.
            id: string,
            voteSessionId: string,
            instructions: ?string,
            titleEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>,
            instructionsEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>,
            isCustom: boolean,
            minimum: ?number,
            maximum: ?number,
            nbTicks: ?number,
            unit: ?string,
            voteSpecTemplateId: ?string,
            voteType: ?string,
            myVotes: Array<?(
              | {}
              | {
                  selectedValue: number,
                  proposalId: string
                })>,
            numVotes: number,
            averageResult: number
          })>
    |}>,
    modules: Array<?(
      | {
          // The ID of the object.
          id: string,
          voteSessionId: string,
          instructions: ?string,
          titleEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>,
          instructionsEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>,
          isCustom: boolean,
          exclusiveCategories: ?boolean,
          tokenCategories: Array<?{|
            // The ID of the object.
            id: string,
            totalNumber: number,
            // categories which have the same typename will be comparable (example: "positive")
            typename: string,
            title: ?string,
            titleEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>,
            color: ?string
          |}>,
          voteSpecTemplateId: ?string,
          voteType: ?string
        }
      | {
          // The ID of the object.
          id: string,
          voteSessionId: string,
          instructions: ?string,
          titleEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>,
          instructionsEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>,
          isCustom: boolean,
          choices: ?Array<?{|
            // The ID of the object.
            id: string,
            value: number,
            label: ?string,
            labelEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>
          |}>,
          voteSpecTemplateId: ?string,
          voteType: ?string
        }
      | {
          // The ID of the object.
          id: string,
          voteSessionId: string,
          instructions: ?string,
          titleEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>,
          instructionsEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>,
          isCustom: boolean,
          minimum: ?number,
          maximum: ?number,
          nbTicks: ?number,
          unit: ?string,
          voteSpecTemplateId: ?string,
          voteType: ?string
        })>
  |}
|};

export type addGaugeVoteMutationVariables = {|
  proposalId: string,
  voteSpecId: string,
  voteValue: number
|};

export type addGaugeVoteMutation = {|
  addGaugeVote: ?{|
    voteSpecification: ?(
      | {}
      | {
          // The ID of the object.
          id: string,
          myVotes: Array<?(
            | {}
            | {
                selectedValue: number,
                proposalId: string
              })>
        }
      | {
          // The ID of the object.
          id: string,
          myVotes: Array<?(
            | {}
            | {
                selectedValue: number,
                proposalId: string
              })>
        })
  |}
|};

export type addPostExtractMutationVariables = {|
  contentLocale: string,
  postId: string,
  body: string,
  important?: ?boolean,
  xpathStart: string,
  xpathEnd: string,
  offsetStart: number,
  offsetEnd: number
|};

export type addPostExtractMutation = {|
  addPostExtract: ?{|
    post: ?{|
      // The ID of the object.
      id: string,
      dbId: ?number,
      subjectEntries: ?Array<?{|
        value: ?string,
        localeCode: string
      |}>,
      bodyEntries: ?Array<?{|
        value: ?string,
        localeCode: string
      |}>,
      sentimentCounts: ?{|
        disagree: ?number,
        dontUnderstand: ?number,
        like: ?number,
        moreInfo: ?number
      |},
      mySentiment: ?SentimentTypes,
      indirectIdeaContentLinks: ?Array<?{|
        idea: ?{|
          // The ID of the object.
          id: string,
          title: ?string,
          messageViewOverride: ?string
        |}
      |}>,
      creator: ?{|
        // The ID of the object.
        id: string,
        userId: number,
        displayName: ?string,
        isDeleted: ?boolean
      |},
      modificationDate: ?any,
      bodyMimeType: string,
      publicationState: ?PublicationStates,
      extracts: ?Array<?{|
        // The ID of the object.
        id: string,
        creationDate: ?any,
        important: ?boolean,
        body: string,
        lang: string,
        extractNature: ?string,
        extractAction: ?string,
        textFragmentIdentifiers: ?Array<?{|
          xpathStart: ?string,
          xpathEnd: ?string,
          offsetStart: ?number,
          offsetEnd: ?number
        |}>,
        creator: ?{|
          // The ID of the object.
          id: string,
          userId: number,
          displayName: ?string,
          isDeleted: ?boolean
        |}
      |}>,
      attachments: ?Array<?{|
        id: string,
        document: ?{|
          id: string,
          title: ?string,
          externalUrl: ?string,
          mimeType: ?string,
          avChecked: ?string
        |}
      |}>
    |}
  |}
|};

export type addSentimentMutationVariables = {|
  type: SentimentTypes,
  postId: string
|};

export type addSentimentMutation = {|
  addSentiment: ?{|
    post: ?{|
      // The ID of the object.
      id: string,
      sentimentCounts: ?{|
        like: ?number,
        disagree: ?number,
        dontUnderstand: ?number,
        moreInfo: ?number
      |},
      mySentiment: ?SentimentTypes
    |}
  |}
|};

export type addTokenVoteMutationVariables = {|
  proposalId: string,
  tokenCategoryId: string,
  voteSpecId: string,
  voteValue: number
|};

export type addTokenVoteMutation = {|
  addTokenVote: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      myVotes: Array<?(
        | {
            voteValue: number,
            proposalId: string,
            tokenCategoryId: string
          }
        | {})>
    |}
  |}
|};

export type createDiscussionPhaseMutationVariables = {|
  lang: string,
  identifier: string,
  isThematicsTable: boolean,
  titleEntries: Array<?LangStringEntryInput>,
  start: any,
  end: any
|};

export type createDiscussionPhaseMutation = {|
  createDiscussionPhase: ?{|
    discussionPhase: ?{|
      // The ID of the object.
      id: string,
      identifier: ?string,
      isThematicsTable: ?boolean,
      title: ?string,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      start: ?any,
      end: ?any
    |}
  |}
|};

export type createGaugeVoteSpecificationMutationVariables = {|
  voteSessionId: string,
  titleEntries: Array<?LangStringEntryInput>,
  instructionsEntries: Array<?LangStringEntryInput>,
  isCustom: boolean,
  choices: Array<?GaugeChoiceSpecificationInput>,
  proposalId?: ?string,
  voteSpecTemplateId?: ?string
|};

export type createGaugeVoteSpecificationMutation = {|
  createGaugeVoteSpecification: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      voteSessionId: string,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      instructionsEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      isCustom: boolean,
      choices: ?Array<?{|
        // The ID of the object.
        id: string,
        value: number,
        labelEntries: ?Array<?{|
          localeCode: string,
          value: ?string
        |}>
      |}>,
      voteSpecTemplateId: ?string
    |}
  |}
|};

export type createLandingPageModuleMutationVariables = {|
  typeIdentifier: string,
  enabled?: ?boolean,
  order?: ?number,
  configuration?: ?string
|};

export type createLandingPageModuleMutation = {|
  createLandingPageModule: ?{|
    landingPageModule: ?{|
      configuration: ?string,
      enabled: ?boolean,
      moduleType: ?{|
        identifier: string,
        title: ?string
      |},
      order: number
    |}
  |}
|};

export type createNumberGaugeVoteSpecificationMutationVariables = {|
  voteSessionId: string,
  titleEntries: Array<?LangStringEntryInput>,
  instructionsEntries: Array<?LangStringEntryInput>,
  isCustom: boolean,
  minimum: number,
  maximum: number,
  nbTicks: number,
  unit: string,
  proposalId?: ?string,
  voteSpecTemplateId?: ?string
|};

export type createNumberGaugeVoteSpecificationMutation = {|
  createNumberGaugeVoteSpecification: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      voteSessionId: string,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      instructionsEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      isCustom: boolean,
      minimum: ?number,
      maximum: ?number,
      nbTicks: ?number,
      unit: ?string,
      voteSpecTemplateId: ?string
    |}
  |}
|};

export type createPostMutationVariables = {|
  contentLocale: string,
  ideaId: string,
  subject?: ?string,
  body: string,
  messageClassifier?: ?string,
  parentId?: ?string,
  attachments?: ?Array<?string>
|};

export type createPostMutation = {|
  createPost: ?{|
    post: ?{|
      // The ID of the object.
      id: string,
      dbId: ?number,
      subjectEntries: ?Array<?{|
        value: ?string,
        localeCode: string
      |}>,
      bodyEntries: ?Array<?{|
        value: ?string,
        localeCode: string
      |}>,
      sentimentCounts: ?{|
        disagree: ?number,
        dontUnderstand: ?number,
        like: ?number,
        moreInfo: ?number
      |},
      mySentiment: ?SentimentTypes,
      indirectIdeaContentLinks: ?Array<?{|
        idea: ?{|
          // The ID of the object.
          id: string,
          title: ?string,
          messageViewOverride: ?string
        |}
      |}>,
      creator: ?{|
        // The ID of the object.
        id: string,
        userId: number,
        displayName: ?string,
        isDeleted: ?boolean
      |},
      modificationDate: ?any,
      bodyMimeType: string,
      publicationState: ?PublicationStates,
      extracts: ?Array<?{|
        // The ID of the object.
        id: string,
        creationDate: ?any,
        important: ?boolean,
        body: string,
        lang: string,
        extractNature: ?string,
        extractAction: ?string,
        textFragmentIdentifiers: ?Array<?{|
          xpathStart: ?string,
          xpathEnd: ?string,
          offsetStart: ?number,
          offsetEnd: ?number
        |}>,
        creator: ?{|
          // The ID of the object.
          id: string,
          userId: number,
          displayName: ?string,
          isDeleted: ?boolean
        |}
      |}>,
      attachments: ?Array<?{|
        id: string,
        document: ?{|
          id: string,
          title: ?string,
          externalUrl: ?string,
          mimeType: ?string,
          avChecked: ?string
        |}
      |}>,
      parentId: ?string,
      creationDate: ?any
    |}
  |}
|};

export type createProposalMutationVariables = {|
  voteSessionId: string,
  titleEntries: Array<?LangStringEntryInput>,
  descriptionEntries: Array<?LangStringEntryInput>,
  order?: ?number
|};

export type createProposalMutation = {|
  createProposal: ?{|
    proposal: ?{|
      // The ID of the object.
      id: string,
      order: ?number,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      descriptionEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>
    |}
  |}
|};

export type createResourceMutationVariables = {|
  doc?: ?string,
  embedCode?: ?string,
  image?: ?string,
  textEntries: Array<?LangStringEntryInput>,
  titleEntries: Array<LangStringEntryInput>
|};

export type createResourceMutation = {|
  createResource: ?{|
    resource: ?{|
      doc: ?{|
        externalUrl: ?string
      |},
      embedCode: ?string,
      image: ?{|
        externalUrl: ?string,
        mimeType: ?string
      |},
      text: ?string,
      title: ?string
    |}
  |}
|};

export type createSectionMutationVariables = {|
  sectionType?: ?SectionTypesEnum,
  url?: ?string,
  titleEntries: Array<?LangStringEntryInput>,
  order?: ?number,
  lang?: ?string
|};

export type createSectionMutation = {|
  createSection: ?{|
    section: ?{|
      // The ID of the object.
      id: string,
      sectionType: string,
      url: ?string,
      title: ?string,
      order: number
    |}
  |}
|};

export type createTextFieldMutationVariables = {|
  lang?: ?string,
  titleEntries: Array<?LangStringEntryInput>,
  order: number,
  required: boolean,
  options?: ?Array<?SelectFieldOptionInput>
|};

export type createTextFieldMutation = {|
  createTextField: ?{|
    field: ?(
      | {
          titleEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>,
          title: ?string,
          order: ?number,
          required: ?boolean,
          // The ID of the object.
          id: string
        }
      | {
          titleEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>,
          title: ?string,
          order: ?number,
          required: ?boolean,
          // The ID of the object.
          id: string,
          options: ?Array<?{|
            // The ID of the object.
            id: string,
            order: number,
            label: ?string,
            labelEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>
          |}>
        })
  |}
|};

export type createThematicMutationVariables = {|
  identifier: string,
  image?: ?string,
  titleEntries: Array<?LangStringEntryInput>,
  questions?: ?Array<?QuestionInput>,
  video?: ?VideoInput,
  order?: ?number
|};

export type createThematicMutation = {|
  createThematic: ?{|
    thematic: ?{|
      order: ?number,
      title: ?string,
      img: ?{|
        externalUrl: ?string,
        mimeType: ?string
      |},
      video: ?{|
        title: ?string,
        descriptionTop: ?string,
        descriptionBottom: ?string,
        descriptionSide: ?string,
        htmlCode: ?string
      |},
      questions: ?Array<?{|
        title: ?string
      |}>
    |}
  |}
|};

export type createTokenVoteSpecificationMutationVariables = {|
  voteSessionId: string,
  titleEntries: Array<?LangStringEntryInput>,
  instructionsEntries: Array<?LangStringEntryInput>,
  isCustom: boolean,
  exclusiveCategories: boolean,
  tokenCategories: Array<?TokenCategorySpecificationInput>,
  proposalId?: ?string,
  voteSpecTemplateId?: ?string
|};

export type createTokenVoteSpecificationMutation = {|
  createTokenVoteSpecification: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      voteSessionId: string,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      instructionsEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      isCustom: boolean,
      exclusiveCategories: ?boolean,
      tokenCategories: Array<?{|
        // The ID of the object.
        id: string,
        totalNumber: number,
        titleEntries: ?Array<?{|
          localeCode: string,
          value: ?string
        |}>,
        color: ?string
      |}>,
      voteSpecTemplateId: ?string
    |}
  |}
|};

export type deleteDiscussionPhaseMutationVariables = {|
  id: string
|};

export type deleteDiscussionPhaseMutation = {|
  deleteDiscussionPhase: ?{|
    success: ?boolean
  |}
|};

export type deleteExtractMutationVariables = {|
  extractId: string
|};

export type deleteExtractMutation = {|
  deleteExtract: ?{|
    success: ?boolean
  |}
|};

export type deleteGaugeVoteMutationVariables = {|
  proposalId: string,
  voteSpecId: string
|};

export type deleteGaugeVoteMutation = {|
  deleteGaugeVote: ?{|
    voteSpecification: ?(
      | {}
      | {
          // The ID of the object.
          id: string,
          myVotes: Array<?(
            | {}
            | {
                selectedValue: number,
                proposalId: string
              })>
        }
      | {
          // The ID of the object.
          id: string,
          myVotes: Array<?(
            | {}
            | {
                selectedValue: number,
                proposalId: string
              })>
        })
  |}
|};

export type deletePostMutationVariables = {|
  postId: string
|};

export type deletePostMutation = {|
  deletePost: ?{|
    post: ?{|
      // The ID of the object.
      id: string,
      publicationState: ?PublicationStates
    |}
  |}
|};

export type deleteProposalMutationVariables = {|
  id: string
|};

export type deleteProposalMutation = {|
  deleteProposal: ?{|
    success: ?boolean
  |}
|};

export type deleteResourceMutationVariables = {|
  resourceId: string
|};

export type deleteResourceMutation = {|
  deleteResource: ?{|
    success: ?boolean
  |}
|};

export type deleteSectionMutationVariables = {|
  sectionId: string
|};

export type deleteSectionMutation = {|
  deleteSection: ?{|
    success: ?boolean
  |}
|};

export type deleteSentimentMutationVariables = {|
  postId: string
|};

export type deleteSentimentMutation = {|
  deleteSentiment: ?{|
    post: ?{|
      // The ID of the object.
      id: string,
      sentimentCounts: ?{|
        like: ?number,
        disagree: ?number,
        dontUnderstand: ?number,
        moreInfo: ?number
      |},
      mySentiment: ?SentimentTypes
    |}
  |}
|};

export type deleteTextFieldMutationVariables = {|
  id: string
|};

export type deleteTextFieldMutation = {|
  deleteTextField: ?{|
    success: ?boolean
  |}
|};

export type deleteThematicMutationVariables = {|
  thematicId: string
|};

export type deleteThematicMutation = {|
  deleteThematic: ?{|
    success: ?boolean
  |}
|};

export type deleteTokenVoteMutationVariables = {|
  proposalId: string,
  tokenCategoryId: string,
  voteSpecId: string
|};

export type deleteTokenVoteMutation = {|
  deleteTokenVote: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      myVotes: Array<?(
        | {
            voteValue: number,
            proposalId: string,
            tokenCategoryId: string
          }
        | {})>
    |}
  |}
|};

export type DeleteUserInformationMutationVariables = {|
  id: string
|};

export type DeleteUserInformationMutation = {|
  DeleteUserInformation: ?{|
    user: ?{|
      // The ID of the object.
      id: string
    |}
  |}
|};

export type deleteVoteSpecificationMutationVariables = {|
  id: string
|};

export type deleteVoteSpecificationMutation = {|
  deleteVoteSpecification: ?{|
    success: ?boolean
  |}
|};

export type UpdateDiscussionMutationVariables = {|
  titleEntries: Array<LangStringEntryInput>,
  subtitleEntries: Array<LangStringEntryInput>,
  buttonLabelEntries: Array<LangStringEntryInput>,
  headerImage?: ?string,
  logoImage?: ?string
|};

export type UpdateDiscussionMutation = {|
  updateDiscussion: ?{|
    discussion: ?{|
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      subtitleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      buttonLabelEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      headerImage: ?{|
        externalUrl: ?string,
        mimeType: ?string
      |},
      logoImage: ?{|
        externalUrl: ?string,
        mimeType: ?string
      |}
    |}
  |}
|};

export type updateDiscussionPhaseMutationVariables = {|
  id: string,
  lang: string,
  identifier: string,
  isThematicsTable: boolean,
  titleEntries: Array<?LangStringEntryInput>,
  start: any,
  end: any
|};

export type updateDiscussionPhaseMutation = {|
  updateDiscussionPhase: ?{|
    discussionPhase: ?{|
      // The ID of the object.
      id: string,
      identifier: ?string,
      isThematicsTable: ?boolean,
      title: ?string,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      start: ?any,
      end: ?any
    |}
  |}
|};

export type updateDiscussionPreferenceMutationVariables = {|
  languages: Array<?string>
|};

export type updateDiscussionPreferenceMutation = {|
  updateDiscussionPreferences: ?{|
    preferences: ?{|
      languages: ?Array<?{|
        locale: ?string
      |}>
    |}
  |}
|};

export type updateExtractMutationVariables = {|
  extractId: string,
  ideaId?: ?string,
  important?: ?boolean,
  extractNature?: ?string,
  extractAction?: ?string,
  body?: ?string
|};

export type updateExtractMutation = {|
  updateExtract: ?{|
    extract: ?{|
      // The ID of the object.
      id: string,
      creationDate: ?any,
      important: ?boolean,
      body: string,
      lang: string,
      extractNature: ?string,
      extractAction: ?string,
      textFragmentIdentifiers: ?Array<?{|
        xpathStart: ?string,
        xpathEnd: ?string,
        offsetStart: ?number,
        offsetEnd: ?number
      |}>,
      creator: ?{|
        // The ID of the object.
        id: string,
        userId: number,
        displayName: ?string,
        isDeleted: ?boolean
      |}
    |}
  |}
|};

export type updateGaugeVoteSpecificationMutationVariables = {|
  id: string,
  titleEntries: Array<?LangStringEntryInput>,
  instructionsEntries: Array<?LangStringEntryInput>,
  isCustom: boolean,
  choices: Array<?GaugeChoiceSpecificationInput>
|};

export type updateGaugeVoteSpecificationMutation = {|
  updateGaugeVoteSpecification: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      voteSessionId: string,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      instructionsEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      isCustom: boolean,
      choices: ?Array<?{|
        // The ID of the object.
        id: string,
        value: number,
        labelEntries: ?Array<?{|
          localeCode: string,
          value: ?string
        |}>
      |}>
    |}
  |}
|};

export type updateLandingPageModuleMutationVariables = {|
  id: string,
  enabled?: ?boolean,
  order?: ?number,
  configuration?: ?string
|};

export type updateLandingPageModuleMutation = {|
  updateLandingPageModule: ?{|
    landingPageModule: ?{|
      configuration: ?string,
      enabled: ?boolean,
      moduleType: ?{|
        identifier: string,
        title: ?string
      |},
      order: number
    |}
  |}
|};

export type UpdateLegalContentsMutationVariables = {|
  legalNoticeEntries: Array<?LangStringEntryInput>,
  termsAndConditionsEntries: Array<?LangStringEntryInput>,
  cookiesPolicyEntries: Array<?LangStringEntryInput>,
  privacyPolicyEntries: Array<?LangStringEntryInput>
|};

export type UpdateLegalContentsMutation = {|
  updateLegalContents: ?{|
    legalContents: ?{|
      legalNoticeEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      termsAndConditionsEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      cookiesPolicyEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      privacyPolicyEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>
    |}
  |}
|};

export type updateNumberGaugeVoteSpecificationMutationVariables = {|
  id: string,
  titleEntries: Array<?LangStringEntryInput>,
  instructionsEntries: Array<?LangStringEntryInput>,
  isCustom: boolean,
  minimum: number,
  maximum: number,
  nbTicks: number,
  unit: string
|};

export type updateNumberGaugeVoteSpecificationMutation = {|
  updateNumberGaugeVoteSpecification: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      voteSessionId: string,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      instructionsEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      isCustom: boolean,
      minimum: ?number,
      maximum: ?number,
      nbTicks: ?number,
      unit: ?string
    |}
  |}
|};

export type updatePostMutationVariables = {|
  contentLocale: string,
  postId: string,
  subject?: ?string,
  body: string,
  attachments?: ?Array<?string>
|};

export type updatePostMutation = {|
  updatePost: ?{|
    post: ?{|
      // The ID of the object.
      id: string,
      dbId: ?number,
      subjectEntries: ?Array<?{|
        value: ?string,
        localeCode: string
      |}>,
      bodyEntries: ?Array<?{|
        value: ?string,
        localeCode: string
      |}>,
      sentimentCounts: ?{|
        disagree: ?number,
        dontUnderstand: ?number,
        like: ?number,
        moreInfo: ?number
      |},
      mySentiment: ?SentimentTypes,
      indirectIdeaContentLinks: ?Array<?{|
        idea: ?{|
          // The ID of the object.
          id: string,
          title: ?string,
          messageViewOverride: ?string
        |}
      |}>,
      creator: ?{|
        // The ID of the object.
        id: string,
        userId: number,
        displayName: ?string,
        isDeleted: ?boolean
      |},
      modificationDate: ?any,
      bodyMimeType: string,
      publicationState: ?PublicationStates,
      extracts: ?Array<?{|
        // The ID of the object.
        id: string,
        creationDate: ?any,
        important: ?boolean,
        body: string,
        lang: string,
        extractNature: ?string,
        extractAction: ?string,
        textFragmentIdentifiers: ?Array<?{|
          xpathStart: ?string,
          xpathEnd: ?string,
          offsetStart: ?number,
          offsetEnd: ?number
        |}>,
        creator: ?{|
          // The ID of the object.
          id: string,
          userId: number,
          displayName: ?string,
          isDeleted: ?boolean
        |}
      |}>,
      attachments: ?Array<?{|
        id: string,
        document: ?{|
          id: string,
          title: ?string,
          externalUrl: ?string,
          mimeType: ?string,
          avChecked: ?string
        |}
      |}>
    |}
  |}
|};

export type updateProfileFieldsMutationVariables = {|
  data: Array<?FieldDataInput>,
  lang: string
|};

export type updateProfileFieldsMutation = {|
  updateProfileFields: ?{|
    profileFields: ?Array<?{|
      // The ID of the object.
      id: string,
      configurableField:
        | {
            fieldType: string,
            // The ID of the object.
            id: string,
            identifier: ?string,
            titleEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>,
            title: ?string,
            order: ?number,
            required: ?boolean
          }
        | {
            // The ID of the object.
            id: string,
            identifier: ?string,
            titleEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>,
            title: ?string,
            order: ?number,
            required: ?boolean,
            options: ?Array<?{|
              // The ID of the object.
              id: string,
              order: number,
              label: ?string,
              labelEntries: ?Array<?{|
                localeCode: string,
                value: ?string
              |}>
            |}>
          },
      valueData: ?any
    |}>
  |}
|};

export type updateProposalMutationVariables = {|
  id: string,
  titleEntries: Array<?LangStringEntryInput>,
  descriptionEntries: Array<?LangStringEntryInput>,
  order?: ?number
|};

export type updateProposalMutation = {|
  updateProposal: ?{|
    proposal: ?{|
      // The ID of the object.
      id: string,
      order: ?number,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      descriptionEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>
    |}
  |}
|};

export type updateResourceMutationVariables = {|
  doc?: ?string,
  id: string,
  image?: ?string,
  titleEntries: Array<?LangStringEntryInput>,
  textEntries?: ?Array<?LangStringEntryInput>,
  embedCode?: ?string
|};

export type updateResourceMutation = {|
  updateResource: ?{|
    resource: ?{|
      doc: ?{|
        externalUrl: ?string
      |},
      embedCode: ?string,
      image: ?{|
        externalUrl: ?string,
        mimeType: ?string
      |},
      text: ?string,
      title: ?string
    |}
  |}
|};

export type UpdateResourcesCenterMutationVariables = {|
  headerImage?: ?string,
  titleEntries: Array<?LangStringEntryInput>
|};

export type UpdateResourcesCenterMutation = {|
  updateResourcesCenter: ?{|
    resourcesCenter: ?{|
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      headerImage: ?{|
        externalUrl: ?string,
        title: ?string
      |}
    |}
  |}
|};

export type updateSectionMutationVariables = {|
  id: string,
  url?: ?string,
  titleEntries: Array<?LangStringEntryInput>,
  order?: ?number,
  lang?: ?string
|};

export type updateSectionMutation = {|
  updateSection: ?{|
    section: ?{|
      // The ID of the object.
      id: string,
      url: ?string,
      title: ?string,
      sectionType: string,
      order: number
    |}
  |}
|};

export type updateTextFieldMutationVariables = {|
  id: string,
  lang: string,
  titleEntries: Array<?LangStringEntryInput>,
  order: number,
  required: boolean,
  options?: ?Array<?SelectFieldOptionInput>
|};

export type updateTextFieldMutation = {|
  updateTextField: ?{|
    field: ?(
      | {
          titleEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>,
          title: ?string,
          order: ?number,
          required: ?boolean,
          // The ID of the object.
          id: string
        }
      | {
          titleEntries: ?Array<?{|
            localeCode: string,
            value: ?string
          |}>,
          title: ?string,
          order: ?number,
          required: ?boolean,
          // The ID of the object.
          id: string,
          options: ?Array<?{|
            // The ID of the object.
            id: string,
            order: number,
            label: ?string,
            labelEntries: ?Array<?{|
              localeCode: string,
              value: ?string
            |}>
          |}>
        })
  |}
|};

export type updateThematicMutationVariables = {|
  id: string,
  identifier: string,
  image?: ?string,
  titleEntries: Array<?LangStringEntryInput>,
  questions?: ?Array<?QuestionInput>,
  video?: ?VideoInput,
  order?: ?number
|};

export type updateThematicMutation = {|
  updateThematic: ?{|
    thematic: ?{|
      order: ?number,
      title: ?string,
      img: ?{|
        externalUrl: ?string
      |},
      video: ?{|
        title: ?string,
        descriptionTop: ?string,
        descriptionBottom: ?string,
        descriptionSide: ?string,
        htmlCode: ?string
      |},
      questions: ?Array<?{|
        // The ID of the object.
        id: string,
        title: ?string
      |}>
    |}
  |}
|};

export type updateTokenVoteSpecificationMutationVariables = {|
  id: string,
  titleEntries: Array<?LangStringEntryInput>,
  instructionsEntries: Array<?LangStringEntryInput>,
  isCustom: boolean,
  exclusiveCategories: boolean,
  tokenCategories: Array<?TokenCategorySpecificationInput>
|};

export type updateTokenVoteSpecificationMutation = {|
  updateTokenVoteSpecification: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      voteSessionId: string,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      instructionsEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      isCustom: boolean,
      exclusiveCategories: ?boolean,
      tokenCategories: Array<?{|
        // The ID of the object.
        id: string,
        totalNumber: number,
        titleEntries: ?Array<?{|
          localeCode: string,
          value: ?string
        |}>,
        color: ?string
      |}>
    |}
  |}
|};

export type UpdateUserMutationVariables = {|
  id: string,
  name?: ?string,
  username?: ?string,
  img?: ?string,
  oldPassword?: ?string,
  newPassword?: ?string,
  newPassword2?: ?string
|};

export type UpdateUserMutation = {|
  updateUser: ?{|
    user: ?{|
      // The ID of the object.
      id: string,
      name: ?string,
      username: ?string,
      displayName: ?string,
      image: ?{|
        externalUrl: ?string
      |}
    |}
  |}
|};

export type UpdateVoteSessionMutationVariables = {|
  discussionPhaseId: number,
  headerImage?: ?string,
  titleEntries?: ?Array<?LangStringEntryInput>,
  subTitleEntries?: ?Array<?LangStringEntryInput>,
  instructionsSectionTitleEntries?: ?Array<?LangStringEntryInput>,
  instructionsSectionContentEntries?: ?Array<?LangStringEntryInput>,
  propositionsSectionTitleEntries?: ?Array<?LangStringEntryInput>,
  seeCurrentVotes?: ?boolean
|};

export type UpdateVoteSessionMutation = {|
  updateVoteSession: ?{|
    voteSession: ?{|
      headerImage: ?{|
        title: ?string,
        mimeType: ?string,
        externalUrl: ?string
      |},
      seeCurrentVotes: boolean,
      titleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      subTitleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      instructionsSectionTitleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      instructionsSectionContentEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>,
      propositionsSectionTitleEntries: ?Array<?{|
        localeCode: string,
        value: ?string
      |}>
    |}
  |}
|};

export type uploadDocumentMutationVariables = {|
  file: string
|};

export type uploadDocumentMutation = {|
  uploadDocument: ?{|
    document: ?{|
      id: string,
      externalUrl: ?string,
      mimeType: ?string,
      title: ?string
    |}
  |}
|};

export type UserQueryVariables = {|
  id: string
|};

export type UserQuery = {|
  // The ID of the object
  user: ?(
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {
        // The ID of the object.
        id: string,
        name: ?string,
        username: ?string,
        displayName: ?string,
        email: ?string,
        creationDate: ?any,
        hasPassword: ?boolean,
        isDeleted: ?boolean
      }
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {})
|};

export type tokenVoteSpecificationFragment = {|
  // The ID of the object.
  id: string,
  voteSessionId: string,
  instructions: ?string,
  titleEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>,
  instructionsEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>,
  isCustom: boolean,
  exclusiveCategories: ?boolean,
  tokenCategories: Array<?{|
    // The ID of the object.
    id: string,
    totalNumber: number,
    // categories which have the same typename will be comparable (example: "positive")
    typename: string,
    title: ?string,
    titleEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>,
    color: ?string
  |}>,
  voteSpecTemplateId: ?string,
  voteType: ?string
|};

export type tokenVoteSpecificationResultsFragment = {|
  myVotes: Array<?(
    | {
        voteValue: number,
        proposalId: string,
        tokenCategoryId: string
      }
    | {})>,
  numVotes: number,
  tokenVotes: Array<?{|
    tokenCategoryId: string,
    numToken: number
  |}>
|};

export type numberGaugeVoteSpecificationFragment = {|
  // The ID of the object.
  id: string,
  voteSessionId: string,
  instructions: ?string,
  titleEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>,
  instructionsEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>,
  isCustom: boolean,
  minimum: ?number,
  maximum: ?number,
  nbTicks: ?number,
  unit: ?string,
  voteSpecTemplateId: ?string,
  voteType: ?string
|};

export type numberGaugeVoteSpecificationResultsFragment = {|
  myVotes: Array<?(
    | {}
    | {
        selectedValue: number,
        proposalId: string
      })>,
  numVotes: number,
  averageResult: number
|};

export type gaugeVoteSpecificationFragment = {|
  // The ID of the object.
  id: string,
  voteSessionId: string,
  instructions: ?string,
  titleEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>,
  instructionsEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>,
  isCustom: boolean,
  choices: ?Array<?{|
    // The ID of the object.
    id: string,
    value: number,
    label: ?string,
    labelEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>
  |}>,
  voteSpecTemplateId: ?string,
  voteType: ?string
|};

export type gaugeVoteSpecificationResultsFragment = {|
  myVotes: Array<?(
    | {}
    | {
        selectedValue: number,
        proposalId: string
      })>,
  numVotes: number,
  averageLabel: ?string,
  averageResult: number
|};

export type AgentProfileInfoFragment = {|
  // The ID of the object.
  id: string,
  userId: number,
  displayName: ?string,
  isDeleted: ?boolean
|};

export type AttachmentFragment = {|
  id: string,
  document: ?{|
    id: string,
    title: ?string,
    externalUrl: ?string,
    mimeType: ?string,
    avChecked: ?string
  |}
|};

export type DocumentFragment = {|
  id: string,
  title: ?string,
  externalUrl: ?string,
  mimeType: ?string,
  avChecked: ?string
|};

export type ExtractFragment = {|
  // The ID of the object.
  id: string,
  creationDate: ?any,
  important: ?boolean,
  body: string,
  lang: string,
  extractNature: ?string,
  extractAction: ?string,
  extractState: ?string,
  textFragmentIdentifiers: ?Array<?{|
    xpathStart: ?string,
    xpathEnd: ?string,
    offsetStart: ?number,
    offsetEnd: ?number
  |}>,
  creator: ?{|
    // The ID of the object.
    id: string,
    userId: number,
    displayName: ?string,
    isDeleted: ?boolean
  |}
|};

export type IdeaContentLinkFragment = {|
  idea: ?{|
    // The ID of the object.
    id: string,
    title: ?string,
    messageViewOverride: ?string
  |}
|};

export type IdeaMessageColumnFragment = {|
  // A CSS color that will be used to theme the column.
  color: ?string,
  columnSynthesis: ?{|
    // The ID of the object.
    id: string,
    subject: ?string,
    body: ?string,
    mySentiment: ?SentimentTypes,
    sentimentCounts: ?{|
      disagree: ?number,
      dontUnderstand: ?number,
      like: ?number,
      moreInfo: ?number
    |}
  |},
  index: ?number,
  // Identifier for the column, will match :py:attr:`assembl.models.generic.Content.message_classifier`
  messageClassifier: string,
  name: ?string,
  numPosts: ?number,
  title: ?string
|};

export type langStringEntryFragment = {|
  localeCode: string,
  value: ?string
|};

export type PostFragment = {|
  // The ID of the object.
  id: string,
  dbId: ?number,
  subjectEntries: ?Array<?{|
    value: ?string,
    localeCode: string
  |}>,
  bodyEntries: ?Array<?{|
    value: ?string,
    localeCode: string
  |}>,
  sentimentCounts: ?{|
    disagree: ?number,
    dontUnderstand: ?number,
    like: ?number,
    moreInfo: ?number
  |},
  mySentiment: ?SentimentTypes,
  indirectIdeaContentLinks: ?Array<?{|
    idea: ?{|
      // The ID of the object.
      id: string,
      title: ?string,
      messageViewOverride: ?string
    |}
  |}>,
  creator: ?{|
    // The ID of the object.
    id: string,
    userId: number,
    displayName: ?string,
    isDeleted: ?boolean
  |},
  modificationDate: ?any,
  bodyMimeType: string,
  publicationState: ?PublicationStates,
  extracts: ?Array<?{|
    // The ID of the object.
    id: string,
    creationDate: ?any,
    important: ?boolean,
    body: string,
    lang: string,
    extractNature: ?string,
    extractAction: ?string,
    extractState: ?string,
    textFragmentIdentifiers: ?Array<?{|
      xpathStart: ?string,
      xpathEnd: ?string,
      offsetStart: ?number,
      offsetEnd: ?number
    |}>,
    creator: ?{|
      // The ID of the object.
      id: string,
      userId: number,
      displayName: ?string,
      isDeleted: ?boolean
    |}
  |}>,
  attachments: ?Array<?{|
    id: string,
    document: ?{|
      id: string,
      title: ?string,
      externalUrl: ?string,
      mimeType: ?string,
      avChecked: ?string
    |}
  |}>
|};

export type selectFieldFragment = {|
  // The ID of the object.
  id: string,
  identifier: ?string,
  titleEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>,
  title: ?string,
  order: ?number,
  required: ?boolean,
  options: ?Array<?{|
    // The ID of the object.
    id: string,
    order: number,
    label: ?string,
    labelEntries: ?Array<?{|
      localeCode: string,
      value: ?string
    |}>
  |}>
|};

export type SentimentCountsFragment = {|
  disagree: ?number,
  dontUnderstand: ?number,
  like: ?number,
  moreInfo: ?number
|};

export type textFieldFragment = {|
  fieldType: string,
  // The ID of the object.
  id: string,
  identifier: ?string,
  titleEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>,
  title: ?string,
  order: ?number,
  required: ?boolean
|};

export type voteSessionGlobalsFragment = {|
  headerImage: ?{|
    title: ?string,
    mimeType: ?string,
    externalUrl: ?string
  |},
  seeCurrentVotes: boolean
|};

export type voteSessionLangstringsEntriesFragment = {|
  titleEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>,
  subTitleEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>,
  instructionsSectionTitleEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>,
  instructionsSectionContentEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>,
  propositionsSectionTitleEntries: ?Array<?{|
    localeCode: string,
    value: ?string
  |}>
|};
