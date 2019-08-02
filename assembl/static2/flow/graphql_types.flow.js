/* @flow */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type PostsOrderTypes = 'chronological' | 'popularity' | 'reverse_chronological' | 'score';

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

export type CookieTypes =
  | 'ACCEPT_CGU'
  | 'ACCEPT_LOCALE'
  | 'ACCEPT_PRIVACY_POLICY_ON_DISCUSSION'
  | 'ACCEPT_SESSION_ON_DISCUSSION'
  | 'ACCEPT_TRACKING_ON_DISCUSSION'
  | 'ACCEPT_USER_GUIDELINE_ON_DISCUSSION'
  | 'REJECT_CGU'
  | 'REJECT_LOCALE'
  | 'REJECT_PRIVACY_POLICY_ON_DISCUSSION'
  | 'REJECT_SESSION_ON_DISCUSSION'
  | 'REJECT_TRACKING_ON_DISCUSSION'
  | 'REJECT_USER_GUIDELINE_ON_DISCUSSION';

export type SentimentTypes = 'DISAGREE' | 'DONT_UNDERSTAND' | 'LIKE' | 'MORE_INFO';

export type ExtractStates = 'PUBLISHED' | 'SUBMITTED';

export type SynthesisTypes = 'fulltext_synthesis' | 'synthesis';

export type LangStringEntryInput = {|
  // The unicode encoded string representation of the content.
  value?: ?string,
  // The ISO 639-1 locale code of the language the content represents.
  localeCode: string
|};

export type GaugeChoiceSpecificationInput = {|
  id?: ?string,
  labelEntries: Array<?LangStringEntryInput>,
  value: number
|};

export type SectionTypesEnum =
  | 'ADMINISTRATION'
  | 'CUSTOM'
  | 'DEBATE'
  | 'HOMEPAGE'
  | 'RESOURCES_CENTER'
  | 'SEMANTIC_ANALYSIS'
  | 'SYNTHESES';

export type SelectFieldOptionInput = {|
  // The Relay.Node ID type of the SelectFieldOption object.
  id?: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
  labelEntries: Array<?LangStringEntryInput>,
  // The position (order) of the field.
  order: number
|};

export type QuestionInput = {|
  // Id of the question input.
  id?: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. Title of the question in various languages.
  titleEntries: Array<?LangStringEntryInput>
|};

export type IdeaAnnouncementInput = {|
  // A list of possible languages of the entity as LangStringEntry objects. This is the title of announcement in multiple languages.
  titleEntries: Array<?LangStringEntryInput>,
  // A Attachments for the body of announcement in multiple languages. in a given language.
  bodyAttachments?: ?Array<?string>,
  // A list of possible languages of the entity as LangStringEntry objects. This is the body of announcement in multiple languages.
  bodyEntries: Array<?LangStringEntryInput>,
  // A list of possible languages of the entity as LangStringEntry objects. This is the quote of the announcement in multiple languages.
  quoteEntries?: ?Array<?LangStringEntryInput>,
  // A list of possible languages of the entity as LangStringEntry objects. This is the summry of the announcement in multiple languages.
  summaryEntries?: ?Array<?LangStringEntryInput>
|};

export type TokenCategorySpecificationInput = {|
  id?: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. The title of the Token Category in various languages.
  titleEntries: Array<?LangStringEntryInput>,
  // The total number of Tokens allocated per vote.
  totalNumber: number,
  // The unique identifier of the token.
  typename?: ?string,
  // A CSS-compatible Hex code depicting the colour of the Token.
  color: string
|};

export type TranslationInput = {|
  // The source locale of the translation.
  localeFrom: string,
  // The target locale of the translation.
  localeInto: string
|};

export type IdeaInput = {|
  id?: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. %s
  titleEntries: Array<?LangStringEntryInput>,
  // A list of possible languages of the entity as LangStringEntry objects. %s
  descriptionEntries?: ?Array<?LangStringEntryInput>,
  // An Announcement object representing a summary of an Idea. This is often included in a header display of an Idea.
  announcement?: ?IdeaAnnouncementInput,
  // A list of Question objects that are bound to the Thematic.
  questions?: ?Array<?QuestionInput>,
  // A list of IdeaMessageColumnInput to be associated to the idea.
  messageColumns?: ?Array<?IdeaMessageColumnInput>,
  // List of IdeaInput
  children?: ?Array<?IdeaInput>,
  // The identifier of the part containing the image in a multipart POST body.
  image?: ?string,
  // A %s as a float
  order?: ?number,
  // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
  messageViewOverride?: ?string,
  // The Relay.Node ID type of the Idea object.
  parentId?: ?string
|};

export type IdeaMessageColumnInput = {|
  // Id of the IdeaMessageColumnInput.
  id?: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. Name of the column.
  nameEntries: Array<?LangStringEntryInput>,
  // A list of possible languages of the entity as LangStringEntry objects. Title of the column.
  titleEntries: Array<?LangStringEntryInput>,
  // A The color of the column. in a given language.
  color: string,
  // A Message classifier of the column. in a given language.
  messageClassifier?: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. The title of the Synthesis post associated to the column.
  columnSynthesisSubject?: ?Array<?LangStringEntryInput>,
  // A list of possible languages of the entity as LangStringEntry objects. The body of the Synthesis post associated to the column.
  columnSynthesisBody?: ?Array<?LangStringEntryInput>
|};

export type FieldDataInput = {|
  // The Relay.Node ID type of the ConfigurableField object.
  configurableFieldId: string,
  // The Relay.Node ID type of the FieldData object.
  id: string,
  // The data of the field.
  valueData: any
|};

export type AllIdeasQueryQueryVariables = {|
  lang: string,
  discussionPhaseId: number
|};

export type AllIdeasQueryQuery = {|
  // List of all ideas on the debate.
  ideas: ?Array<?{
    // The ID of the object.
    id: string,
    // The title of the Idea, often shown in the Idea header itself.
    title: ?string,
    // The description of the Idea, often shown in the header of the Idea.
    description: ?string,
    // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
    messageViewOverride: ?string,
    // The total number of active posts on that idea (excludes deleted posts).
    numPosts: ?number,
    // The total number of users who contributed to the Idea/Thematic/Question.
    //
    // Contribution is counted as either as a sentiment set, a post created.
    numContributors: ?number,
    // The total number of votes (participations) for the vote session related to the idea.
    numVotes: ?number,
    // The total number of children ideas (called "subideas") on the Idea or Thematic.
    numChildren: ?number,
    // Header image associated with the idea. A file metadata object, described by the Document object.
    img: ?{|
      // A url to an image or a document to be attached.
      externalUrl: ?string
    |},
    // The order of the Idea, Thematic, Question in the idea tree.
    order: ?number,
    // The Relay.Node ID type of the Idea object.
    parentId: ?string,
    // A list of Relay.Node ID's representing the parents Ideas of the Idea.
    ancestors: ?Array<?string>
  }>,
  // An idea union between either an Idea type or a Thematic type.
  rootIdea: ?{
    // The ID of the object.
    id: string
  }
|};

export type BrightMirrorFictionQueryVariables = {|
  contentLocale: string,
  id: string
|};

export type BrightMirrorFictionQuery = {|
  // The ID of the object
  fiction: ?(
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
        // The internal database ID of the post.
        // This should never be used in logical computations, however, it exists to give the exact database id for use in sorting or creating classifiers for Posts.
        dbId: ?number,
        // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
        subjectEntries: ?Array<?{|
          // The unicode encoded string representation of the content.
          value: ?string,
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string
        |}>,
        // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
        bodyEntries: ?Array<?{|
          // The unicode encoded string representation of the content.
          value: ?string,
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string
        |}>,
        // The date that the object was created, in UTC timezone, in ISO 8601 format.
        creationDate: ?any,
        // A graphene Field containing the state of the publication of a certain post. The options are:
        // DRAFT,
        //
        // SUBMITTED_IN_EDIT_GRACE_PERIOD,
        //
        // SUBMITTED_AWAITING_MODERATION,
        //
        // PUBLISHED,
        //
        // MODERATED_TEXT_ON_DEMAND,
        //
        // MODERATED_TEXT_NEVER_AVAILABLE,
        //
        // DELETED_BY_USER,
        //
        // DELETED_BY_ADMIN,
        //
        // WIDGET_SCOPED
        //
        publicationState: ?PublicationStates,
        // A boolean flag to say whether the post is modified or not.
        modified: ?boolean,
        creator: ?{|
          // The ID of the object.
          id: string,
          // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
          displayName: ?string,
          // A boolean flag that shows if the User is deleted.
          // If True, the User information is cleansed from the system, and the User can no longer log in.
          isDeleted: ?boolean,
          // The unique database identifier of the User.
          userId: number,
          // Image appearing on the avatar of the User. A file metadata object, described by the Document object.
          image: ?{|
            // A url to an image or a document to be attached.
            externalUrl: ?string
          |}
        |},
        // A list of SentimentCounts which counts each sentiment expressed. These include:
        //
        // Like,
        //
        // Agree,
        //
        // Disagree,
        //
        // Like,
        //
        // Don't Understand
        //
        // More Info
        //
        sentimentCounts: ?{|
          // The number of Sentiments disagreeing with the post.
          disagree: ?number,
          // The number of Sentiments expressing "dont_understand" on the Post.
          dontUnderstand: ?number,
          // The number of Sentiments expressed "like" on the post.
          like: ?number,
          // The number of Sentiments requesting "more_info" on the post.
          moreInfo: ?number
        |},
        // The SentimentType that the API calling User has on the Post, if any.
        mySentiment: ?SentimentTypes,
        // The User or AgentProfile who created the parent post.
        parentPostCreator: ?{|
          // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
          displayName: ?string
        |},
        // A ??? in a given language.
        bodyMimeType: string,
        // A list of IdeaContentLinks that are in fact Extracts on the Post. Extracts are valuable entities taken from
        extracts: ?Array<?{|
          // The ID of the object.
          id: string,
          // The date the Extract was created, in UTC timezone.
          creationDate: ?any,
          // A flag for importance of the Extract.
          important: ?boolean,
          // The body of text that is extracted from the post. This is not language dependent, but rather just unicode text.
          body: string,
          // The lang of the extract.
          lang: ?string,
          // The taxonomy (or classification) of the extracted body. The options are one of:
          //
          //
          // issue: The body of text is an issue.
          //
          // actionable_solution: The body of text is a potentially actionable solution.
          //
          // knowledge: The body of text is in fact knowledge gained by the community.
          //
          // example: The body of text is an example in the context that it was derived from.
          //
          // concept: The body of text is a high level concept.
          //
          // argument: The body of text is an argument for/against in the context that it was extracted from.
          //
          // cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.
          //
          //
          extractNature: ?string,
          // The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:
          //
          //
          // classify: This body of text should be re-classified by an priviledged user.
          //
          // make_generic: The body of text is a specific example and not generic.
          //
          // argument: A user must give more arguments.
          //
          // give_examples: A user must give more examples.
          //
          // more_specific: A user must be more specific within the same context.
          //
          // mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.
          //
          // display_multi_column: A priviledged user should activate the Mutli-Column view.
          //
          // display_thread: A priviledged user should activate the Thread view.
          //
          // display_tokens: A priviledged user should activate the Token Vote view.
          //
          // display_open_questions: A priviledged user should activate the Open Question view.
          //
          // display_bright_mirror: A priviledged user should activate the Bright Mirror view.
          //
          //
          extractAction: ?string,
          // A graphene Field containing the state of the extract. The options are:
          // SUBMITTED,
          //
          // PUBLISHED
          //
          extractState: ?ExtractStates,
          // A list of TextFragmentIdentifiers.
          textFragmentIdentifiers: ?Array<?{|
            // The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned.
            xpathStart: ?string,
            // The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
            // Often times the xpathEnd variable is the same as the xpathStart selector.
            xpathEnd: ?string,
            // The character offset index where an extract begins, beginning from index 0 in a string of text.
            offsetStart: ?number,
            // The character offset index where an extract ends in a string of text.
            offsetEnd: ?number
          |}>,
          // The AgentProfile object description of the creator.
          creator: ?{|
            // The ID of the object.
            id: string,
            // The unique database identifier of the User.
            userId: number,
            // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
            displayName: ?string,
            // A boolean flag that shows if the User is deleted.
            // If True, the User information is cleansed from the system, and the User can no longer log in.
            isDeleted: ?boolean,
            // A boolean flag describing if the User is a machine user or human user.
            isMachine: ?boolean,
            // The preferences of the User.
            preferences: ?{|
              // The harvesting Translation preference.
              harvestingTranslation: ?{|
                // The source locale of the translation.
                localeFrom: string,
                // The target locale of the translation.
                localeInto: string
              |}
            |}
          |},
          // A list of comment post related to an extract.
          comments: ?Array<?{|
            // The ID of the object.
            id: string,
            // A Body of the post (the main content of the post). in a given language.
            body: ?string,
            // The date that the object was created, in UTC timezone, in ISO 8601 format.
            creationDate: ?any,
            creator: ?{|
              // The ID of the object.
              id: string,
              // The unique database identifier of the User.
              userId: number,
              // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
              displayName: ?string,
              // A boolean flag that shows if the User is deleted.
              // If True, the User information is cleansed from the system, and the User can no longer log in.
              isDeleted: ?boolean,
              // A boolean flag describing if the User is a machine user or human user.
              isMachine: ?boolean,
              // The preferences of the User.
              preferences: ?{|
                // The harvesting Translation preference.
                harvestingTranslation: ?{|
                  // The source locale of the translation.
                  localeFrom: string,
                  // The target locale of the translation.
                  localeInto: string
                |}
              |}
            |},
            // List of attachements to the post.
            attachments: ?Array<?{|
              // The ID of the object.
              id: string,
              // Any file that can be attached. A file metadata object, described by the Document object.
              document: ?{|
                // The ID of the object.
                id: string,
                // The filename title.
                title: ?string,
                // A url to an image or a document to be attached.
                externalUrl: ?string,
                // The MIME-Type of the file uploaded.
                mimeType: ?string
              |}
            |}>,
            // The parent of a Post, if the Post is a reply to an existing Post. The Relay.Node ID type of the Post object.
            parentId: ?string,
            // A graphene Field containing the state of the publication of a certain post. The options are:
            // DRAFT,
            //
            // SUBMITTED_IN_EDIT_GRACE_PERIOD,
            //
            // SUBMITTED_AWAITING_MODERATION,
            //
            // PUBLISHED,
            //
            // MODERATED_TEXT_ON_DEMAND,
            //
            // MODERATED_TEXT_NEVER_AVAILABLE,
            //
            // DELETED_BY_USER,
            //
            // DELETED_BY_ADMIN,
            //
            // WIDGET_SCOPED
            //
            publicationState: ?PublicationStates
          |}>
        |}>,
        // Keywords associated with the post, according to NLP engine.
        keywords: ?Array<?{|
          // The score associated with the tag (0-1, increasing relevance)
          score: ?number,
          // The number of times the tag was found
          count: ?number,
          // The tag keyword
          value: ?string
        |}>,
        // A list of abstract tags associated to the post.
        tags: ?Array<?{|
          // The ID of the object.
          id: string,
          // The value of the tag. This is not language dependent, but rather just unicode text.
          value: string
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
    | {}
    | {}
  )
|};

export type DiscussionPreferencesQueryVariables = {|
  inLocale: string
|};

export type DiscussionPreferencesQuery = {|
  //
  // The dicussion preferences of the debate.
  // These are configurations that characterize how the debate will behave, look, and act under certain conditions.
  discussionPreferences: ?{|
    // A list of LocalePreference metadata objects on the discussion which describe the languages supported by the debate.
    languages: ?Array<?{|
      // The ISO 639-1 language string of the locale. Ex. '"fr"'.
      locale: ?string,
      // The name of the locale, in the language of the locale given. Ex. French, if the given locale is '"en"'.
      name: ?string,
      // The name of the locale, in the original language. Ex Français.
      nativeName: ?string
    |}>,
    // A Boolean flag indicating whether the moderation is activated or not.
    withModeration: ?boolean,
    // A Boolean flag indicating wheter the users have the possibility to translate the messages or not.
    withTranslation: ?boolean,
    // A Boolean flag indicating wheter the semantic analysis is activated or not.
    withSemanticAnalysis: ?boolean,
    // A string used to form the URL of the discussion.
    slug: string
  |}
|};

export type DiscussionPreferencesQueryQuery = {|
  //
  // The dicussion preferences of the debate.
  // These are configurations that characterize how the debate will behave, look, and act under certain conditions.
  discussionPreferences: ?{|
    // The title in the tab.
    tabTitle: ?string,
    // The site favicon.A file metadata object, described by the Document object.
    favicon: ?{|
      // The filename title.
      title: ?string,
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string
    |},
    // The site logo.A file metadata object, described by the Document object.
    logo: ?{|
      // The filename title.
      title: ?string,
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string
    |},
    // A Boolean flag indicating whether the moderation is activated or not.
    withModeration: ?boolean,
    // A Boolean flag indicating wheter the users have the possibility to translate the messages or not.
    withTranslation: ?boolean,
    // A Boolean flag indicating wheter the semantic analysis is activated or not.
    withSemanticAnalysis: ?boolean
  |}
|};

export type DiscussionDataQueryVariables = {|
  nextView?: ?string,
  lang?: ?string
|};

export type DiscussionDataQuery = {|
  // The discussion object metadata.
  discussion: ?{|
    // The ID of the object.
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
        // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
        messageViewOverride: ?string,
        // The title of the Idea, often shown in the Idea header itself.
        title: ?string,
        // A Synthesis title in a given language.
        synthesisTitle: ?string,
        // The description of the Idea, often shown in the header of the Idea.
        description: ?string,
        // Header image associated with the idea. A file metadata object, described by the Document object.
        img: ?{|
          // A url to an image or a document to be attached.
          externalUrl: ?string
        |},
        // An Announcement object representing a summary of an Idea. This is often included in a header display of an Idea.
        announcement: ?{|
          // A title of announcement in a given language.
          title: ?string,
          // A body of announcement in a given language.
          body: ?string,
          // A quote of announcement in a given language.
          quote: ?string,
          // A summary of announcement in a given language.
          summary: ?string
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
    | {}
    | {}
    | {}
    | {}
  )
|};

export type IdeaWithPostsQueryVariables = {|
  id: string,
  lang?: ?string,
  additionalFields: boolean,
  postsOrder?: ?PostsOrderTypes,
  onlyMyPosts?: ?boolean,
  myPostsAndAnswers?: ?boolean
|};

export type IdeaWithPostsQuery = {|
  // The ID of the object
  idea: ?(
    | {
        // The ID of the object.
        id: string,
        // The total number of active posts on that idea (excludes deleted posts).
        numPosts: ?number,
        // The total number of users who contributed to the Idea/Thematic/Question.
        //
        // Contribution is counted as either as a sentiment set, a post created.
        numContributors: ?number,
        // A list of IdeaMessageColumn objects, if any set, on an Idea.
        messageColumns: ?Array<?{|
          // A CSS color that will be used to theme the column.
          color: ?string,
          // A Synthesis done on the column, of type Post.
          columnSynthesis: ?{|
            // The ID of the object.
            id: string,
            // A Subject of the post in a given language.
            subject: ?string,
            // A Body of the post (the main content of the post). in a given language.
            body: ?string,
            // The SentimentType that the API calling User has on the Post, if any.
            mySentiment: ?SentimentTypes,
            // A list of SentimentCounts which counts each sentiment expressed. These include:
            //
            // Like,
            //
            // Agree,
            //
            // Disagree,
            //
            // Like,
            //
            // Don't Understand
            //
            // More Info
            //
            sentimentCounts: ?{|
              // The number of Sentiments disagreeing with the post.
              disagree: ?number,
              // The number of Sentiments expressing "dont_understand" on the Post.
              dontUnderstand: ?number,
              // The number of Sentiments expressed "like" on the post.
              like: ?number,
              // The number of Sentiments requesting "more_info" on the post.
              moreInfo: ?number
            |}
          |},
          // The order of the message column in the Idea/Thematic.
          index: ?number,
          // The unique classification identifier of the MessageColumn. All content who will be put under this column must have this classifer.
          messageClassifier: string,
          // A The name of the column in a given language.
          name: ?string,
          // The number of posts contributed to only this column.
          numPosts: ?number,
          // A The title of the column in a given language.
          title: ?string
        |}>,
        // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
        messageViewOverride: ?string,
        // A list of all Posts under the Idea. These include posts of the subIdeas.
        posts: ?{|
          edges: Array<?{|
            // The item at the end of the edge
            node: ?{|
              // The ID of the object.
              id: string,
              // The internal database ID of the post.
              // This should never be used in logical computations, however, it exists to give the exact database id for use in sorting or creating classifiers for Posts.
              dbId: ?number,
              // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
              subjectEntries: ?Array<?{|
                // The unicode encoded string representation of the content.
                value: ?string,
                // The ISO 639-1 locale code of the language the content represents.
                localeCode: string
              |}>,
              // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
              bodyEntries: ?Array<?{|
                // The unicode encoded string representation of the content.
                value: ?string,
                // The ISO 639-1 locale code of the language the content represents.
                localeCode: string
              |}>,
              // The parent of a Post, if the Post is a reply to an existing Post. The Relay.Node ID type of the Post object.
              parentId: ?string,
              // The date that the object was created, in UTC timezone, in ISO 8601 format.
              creationDate: ?any,
              // A graphene Field containing the state of the publication of a certain post. The options are:
              // DRAFT,
              //
              // SUBMITTED_IN_EDIT_GRACE_PERIOD,
              //
              // SUBMITTED_AWAITING_MODERATION,
              //
              // PUBLISHED,
              //
              // MODERATED_TEXT_ON_DEMAND,
              //
              // MODERATED_TEXT_NEVER_AVAILABLE,
              //
              // DELETED_BY_USER,
              //
              // DELETED_BY_ADMIN,
              //
              // WIDGET_SCOPED
              //
              publicationState: ?PublicationStates,
              // A Locale in which the original message was written. in a given language.
              originalLocale: ?string,
              // The classification ID for a Post that is under a column view. The classifer must match the identifier of a message column.
              messageClassifier: ?string,
              // A list of SentimentCounts which counts each sentiment expressed. These include:
              //
              // Like,
              //
              // Agree,
              //
              // Disagree,
              //
              // Like,
              //
              // Don't Understand
              //
              // More Info
              //
              sentimentCounts: ?{|
                // The number of Sentiments expressed "like" on the post.
                like: ?number,
                // The number of Sentiments disagreeing with the post.
                disagree: ?number,
                // The number of Sentiments expressing "dont_understand" on the Post.
                dontUnderstand: ?number,
                // The number of Sentiments requesting "more_info" on the post.
                moreInfo: ?number
              |},
              creator: ?{|
                // The ID of the object.
                id: string,
                // The unique database identifier of the User.
                userId: number,
                // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
                displayName: ?string,
                // A boolean flag that shows if the User is deleted.
                // If True, the User information is cleansed from the system, and the User can no longer log in.
                isDeleted: ?boolean,
                // A boolean flag describing if the User is a machine user or human user.
                isMachine: ?boolean,
                // The preferences of the User.
                preferences: ?{|
                  // The harvesting Translation preference.
                  harvestingTranslation: ?{|
                    // The source locale of the translation.
                    localeFrom: string,
                    // The target locale of the translation.
                    localeInto: string
                  |}
                |}
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
    | {}
    | {}
    | {}
    | {}
  )
|};

export type LandingPageQueryVariables = {|
  lang: string
|};

export type LandingPageQuery = {|
  // The discussion object metadata.
  discussion: ?{|
    // The ID of the object.
    id: string,
    // A list of possible languages of the entity as LangStringEntry objects. %s
    titleEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // The title of the discussion, in the language specified by the input
    title: ?string,
    // A list of possible languages of the entity as LangStringEntry objects. %s
    subtitleEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // The subtitle of the discussion, in the language specified by the input
    subtitle: ?string,
    // A list of possible languages of the entity as LangStringEntry objects. %s
    buttonLabelEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // The value inside of the participation button in the landing page.
    buttonLabel: ?string,
    // The file representing the header of the landing page. A file metadata object, described by the Document object.
    headerImage: ?{|
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string,
      // The filename title.
      title: ?string
    |},
    // The file representing the logo of the debate. A file metadata object, described by the Document object.
    logoImage: ?{|
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string,
      // The filename title.
      title: ?string
    |}
  |}
|};

export type LandingPageModuleTypesQueryVariables = {|
  lang?: ?string
|};

export type LandingPageModuleTypesQuery = {|
  // The metadata object for LandingPageModule object.
  landingPageModuleTypes: ?Array<?{|
    // The ID of the object.
    id: string,
    // The default order of this LandingPageModuleType in the context of the landing page.
    defaultOrder: number,
    // The unique ID of the module type. These can be one of:
    //
    //
    // HEADER: The header section of the landing page.
    //
    // INTRODUCTION: The introduction section.
    //
    // TIMELINE: The list of timelines present in the debate.
    //
    // FOOTER: The footer in the landing page, including information such as privacy policies, etc..
    //
    // TOP_THEMATICS: The section hosting the top active thematics.
    //
    // TWEETS: The tweets section, displaying top tweets in the landing page.
    //
    // CHATBOT: The chatbot section, according to the configured chatbot.
    //
    // CONTACT: The contacts section.
    //
    // NEWS: The latest news section, as configured.
    //
    // DATA: The data sections.
    //
    // PARTNERS: The partners section, highlighting the contributing partners' logos.
    //
    //
    identifier: string,
    // A Boolean flag defining if the section is required for the landing page or not.
    required: ?boolean,
    // The title of the section.
    title: ?string,
    // A list of possible languages of the entity as LangStringEntry objects. The Title will be available in every supported language.
    titleEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>
  |}>
|};

export type LandingPageModulesQueryVariables = {|
  lang: string
|};

export type LandingPageModulesQuery = {|
  // A list of LandingPageModules.
  landingPageModules: ?Array<?{|
    titleEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    title: ?string,
    subtitleEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    subtitle: ?string,
    // The JSON-based configuration of the LandingPageModule in the debate.
    configuration: ?string,
    // Whether the Module is activated or not.
    enabled: ?boolean,
    // A flag describign whether the module already exists in the database or not.
    existsInDatabase: ?boolean,
    // The ID of the object.
    id: string,
    // The order of the Module in the entire LandingPage.
    order: number,
    // The LandingPageModuleType describing the Module.
    moduleType: ?{|
      // The ID of the object.
      id: string,
      // The default order of this LandingPageModuleType in the context of the landing page.
      defaultOrder: number,
      // A boolean flag indicating whether the LandingPageModuleType's order can be editeded or not.
      editableOrder: ?boolean,
      // The unique ID of the module type. These can be one of:
      //
      //
      // HEADER: The header section of the landing page.
      //
      // INTRODUCTION: The introduction section.
      //
      // TIMELINE: The list of timelines present in the debate.
      //
      // FOOTER: The footer in the landing page, including information such as privacy policies, etc..
      //
      // TOP_THEMATICS: The section hosting the top active thematics.
      //
      // TWEETS: The tweets section, displaying top tweets in the landing page.
      //
      // CHATBOT: The chatbot section, according to the configured chatbot.
      //
      // CONTACT: The contacts section.
      //
      // NEWS: The latest news section, as configured.
      //
      // DATA: The data sections.
      //
      // PARTNERS: The partners section, highlighting the contributing partners' logos.
      //
      //
      identifier: string,
      // A Boolean flag defining if the section is required for the landing page or not.
      required: ?boolean,
      // The title of the section.
      title: ?string
    |}
  |}>
|};

export type LegalContentsQueryVariables = {|
  lang?: ?string
|};

export type LegalContentsQuery = {|
  // The legal contents metadata representing the data.
  legalContents: ?{|
    // A Legal Notice in a given language.
    legalNotice: ?string,
    // A Terms and Conditions in a given language.
    termsAndConditions: ?string,
    // A Cookie Policy in a given language.
    cookiesPolicy: ?string,
    // A Privacy Policy in a given language.
    privacyPolicy: ?string,
    // A User Guidelines in a given language.
    userGuidelines: ?string,
    // A boolean flag to activate mandatory validation of legal contents after SSO login.
    mandatoryLegalContentsValidation: boolean,
    // A list of possible languages of the entity as LangStringEntry objects.
    legalNoticeEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A list of possible languages of the entity as LangStringEntry objects.
    termsAndConditionsEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A list of possible languages of the entity as LangStringEntry objects.
    cookiesPolicyEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A list of possible languages of the entity as LangStringEntry objects.
    privacyPolicyEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A list of possible languages of the entity as LangStringEntry objects.
    userGuidelinesEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>
  |}
|};

export type LocalesQueryQueryVariables = {|
  lang: string
|};

export type LocalesQueryQuery = {|
  // The list of locales supported on the debate. These are the languages of the debate.
  locales: ?Array<?{|
    // The ISO 639-1 locale code of the language of choice.
    localeCode: string,
    // The name of the locale, in a specifically given language.
    label: string
  |}>
|};

export type MultilingualSynthesisQueryQueryVariables = {|
  id: string
|};

export type MultilingualSynthesisQueryQuery = {|
  // The ID of the object
  synthesisPost: ?(
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
        // A graphene Field containing the state of the publication of a certain post. The options are:
        // DRAFT,
        //
        // SUBMITTED_IN_EDIT_GRACE_PERIOD,
        //
        // SUBMITTED_AWAITING_MODERATION,
        //
        // PUBLISHED,
        //
        // MODERATED_TEXT_ON_DEMAND,
        //
        // MODERATED_TEXT_NEVER_AVAILABLE,
        //
        // DELETED_BY_USER,
        //
        // DELETED_BY_ADMIN,
        //
        // WIDGET_SCOPED
        //
        publicationState: ?PublicationStates,
        // Graphene Field modeling a relationship to a published synthesis.
        publishesSynthesis: ?{|
          // The ID of the object.
          id: string,
          // The type of Synthesis to be created
          synthesisType: SynthesisTypes,
          // A list of possible languages of the entity as LangStringEntry objects. The subject in various languages.
          subjectEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A list of possible languages of the entity as LangStringEntry objects. The body in various languages.
          bodyEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // This is a header image document object that will be visible on the Synthesis view's header.A file metadata object, described by the Document object.
          img: ?{|
            // The ID of the object.
            id: string,
            // The filename title.
            title: ?string,
            // A url to an image or a document to be attached.
            externalUrl: ?string,
            // The MIME-Type of the file uploaded.
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
  )
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
    | {}
    | {}
    | {
        // The ID of the object.
        id: string,
        // The internal database ID of the post.
        // This should never be used in logical computations, however, it exists to give the exact database id for use in sorting or creating classifiers for Posts.
        dbId: ?number,
        // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
        subjectEntries: ?Array<?{|
          // The unicode encoded string representation of the content.
          value: ?string,
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string
        |}>,
        // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
        bodyEntries: ?Array<?{|
          // The unicode encoded string representation of the content.
          value: ?string,
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string
        |}>,
        // A list of SentimentCounts which counts each sentiment expressed. These include:
        //
        // Like,
        //
        // Agree,
        //
        // Disagree,
        //
        // Like,
        //
        // Don't Understand
        //
        // More Info
        //
        sentimentCounts: ?{|
          // The number of Sentiments disagreeing with the post.
          disagree: ?number,
          // The number of Sentiments expressing "dont_understand" on the Post.
          dontUnderstand: ?number,
          // The number of Sentiments expressed "like" on the post.
          like: ?number,
          // The number of Sentiments requesting "more_info" on the post.
          moreInfo: ?number
        |},
        // The SentimentType that the API calling User has on the Post, if any.
        mySentiment: ?SentimentTypes,
        // A list of IdeaContentLinks, which describe all of the connections the Post has with various Ideas.
        indirectIdeaContentLinks: ?Array<?{|
          // The Idea object associated with an IdeaContentLink.
          idea: ?{|
            // The ID of the object.
            id: string,
            // The title of the Idea, often shown in the Idea header itself.
            title: ?string,
            // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
            messageViewOverride: ?string
          |}
        |}>,
        creator: ?{|
          // The ID of the object.
          id: string,
          // The unique database identifier of the User.
          userId: number,
          // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
          displayName: ?string,
          // A boolean flag that shows if the User is deleted.
          // If True, the User information is cleansed from the system, and the User can no longer log in.
          isDeleted: ?boolean,
          // A boolean flag describing if the User is a machine user or human user.
          isMachine: ?boolean,
          // The preferences of the User.
          preferences: ?{|
            // The harvesting Translation preference.
            harvestingTranslation: ?{|
              // The source locale of the translation.
              localeFrom: string,
              // The target locale of the translation.
              localeInto: string
            |}
          |}
        |},
        // The User or AgentProfile who created the parent post.
        parentPostCreator: ?{|
          // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
          displayName: ?string
        |},
        // A boolean flag to say whether the post is modified or not.
        modified: ?boolean,
        // A ??? in a given language.
        bodyMimeType: string,
        // A graphene Field containing the state of the publication of a certain post. The options are:
        // DRAFT,
        //
        // SUBMITTED_IN_EDIT_GRACE_PERIOD,
        //
        // SUBMITTED_AWAITING_MODERATION,
        //
        // PUBLISHED,
        //
        // MODERATED_TEXT_ON_DEMAND,
        //
        // MODERATED_TEXT_NEVER_AVAILABLE,
        //
        // DELETED_BY_USER,
        //
        // DELETED_BY_ADMIN,
        //
        // WIDGET_SCOPED
        //
        publicationState: ?PublicationStates,
        // A list of IdeaContentLinks that are in fact Extracts on the Post. Extracts are valuable entities taken from
        extracts: ?Array<?{|
          // The ID of the object.
          id: string,
          // The date the Extract was created, in UTC timezone.
          creationDate: ?any,
          // A flag for importance of the Extract.
          important: ?boolean,
          // The body of text that is extracted from the post. This is not language dependent, but rather just unicode text.
          body: string,
          // The lang of the extract.
          lang: ?string,
          // The taxonomy (or classification) of the extracted body. The options are one of:
          //
          //
          // issue: The body of text is an issue.
          //
          // actionable_solution: The body of text is a potentially actionable solution.
          //
          // knowledge: The body of text is in fact knowledge gained by the community.
          //
          // example: The body of text is an example in the context that it was derived from.
          //
          // concept: The body of text is a high level concept.
          //
          // argument: The body of text is an argument for/against in the context that it was extracted from.
          //
          // cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.
          //
          //
          extractNature: ?string,
          // The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:
          //
          //
          // classify: This body of text should be re-classified by an priviledged user.
          //
          // make_generic: The body of text is a specific example and not generic.
          //
          // argument: A user must give more arguments.
          //
          // give_examples: A user must give more examples.
          //
          // more_specific: A user must be more specific within the same context.
          //
          // mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.
          //
          // display_multi_column: A priviledged user should activate the Mutli-Column view.
          //
          // display_thread: A priviledged user should activate the Thread view.
          //
          // display_tokens: A priviledged user should activate the Token Vote view.
          //
          // display_open_questions: A priviledged user should activate the Open Question view.
          //
          // display_bright_mirror: A priviledged user should activate the Bright Mirror view.
          //
          //
          extractAction: ?string,
          // A graphene Field containing the state of the extract. The options are:
          // SUBMITTED,
          //
          // PUBLISHED
          //
          extractState: ?ExtractStates,
          // A list of TextFragmentIdentifiers.
          textFragmentIdentifiers: ?Array<?{|
            // The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned.
            xpathStart: ?string,
            // The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
            // Often times the xpathEnd variable is the same as the xpathStart selector.
            xpathEnd: ?string,
            // The character offset index where an extract begins, beginning from index 0 in a string of text.
            offsetStart: ?number,
            // The character offset index where an extract ends in a string of text.
            offsetEnd: ?number
          |}>,
          // The AgentProfile object description of the creator.
          creator: ?{|
            // The ID of the object.
            id: string,
            // The unique database identifier of the User.
            userId: number,
            // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
            displayName: ?string,
            // A boolean flag that shows if the User is deleted.
            // If True, the User information is cleansed from the system, and the User can no longer log in.
            isDeleted: ?boolean,
            // A boolean flag describing if the User is a machine user or human user.
            isMachine: ?boolean,
            // The preferences of the User.
            preferences: ?{|
              // The harvesting Translation preference.
              harvestingTranslation: ?{|
                // The source locale of the translation.
                localeFrom: string,
                // The target locale of the translation.
                localeInto: string
              |}
            |}
          |},
          // The list of tags of the extract.
          tags: ?Array<?{|
            // The ID of the object.
            id: string,
            // The value of the tag. This is not language dependent, but rather just unicode text.
            value: string
          |}>
        |}>,
        // List of attachements to the post.
        attachments: ?Array<?{|
          // The ID of the object.
          id: string,
          // Any file that can be attached. A file metadata object, described by the Document object.
          document: ?{|
            // The ID of the object.
            id: string,
            // The filename title.
            title: ?string,
            // A url to an image or a document to be attached.
            externalUrl: ?string,
            // The MIME-Type of the file uploaded.
            mimeType: ?string
          |}
        |}>,
        // Keywords associated with the post, according to NLP engine.
        keywords: ?Array<?{|
          // The score associated with the tag (0-1, increasing relevance)
          score: ?number,
          // The number of times the tag was found
          count: ?number,
          // The tag keyword
          value: ?string
        |}>,
        // A list of abstract tags associated to the post.
        tags: ?Array<?{|
          // The ID of the object.
          id: string,
          // The value of the tag. This is not language dependent, but rather just unicode text.
          value: string
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
    | {}
    | {}
  )
|};

export type ProfileFieldsQueryVariables = {|
  lang: string
|};

export type ProfileFieldsQuery = {|
  // A list of ConfigurableField union, where each text field represents a field on a profile only.
  profileFields: ?Array<?{|
    // The ID of the object.
    id: string,
    // The configuration options affecting this field.
    configurableField:
      | {
          // The type of the field. The possible options are:
          //
          // TEXT
          //
          // EMAIL
          //
          // PASSWORD
          fieldType: string,
          // The ID of the object.
          id: string,
          // The unique identifier of the field.
          identifier: ?string,
          // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
          titleEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A Text Field Label in a given language.
          title: ?string,
          // The position (order) of the Field compared to other Fields.
          order: ?number,
          // A flag indicating if the Field requires an input or not.
          required: ?boolean,
          // A flag indicating if the Field is hidden for the user or not.
          hidden: boolean
        }
      | {
          // The ID of the object.
          id: string,
          // The unique identifier of the field.
          identifier: ?string,
          // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
          titleEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A Text Field Label in a given language.
          title: ?string,
          // The position (order) of the Field compared to other Fields.
          order: ?number,
          // A flag indicating if the Field requires an input or not.
          required: ?boolean,
          // A flag indicating if the Field is hidden for the user or not.
          hidden: boolean,
          options: ?Array<?{|
            // The ID of the object.
            id: string,
            // The position (order) of the field.
            order: number,
            // A Text Field Label in a given language.
            label: ?string,
            // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
            labelEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>
          |}>
        },
    // The value of the field. It can be of various types.
    valueData: ?any
  |}>
|};

export type QuestionPostsQueryVariables = {|
  id: string,
  first: number,
  after: string,
  fromNode?: ?string,
  isModerating?: ?boolean
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
    | {
        // The ID of the object.
        id: string,
        // The list of all posts under the Question.
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
              // A Locale in which the original message was written. in a given language.
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
  )
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
    | {
        // The Question to be asked itself, in the language given.
        title: ?string,
        // The ID of the object.
        id: string,
        // The total number of active posts on that idea (excludes deleted posts).
        numPosts: ?number,
        // The total number of users who contributed to the Idea/Thematic/Question.
        //
        // Contribution is counted as either as a sentiment set, a post created.
        numContributors: ?number,
        // The count of total sentiments
        totalSentiments: number,
        // Parent Idea
        parent: ?{
          // The title of the Idea, often shown in the Idea header itself.
          title: ?string,
          // Header image associated with the idea. A file metadata object, described by the Document object.
          img: ?{|
            // A url to an image or a document to be attached.
            externalUrl: ?string,
            // The MIME-Type of the file uploaded.
            mimeType: ?string
          |},
          // The ID of the object.
          id: string
        }
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
  )
|};

export type ResourcesCenterPageQueryVariables = {|
  lang: string
|};

export type ResourcesCenterPageQuery = {|
  // A singular Resource Center meta data object.
  resourcesCenter: ?{|
    // The name of the resource center in a specific language.
    title: ?string,
    // The name of the resource center in all available languages
    titleEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // The main image associated with the resource centerA file metadata object, described by the Document object.
    headerImage: ?{|
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string,
      // The filename title.
      title: ?string
    |}
  |}
|};

export type ResourcesQueryQueryVariables = {|
  lang: string
|};

export type ResourcesQueryQuery = {|
  // A list of Resource meta data on the debate.
  resources: ?Array<?{|
    // A file attached to the ResourceA file metadata object, described by the Document object.
    doc: ?{|
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string,
      // The filename title.
      title: ?string
    |},
    // The URL for any i-frame based content that matches the Content-Security-Policy of the server.
    // In effect, this is the "src" code inside of an iframe-based attachment to a Resource.
    embedCode: ?string,
    // The ID of the object.
    id: string,
    // An image attached to the ResourceA file metadata object, described by the Document object.
    image: ?{|
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string,
      // The filename title.
      title: ?string
    |},
    text: ?string,
    title: ?string,
    // A list of possible languages of the entity as LangStringEntry objects. The title of the Resource in various languages.
    titleEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A list of possible languages of the entity as LangStringEntry objects. The title of the Resource in various languages.
    textEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // The order of the Resource on the Resources Center page.A file metadata object, described by the Document object.
    order: ?number
  |}>
|};

export type RootIdeaStatsQuery = {|
  // An idea union between either an Idea type or a Thematic type.
  rootIdea: ?{
    // The ID of the object.
    id: string,
    // The total number of active posts on that idea (excludes deleted posts).
    numPosts: ?number
  },
  // The total count of sentiments on the debate, regardless of chosen type. Deleted users' sentiments are not counted.
  totalSentiments: ?number,
  // The total of all participations on all the vote sessions
  totalVoteSessionParticipations: number,
  // The number of active participants on the debate with any form of contribution.
  numParticipants: ?number,
  // The object containing the summary data of analytics on the page, based on time-series analysis of analytics engine data.
  visitsAnalytics: ?{|
    // The total number of hours spent on the platform by all users.
    sumVisitsLength: ?number,
    // The total number of page views accumulated.
    nbPageviews: ?number,
    // The total number of unique page views.
    nbUniqPageviews: ?number
  |}
|};

export type SectionsQueryQueryVariables = {|
  lang?: ?string
|};

export type SectionsQueryQuery = {|
  // A boolean flag indicating if the debate has a resource center set or not.
  hasResourcesCenter: ?boolean,
  // A boolean flag indicating if the debate has yet released a synthesis or not.
  hasSyntheses: ?boolean,
  // A list of Section meta data on the discussion.
  sections: ?Array<?{|
    // The ID of the object.
    id: string,
    // There are 5 section types:
    //
    // HOMEPAGE
    //
    // DEBATE
    //
    // SYNTHESES
    //
    // RESOURCES_CENTER
    //
    // CUSTOM
    //
    // ADMINISTRATION
    sectionType: string,
    // The order of the Sections on the top of the page.
    order: number,
    // A The title of the Section. in a given language.
    title: ?string,
    // A list of possible languages of the entity as LangStringEntry objects. The title of the Section in various languages.
    titleEntries: ?Array<?{|
      // The unicode encoded string representation of the content.
      value: ?string,
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string
    |}>,
    // An optional field. Should the tab redirect to a location outside of the platform, the URL is the location to redirect towards.
    url: ?string
  |}>
|};

export type SemanticAnalysisForDiscussionDataQueryVariables = {|
  lang?: ?string
|};

export type SemanticAnalysisForDiscussionDataQuery = {|
  // The discussion object metadata.
  semanticAnalysisForDiscussionData: ?{|
    // The ID of the object.
    id: string,
    // The aggregated sentiment analysis on the posts
    nlpSentiment: ?{|
      // The sum of positive scores
      positive: ?number,
      // The sum of negative scores
      negative: ?number,
      // The number of posts analyzed
      count: ?number
    |},
    // The title of the discussion, in the language specified by the input
    title: ?string,
    // Keywords most often found in the discussion, according to NLP engine
    topKeywords: ?Array<?{|
      // The number of times the tag was found
      count: ?number,
      // The score associated with the tag (0-1, increasing relevance)
      score: ?number,
      // The tag keyword
      value: ?string
    |}>
  |}
|};

export type SemanticAnalysisForThematicDataQueryVariables = {|
  lang: string,
  id: string
|};

export type SemanticAnalysisForThematicDataQuery = {|
  // The ID of the object
  semanticAnalysisForThematicData: ?(
    | {
        // The ID of the object.
        id: string,
        // The aggregated sentiment analysis on the posts
        nlpSentiment: ?{|
          // The sum of positive scores
          positive: ?number,
          // The sum of negative scores
          negative: ?number,
          // The number of posts analyzed
          count: ?number
        |},
        // The title of the Idea, often shown in the Idea header itself.
        title: ?string,
        // The list of top keywords found in messages associated to this idea, according to NLP engine
        topKeywords: ?Array<?{|
          // The number of times the tag was found
          count: ?number,
          // The score associated with the tag (0-1, increasing relevance)
          score: ?number,
          // The tag keyword
          value: ?string
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
  )
|};

export type SynthesesQueryQueryVariables = {|
  lang: string
|};

export type SynthesesQueryQuery = {|
  // A list of all syntheses on the debate.
  syntheses: ?Array<?{|
    // The ID of the object.
    id: string,
    // The subject of the synthesis.
    subject: ?string,
    // The creation date of the synthesis.
    creationDate: ?any,
    // This is a header image document object that will be visible on the Synthesis view's header.A file metadata object, described by the Document object.
    img: ?{|
      // The ID of the object.
      id: string,
      // The filename title.
      title: ?string,
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string
    |},
    // Synthesis post to be created.
    post: ?{|
      // The ID of the object.
      id: string,
      // A graphene Field containing the state of the publication of a certain post. The options are:
      // DRAFT,
      //
      // SUBMITTED_IN_EDIT_GRACE_PERIOD,
      //
      // SUBMITTED_AWAITING_MODERATION,
      //
      // PUBLISHED,
      //
      // MODERATED_TEXT_ON_DEMAND,
      //
      // MODERATED_TEXT_NEVER_AVAILABLE,
      //
      // DELETED_BY_USER,
      //
      // DELETED_BY_ADMIN,
      //
      // WIDGET_SCOPED
      //
      publicationState: ?PublicationStates
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
        // Graphene Field modeling a relationship to a published synthesis.
        publishesSynthesis: ?{|
          // The ID of the object.
          id: string,
          // The type of Synthesis to be created
          synthesisType: SynthesisTypes,
          // The subject of the synthesis.
          subject: ?string,
          // The introduction of the synthesis.
          introduction: ?string,
          // The body of the full text synthesis.
          body: ?string,
          // The conclusion of the synthesis.
          conclusion: ?string,
          // The creation date of the synthesis.
          creationDate: ?any,
          // This is a header image document object that will be visible on the Synthesis view's header.A file metadata object, described by the Document object.
          img: ?{|
            // The ID of the object.
            id: string,
            // The filename title.
            title: ?string,
            // A url to an image or a document to be attached.
            externalUrl: ?string,
            // The MIME-Type of the file uploaded.
            mimeType: ?string
          |},
          // This is the list of ideas related to the synthesis.
          ideas: ?Array<?{
            // The ID of the object.
            id: string,
            // A list of Relay.Node ID's representing the parents Ideas of the Idea.
            ancestors: ?Array<?string>,
            // The title of the Idea, often shown in the Idea header itself.
            title: ?string,
            // A Synthesis title in a given language.
            synthesisTitle: ?string,
            // The IdeaUnion between an Idea or a Thematic. This can be used to query specific fields unique to the type of Idea.
            live: ?{
              // The ID of the object.
              id: string,
              // The order of the Idea, Thematic, Question in the idea tree.
              order: ?number,
              // The total number of active posts on that idea (excludes deleted posts).
              numPosts: ?number,
              // The total number of users who contributed to the Idea/Thematic/Question.
              //
              // Contribution is counted as either as a sentiment set, a post created.
              numContributors: ?number,
              // A list of IdeaMessageColumn objects, if any set, on an Idea.
              messageColumns: ?Array<?{|
                // A CSS color that will be used to theme the column.
                color: ?string,
                // A Synthesis done on the column, of type Post.
                columnSynthesis: ?{|
                  // The ID of the object.
                  id: string,
                  // A Subject of the post in a given language.
                  subject: ?string,
                  // A Body of the post (the main content of the post). in a given language.
                  body: ?string,
                  // The SentimentType that the API calling User has on the Post, if any.
                  mySentiment: ?SentimentTypes,
                  // A list of SentimentCounts which counts each sentiment expressed. These include:
                  //
                  // Like,
                  //
                  // Agree,
                  //
                  // Disagree,
                  //
                  // Like,
                  //
                  // Don't Understand
                  //
                  // More Info
                  //
                  sentimentCounts: ?{|
                    // The number of Sentiments disagreeing with the post.
                    disagree: ?number,
                    // The number of Sentiments expressing "dont_understand" on the Post.
                    dontUnderstand: ?number,
                    // The number of Sentiments expressed "like" on the post.
                    like: ?number,
                    // The number of Sentiments requesting "more_info" on the post.
                    moreInfo: ?number
                  |}
                |},
                // The order of the message column in the Idea/Thematic.
                index: ?number,
                // The unique classification identifier of the MessageColumn. All content who will be put under this column must have this classifer.
                messageClassifier: string,
                // A The name of the column in a given language.
                name: ?string,
                // The number of posts contributed to only this column.
                numPosts: ?number,
                // A The title of the column in a given language.
                title: ?string
              |}>,
              // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
              messageViewOverride: ?string,
              // Header image associated with the idea. A file metadata object, described by the Document object.
              img: ?{|
                // A url to an image or a document to be attached.
                externalUrl: ?string
              |},
              // A list of all Posts under the Idea. These include posts of the subIdeas.
              posts: ?{|
                edges: Array<?{|
                  // The item at the end of the edge
                  node: ?{|
                    // A list of SentimentCounts which counts each sentiment expressed. These include:
                    //
                    // Like,
                    //
                    // Agree,
                    //
                    // Disagree,
                    //
                    // Like,
                    //
                    // Don't Understand
                    //
                    // More Info
                    //
                    sentimentCounts: ?{|
                      // The number of Sentiments expressed "like" on the post.
                      like: ?number,
                      // The number of Sentiments disagreeing with the post.
                      disagree: ?number,
                      // The number of Sentiments expressing "dont_understand" on the Post.
                      dontUnderstand: ?number,
                      // The number of Sentiments requesting "more_info" on the post.
                      moreInfo: ?number
                    |},
                    // A graphene Field containing the state of the publication of a certain post. The options are:
                    // DRAFT,
                    //
                    // SUBMITTED_IN_EDIT_GRACE_PERIOD,
                    //
                    // SUBMITTED_AWAITING_MODERATION,
                    //
                    // PUBLISHED,
                    //
                    // MODERATED_TEXT_ON_DEMAND,
                    //
                    // MODERATED_TEXT_NEVER_AVAILABLE,
                    //
                    // DELETED_BY_USER,
                    //
                    // DELETED_BY_ADMIN,
                    //
                    // WIDGET_SCOPED
                    //
                    publicationState: ?PublicationStates
                  |}
                |}>
              |}
            }
          }>
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
  )
|};

export type TabsConditionQueryVariables = {|
  lang: string
|};

export type TabsConditionQuery = {|
  // A boolean flag indicating if the debate has a resource center set or not.
  hasResourcesCenter: ?boolean,
  // A boolean flag indicating if the debate has yet released a synthesis or not.
  hasSyntheses: ?boolean,
  // A boolean flag of whether a debate has set a legal notice.
  hasLegalNotice: ?boolean,
  // A boolean flag of whether a debate has set terms and conditions.
  hasTermsAndConditions: ?boolean,
  // A boolean flag of whether a debate has set a cookie policy.
  hasCookiesPolicy: ?boolean,
  // A boolean flag of whether a debate has set a privacy policy.
  hasPrivacyPolicy: ?boolean,
  // A boolean flag of whether a debate has set user guidelines.
  hasUserGuidelines: ?boolean,
  // The discussion object metadata.
  discussion: ?{|
    // The ID of the object.
    id: string,
    // A URL for the homepage (optional). Often placed on the logo.
    homepageUrl: ?string
  |},
  // The legal contents metadata representing the data.
  legalContents: ?{|
    // A boolean flag to activate mandatory validation of legal contents after SSO login.
    mandatoryLegalContentsValidation: boolean
  |}
|};

export type TagsQueryVariables = {|
  filter?: ?string,
  limit?: ?number
|};

export type TagsQuery = {|
  // The list of filtered tags available on the discussion.
  tags: ?Array<?{|
    // The ID of the object.
    id: string,
    // The value of the tag. This is not language dependent, but rather just unicode text.
    value: string
  |}>
|};

export type TextFieldsQueryVariables = {|
  lang: string
|};

export type TextFieldsQuery = {|
  // A list of ConfigurableField union, where each text field represents a field on a bound entity.
  textFields: ?Array<?(
    | {
        // The type of the field. The possible options are:
        //
        // TEXT
        //
        // EMAIL
        //
        // PASSWORD
        fieldType: string,
        // The ID of the object.
        id: string,
        // The unique identifier of the field.
        identifier: ?string,
        // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
        titleEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>,
        // A Text Field Label in a given language.
        title: ?string,
        // The position (order) of the Field compared to other Fields.
        order: ?number,
        // A flag indicating if the Field requires an input or not.
        required: ?boolean,
        // A flag indicating if the Field is hidden for the user or not.
        hidden: boolean
      }
    | {
        // The ID of the object.
        id: string,
        // The unique identifier of the field.
        identifier: ?string,
        // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
        titleEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>,
        // A Text Field Label in a given language.
        title: ?string,
        // The position (order) of the Field compared to other Fields.
        order: ?number,
        // A flag indicating if the Field requires an input or not.
        required: ?boolean,
        // A flag indicating if the Field is hidden for the user or not.
        hidden: boolean,
        options: ?Array<?{|
          // The ID of the object.
          id: string,
          // The position (order) of the field.
          order: number,
          // A Text Field Label in a given language.
          label: ?string,
          // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
          labelEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>
        |}>
      }
  )>
|};

export type ThematicQueryQueryVariables = {|
  lang: string,
  id: string
|};

export type ThematicQueryQuery = {|
  // The ID of the object
  thematic: ?(
    | {
        // The ID of the object.
        id: string,
        // The total number of active posts on that idea (excludes deleted posts).
        numPosts: ?number,
        // The total number of users who contributed to the Idea/Thematic/Question.
        //
        // Contribution is counted as either as a sentiment set, a post created.
        numContributors: ?number,
        // Total number of sentiments expressed by participants on posts related to that idea.
        totalSentiments: number,
        // A list of Question objects that are bound to the Thematic.
        questions: ?Array<?{|
          // The Question to be asked itself, in the language given.
          title: ?string,
          // The ID of the object.
          id: string,
          // Whether the question has pending posts or not.
          hasPendingPosts: ?boolean,
          // The list of all posts under the Question.
          posts: ?{|
            edges: Array<?{|
              // The item at the end of the edge
              node: ?{|
                // The ID of the object.
                id: string,
                // A Locale in which the original message was written. in a given language.
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
  )
|};

export type ThematicsDataQueryQueryVariables = {|
  discussionPhaseId: number,
  lang: string
|};

export type ThematicsDataQueryQuery = {|
  // List of all ideas on the debate.
  thematicsData: ?Array<?{
    // The order of the Idea, Thematic, Question in the idea tree.
    order: ?number,
    // The ID of the object.
    id: string,
    // The Relay.Node ID type of the Idea object.
    parentId: ?string,
    // The title of the Idea, often shown in the Idea header itself.
    title: ?string
  }>,
  // An idea union between either an Idea type or a Thematic type.
  rootIdea: ?{
    // The ID of the object.
    id: string
  }
|};

export type ThematicsQueryQueryVariables = {|
  discussionPhaseId: number
|};

export type ThematicsQueryQuery = {|
  // List of all ideas on the debate.
  thematics: ?Array<?{
    // The Relay.Node ID type of the Idea object.
    parentId: ?string,
    // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
    messageViewOverride: ?string,
    // The order of the Idea, Thematic, Question in the idea tree.
    order: ?number,
    // The total number of active posts on that idea (excludes deleted posts).
    numPosts: ?number,
    // A list of possible languages of the entity as LangStringEntry objects. This is the Idea title in multiple languages.
    titleEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A list of possible languages of the entity as LangStringEntry objects. This is the description of the Idea in multiple languages.
    descriptionEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // Header image associated with the idea. A file metadata object, described by the Document object.
    img: ?{|
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string,
      // The filename title.
      title: ?string
    |},
    // An Announcement object representing a summary of an Idea. This is often included in a header display of an Idea.
    announcement: ?{|
      // A list of possible languages of the entity as LangStringEntry objects. This is the title of announcement in multiple languages.
      titleEntries: Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. This is the body of announcement in multiple languages.
      bodyEntries: Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. This is the quote of the announcement in multiple languages.
      quoteEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. This is the summry of the announcement in multiple languages.
      summaryEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>
    |},
    // A list of Question objects that are bound to the Thematic.
    questions: ?Array<?{|
      // The ID of the object.
      id: string,
      // A list of possible languages of the entity as LangStringEntry objects.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>
    |}>,
    // A list of IdeaMessageColumn objects, if any set, on an Idea.
    messageColumns: ?Array<?{|
      // The ID of the object.
      id: string,
      // A CSS color that will be used to theme the column.
      color: ?string,
      // A Synthesis done on the column, of type Post.
      columnSynthesis: ?{|
        // The ID of the object.
        id: string,
        // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
        subjectEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>,
        // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
        bodyEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>
      |},
      // The order of the message column in the Idea/Thematic.
      index: ?number,
      // The unique classification identifier of the MessageColumn. All content who will be put under this column must have this classifer.
      messageClassifier: string,
      // A list of possible languages of the entity as LangStringEntry objects. The name of the column in multiple languages.
      nameEntries: Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The title of the column in multiple languages.
      titleEntries: Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>
    |}>,
    // The ID of the object.
    id: string
  }>,
  // An idea union between either an Idea type or a Thematic type.
  rootIdea: ?{
    // The ID of the object.
    id: string
  }
|};

export type TimelineQueryVariables = {|
  lang: string
|};

export type TimelineQuery = {|
  // A list of DiscussionPhase objects, descriping the timeline objects on the debate.
  timeline: ?Array<?{|
    // The ID of the object.
    id: string,
    // Identifier of the Phase. Possible phase identifiers: "survey", "thread", "multiColumns", "voteSession", "brightMirror".
    identifier: ?string,
    // A title of the Phase. in a given language.
    title: ?string,
    // A list of possible languages of the entity as LangStringEntry objects. These are the title of the phase in various languages.
    titleEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A description of the Phase. in a given language.
    description: ?string,
    // A list of possible languages of the entity as LangStringEntry objects. These are the description of the phase in various languages.
    descriptionEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // An ISO 8601, UTC timezoned time representing the starting date of the phase.
    start: ?any,
    // An ISO 8601, UTC timezoned time representing the ending date of the phase.
    end: ?any,
    // A Order of the phase in the Timeline. as a float
    order: ?number,
    // The image displayed on the phase.A file metadata object, described by the Document object.
    image: ?{|
      // The MIME-Type of the file uploaded.
      mimeType: ?string,
      // The filename title.
      title: ?string,
      // A url to an image or a document to be attached.
      externalUrl: ?string
    |}
  |}>
|};

export type UserPreferencesQueryVariables = {|
  id: string
|};

export type UserPreferencesQuery = {|
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
    | {}
    | {}
    | {
        // The ID of the object.
        id: string,
        // The preferences of the User.
        preferences: ?{|
          // The harvesting Translation preference.
          harvestingTranslation: ?{|
            // The source locale of the translation.
            localeFrom: string,
            // The target locale of the translation.
            localeInto: string
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
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
    | {}
  )
|};

export type VoteSessionQueryVariables = {|
  ideaId: string,
  lang: string
|};

export type VoteSessionQuery = {|
  // A vote session's meta data, if a vote session exists.
  voteSession: ?{|
    // The ID of the object.
    id: string,
    // The count of participants on the vote session.
    numParticipants: number,
    // A flag allowing users to view the current votes.
    seeCurrentVotes: boolean,
    // A list of possible languages of the entity as LangStringEntry objects. The Proposal section's title in various languages.
    propositionsSectionTitleEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // The title of the section where all Propositions are given.
    propositionsSectionTitle: ?string,
    // The list of Proposals on which the Users will be allowed to vote.
    proposals: Array<?{|
      // The ID of the object.
      id: string,
      // The title of the Idea, often shown in the Idea header itself.
      title: ?string,
      // The description of the Idea, often shown in the header of the Idea.
      description: ?string,
      // A list of possible languages of the entity as LangStringEntry objects. This is the Idea title in multiple languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. This is the description of the Idea in multiple languages.
      descriptionEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // The order of the Idea, Thematic, Question in the idea tree.
      order: ?number,
      // The VoteResult object showing the status and result of a VoteSession on Idea.
      voteResults: {|
        // The count of participants on the vote proposal.
        numParticipants: number
      |},
      // The VoteSpecificationUnion placed on the Idea. This is the metadata describing the configuration of a VoteSession.
      modules: Array<?(
        | {
            // The ID of the object.
            id: string,
            // The Relay.Node ID type of the Vote Session object.
            voteSessionId: string,
            // A The instructions of the VoteSpecification. in a given language.
            instructions: ?string,
            // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
            titleEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>,
            // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
            instructionsEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>,
            // A flag specifying if the module has been customized for a specific Proposal.
            isCustom: boolean,
            exclusiveCategories: ?boolean,
            // The list of Token category specification(TokenCategorySpecification).
            tokenCategories: Array<?{|
              // The ID of the object.
              id: string,
              totalNumber: number,
              // categories which have the same typename will be comparable (example: "positive")
              typename: string,
              // A The title of the Token Category. in a given language.
              title: ?string,
              // A list of possible languages of the entity as LangStringEntry objects. The title of the Token Category in various languages.
              titleEntries: ?Array<?{|
                // The ISO 639-1 locale code of the language the content represents.
                localeCode: string,
                // The unicode encoded string representation of the content.
                value: ?string
              |}>,
              color: ?string
            |}>,
            // The Relay.Node ID type of the Vote Specification template object. A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications.
            voteSpecTemplateId: ?string,
            // The type of the VoteSpecification.
            voteType: ?string,
            // The list of Votes by a specific User.
            myVotes: Array<?(
              | {
                  // The number of Tokens used on a certain Vote.
                  voteValue: number,
                  proposalId: string,
                  tokenCategoryId: string
                }
              | {}
            )>,
            // The total number of Voters for this Vote.
            numVotes: number,
            // The list of information regarding votes (VotesByCategory).
            tokenVotes: Array<?{|
              // The Relay.Node ID type of the TokenCategory object.
              tokenCategoryId: string,
              // The number of tokens on that Category.
              numToken: number
            |}>
          }
        | {
            // The ID of the object.
            id: string,
            // The Relay.Node ID type of the Vote Session object.
            voteSessionId: string,
            // A The instructions of the VoteSpecification. in a given language.
            instructions: ?string,
            // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
            titleEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>,
            // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
            instructionsEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>,
            // A flag specifying if the module has been customized for a specific Proposal.
            isCustom: boolean,
            // The list of GaugeChoiceSpecifications available on a Gauge. These describe all of the options available in the GaugeVote.
            choices: ?Array<?{|
              // The ID of the object.
              id: string,
              value: number,
              // A The label of the Gauge in a given language.
              label: ?string,
              // A list of possible languages of the entity as LangStringEntry objects. The label of the Gauge in various languages.
              labelEntries: ?Array<?{|
                // The ISO 639-1 locale code of the language the content represents.
                localeCode: string,
                // The unicode encoded string representation of the content.
                value: ?string
              |}>
            |}>,
            // The Relay.Node ID type of the Vote Specification template object. A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications.
            voteSpecTemplateId: ?string,
            // The type of the VoteSpecification.
            voteType: ?string,
            // The list of Votes by a specific User.
            myVotes: Array<?(
              | {}
              | {
                  // The value entered on the GaugeVote.
                  selectedValue: number,
                  proposalId: string
                }
            )>,
            // The total number of Voters for this Vote.
            numVotes: number,
            // A The label of the average value for the Gauge in a given language.
            averageLabel: ?string,
            // A The average value for the Gauge as a float
            averageResult: ?number
          }
        | {
            // The ID of the object.
            id: string,
            // The Relay.Node ID type of the Vote Session object.
            voteSessionId: string,
            // A The instructions of the VoteSpecification. in a given language.
            instructions: ?string,
            // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
            titleEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>,
            // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
            instructionsEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>,
            // A flag specifying if the module has been customized for a specific Proposal.
            isCustom: boolean,
            // The minimum value on the Gauge.
            minimum: ?number,
            // The maximum value on the Gauge.
            maximum: ?number,
            // The number of intervals between the minimum and maximum values.
            nbTicks: ?number,
            // The unit used on the Gauge. This could be anything desired, like:
            //
            // USD ($) or Euros (€)
            //
            // Months
            //
            // PPM (Parts per million)
            //
            // etc
            unit: ?string,
            // The Relay.Node ID type of the Vote Specification template object. A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications.
            voteSpecTemplateId: ?string,
            // The type of the VoteSpecification.
            voteType: ?string,
            // The list of Votes by a specific User.
            myVotes: Array<?(
              | {}
              | {
                  // The value entered on the GaugeVote.
                  selectedValue: number,
                  proposalId: string
                }
            )>,
            // The total number of Voters for this Vote.
            numVotes: number,
            // The average value of the Votes submitted by all Users.
            averageResult: ?number
          }
      )>
    |}>,
    // A list of VoteSpecifications.
    modules: Array<?(
      | {
          // The ID of the object.
          id: string,
          // The Relay.Node ID type of the Vote Session object.
          voteSessionId: string,
          // A The instructions of the VoteSpecification. in a given language.
          instructions: ?string,
          // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
          titleEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
          instructionsEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A flag specifying if the module has been customized for a specific Proposal.
          isCustom: boolean,
          exclusiveCategories: ?boolean,
          // The list of Token category specification(TokenCategorySpecification).
          tokenCategories: Array<?{|
            // The ID of the object.
            id: string,
            totalNumber: number,
            // categories which have the same typename will be comparable (example: "positive")
            typename: string,
            // A The title of the Token Category. in a given language.
            title: ?string,
            // A list of possible languages of the entity as LangStringEntry objects. The title of the Token Category in various languages.
            titleEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>,
            color: ?string
          |}>,
          // The Relay.Node ID type of the Vote Specification template object. A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications.
          voteSpecTemplateId: ?string,
          // The type of the VoteSpecification.
          voteType: ?string
        }
      | {
          // The ID of the object.
          id: string,
          // The Relay.Node ID type of the Vote Session object.
          voteSessionId: string,
          // A The instructions of the VoteSpecification. in a given language.
          instructions: ?string,
          // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
          titleEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
          instructionsEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A flag specifying if the module has been customized for a specific Proposal.
          isCustom: boolean,
          // The list of GaugeChoiceSpecifications available on a Gauge. These describe all of the options available in the GaugeVote.
          choices: ?Array<?{|
            // The ID of the object.
            id: string,
            value: number,
            // A The label of the Gauge in a given language.
            label: ?string,
            // A list of possible languages of the entity as LangStringEntry objects. The label of the Gauge in various languages.
            labelEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>
          |}>,
          // The Relay.Node ID type of the Vote Specification template object. A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications.
          voteSpecTemplateId: ?string,
          // The type of the VoteSpecification.
          voteType: ?string
        }
      | {
          // The ID of the object.
          id: string,
          // The Relay.Node ID type of the Vote Session object.
          voteSessionId: string,
          // A The instructions of the VoteSpecification. in a given language.
          instructions: ?string,
          // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
          titleEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
          instructionsEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A flag specifying if the module has been customized for a specific Proposal.
          isCustom: boolean,
          // The minimum value on the Gauge.
          minimum: ?number,
          // The maximum value on the Gauge.
          maximum: ?number,
          // The number of intervals between the minimum and maximum values.
          nbTicks: ?number,
          // The unit used on the Gauge. This could be anything desired, like:
          //
          // USD ($) or Euros (€)
          //
          // Months
          //
          // PPM (Parts per million)
          //
          // etc
          unit: ?string,
          // The Relay.Node ID type of the Vote Specification template object. A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications.
          voteSpecTemplateId: ?string,
          // The type of the VoteSpecification.
          voteType: ?string
        }
    )>
  |}
|};

export type AcceptedCookiesQueryVariables = {|
  id: string
|};

export type AcceptedCookiesQuery = {|
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
    | {}
    | {}
    | {
        // The list of cookies accepted by the agent.
        acceptedCookies: ?Array<?CookieTypes>,
        // The ID of the object.
        id: string
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
  )
|};

export type addGaugeVoteMutationVariables = {|
  proposalId: string,
  voteSpecId: string,
  voteValue?: ?number
|};

export type addGaugeVoteMutation = {|
  // A mutation to add a Gauge Vote.
  addGaugeVote: ?{|
    voteSpecification: ?(
      | {}
      | {
          // The ID of the object.
          id: string,
          // The list of Votes by a specific User.
          myVotes: Array<?(
            | {}
            | {
                // The value entered on the GaugeVote.
                selectedValue: number,
                proposalId: string
              }
          )>
        }
      | {
          // The ID of the object.
          id: string,
          // The list of Votes by a specific User.
          myVotes: Array<?(
            | {}
            | {
                // The value entered on the GaugeVote.
                selectedValue: number,
                proposalId: string
              }
          )>
        }
    )
  |}
|};

export type addPostExtractMutationVariables = {|
  lang: string,
  postId: string,
  body: string,
  important?: ?boolean,
  xpathStart: string,
  xpathEnd: string,
  offsetStart: number,
  offsetEnd: number,
  tags?: ?Array<?string>
|};

export type addPostExtractMutation = {|
  // A mutation to harvest an Extract from a Post.
  addPostExtract: ?{|
    extract: ?{|
      // The ID of the object.
      id: string,
      // The date the Extract was created, in UTC timezone.
      creationDate: ?any,
      // A flag for importance of the Extract.
      important: ?boolean,
      // The body of text that is extracted from the post. This is not language dependent, but rather just unicode text.
      body: string,
      // The lang of the extract.
      lang: ?string,
      // The taxonomy (or classification) of the extracted body. The options are one of:
      //
      //
      // issue: The body of text is an issue.
      //
      // actionable_solution: The body of text is a potentially actionable solution.
      //
      // knowledge: The body of text is in fact knowledge gained by the community.
      //
      // example: The body of text is an example in the context that it was derived from.
      //
      // concept: The body of text is a high level concept.
      //
      // argument: The body of text is an argument for/against in the context that it was extracted from.
      //
      // cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.
      //
      //
      extractNature: ?string,
      // The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:
      //
      //
      // classify: This body of text should be re-classified by an priviledged user.
      //
      // make_generic: The body of text is a specific example and not generic.
      //
      // argument: A user must give more arguments.
      //
      // give_examples: A user must give more examples.
      //
      // more_specific: A user must be more specific within the same context.
      //
      // mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.
      //
      // display_multi_column: A priviledged user should activate the Mutli-Column view.
      //
      // display_thread: A priviledged user should activate the Thread view.
      //
      // display_tokens: A priviledged user should activate the Token Vote view.
      //
      // display_open_questions: A priviledged user should activate the Open Question view.
      //
      // display_bright_mirror: A priviledged user should activate the Bright Mirror view.
      //
      //
      extractAction: ?string,
      // A graphene Field containing the state of the extract. The options are:
      // SUBMITTED,
      //
      // PUBLISHED
      //
      extractState: ?ExtractStates,
      // A list of TextFragmentIdentifiers.
      textFragmentIdentifiers: ?Array<?{|
        // The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned.
        xpathStart: ?string,
        // The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
        // Often times the xpathEnd variable is the same as the xpathStart selector.
        xpathEnd: ?string,
        // The character offset index where an extract begins, beginning from index 0 in a string of text.
        offsetStart: ?number,
        // The character offset index where an extract ends in a string of text.
        offsetEnd: ?number
      |}>,
      // The AgentProfile object description of the creator.
      creator: ?{|
        // The ID of the object.
        id: string,
        // The unique database identifier of the User.
        userId: number,
        // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
        displayName: ?string,
        // A boolean flag that shows if the User is deleted.
        // If True, the User information is cleansed from the system, and the User can no longer log in.
        isDeleted: ?boolean,
        // A boolean flag describing if the User is a machine user or human user.
        isMachine: ?boolean,
        // The preferences of the User.
        preferences: ?{|
          // The harvesting Translation preference.
          harvestingTranslation: ?{|
            // The source locale of the translation.
            localeFrom: string,
            // The target locale of the translation.
            localeInto: string
          |}
        |}
      |},
      // The list of tags of the extract.
      tags: ?Array<?{|
        // The ID of the object.
        id: string,
        // The value of the tag. This is not language dependent, but rather just unicode text.
        value: string
      |}>
    |}
  |}
|};

export type addSentimentMutationVariables = {|
  type: SentimentTypes,
  postId: string
|};

export type addSentimentMutation = {|
  // A mutation that allows for Sentiments to be added to a Post by the API-calling User.
  addSentiment: ?{|
    post: ?{|
      // The ID of the object.
      id: string,
      // A list of SentimentCounts which counts each sentiment expressed. These include:
      //
      // Like,
      //
      // Agree,
      //
      // Disagree,
      //
      // Like,
      //
      // Don't Understand
      //
      // More Info
      //
      sentimentCounts: ?{|
        // The number of Sentiments expressed "like" on the post.
        like: ?number,
        // The number of Sentiments disagreeing with the post.
        disagree: ?number,
        // The number of Sentiments expressing "dont_understand" on the Post.
        dontUnderstand: ?number,
        // The number of Sentiments requesting "more_info" on the post.
        moreInfo: ?number
      |},
      // The SentimentType that the API calling User has on the Post, if any.
      mySentiment: ?SentimentTypes
    |}
  |}
|};

export type addTagMutationVariables = {|
  taggableId: string,
  value: string,
  contentLocale: string
|};

export type addTagMutation = {|
  // A mutation to add a Tag to a Post.
  addTag: ?{|
    tag: ?{|
      // The ID of the object.
      id: string,
      // The value of the tag. This is not language dependent, but rather just unicode text.
      value: string
    |},
    post: ?{|
      // The ID of the object.
      id: string,
      // The internal database ID of the post.
      // This should never be used in logical computations, however, it exists to give the exact database id for use in sorting or creating classifiers for Posts.
      dbId: ?number,
      // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
      subjectEntries: ?Array<?{|
        // The unicode encoded string representation of the content.
        value: ?string,
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
      bodyEntries: ?Array<?{|
        // The unicode encoded string representation of the content.
        value: ?string,
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string
      |}>,
      // A list of SentimentCounts which counts each sentiment expressed. These include:
      //
      // Like,
      //
      // Agree,
      //
      // Disagree,
      //
      // Like,
      //
      // Don't Understand
      //
      // More Info
      //
      sentimentCounts: ?{|
        // The number of Sentiments disagreeing with the post.
        disagree: ?number,
        // The number of Sentiments expressing "dont_understand" on the Post.
        dontUnderstand: ?number,
        // The number of Sentiments expressed "like" on the post.
        like: ?number,
        // The number of Sentiments requesting "more_info" on the post.
        moreInfo: ?number
      |},
      // The SentimentType that the API calling User has on the Post, if any.
      mySentiment: ?SentimentTypes,
      // A list of IdeaContentLinks, which describe all of the connections the Post has with various Ideas.
      indirectIdeaContentLinks: ?Array<?{|
        // The Idea object associated with an IdeaContentLink.
        idea: ?{|
          // The ID of the object.
          id: string,
          // The title of the Idea, often shown in the Idea header itself.
          title: ?string,
          // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
          messageViewOverride: ?string
        |}
      |}>,
      creator: ?{|
        // The ID of the object.
        id: string,
        // The unique database identifier of the User.
        userId: number,
        // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
        displayName: ?string,
        // A boolean flag that shows if the User is deleted.
        // If True, the User information is cleansed from the system, and the User can no longer log in.
        isDeleted: ?boolean,
        // A boolean flag describing if the User is a machine user or human user.
        isMachine: ?boolean,
        // The preferences of the User.
        preferences: ?{|
          // The harvesting Translation preference.
          harvestingTranslation: ?{|
            // The source locale of the translation.
            localeFrom: string,
            // The target locale of the translation.
            localeInto: string
          |}
        |}
      |},
      // The User or AgentProfile who created the parent post.
      parentPostCreator: ?{|
        // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
        displayName: ?string
      |},
      // A boolean flag to say whether the post is modified or not.
      modified: ?boolean,
      // A ??? in a given language.
      bodyMimeType: string,
      // A graphene Field containing the state of the publication of a certain post. The options are:
      // DRAFT,
      //
      // SUBMITTED_IN_EDIT_GRACE_PERIOD,
      //
      // SUBMITTED_AWAITING_MODERATION,
      //
      // PUBLISHED,
      //
      // MODERATED_TEXT_ON_DEMAND,
      //
      // MODERATED_TEXT_NEVER_AVAILABLE,
      //
      // DELETED_BY_USER,
      //
      // DELETED_BY_ADMIN,
      //
      // WIDGET_SCOPED
      //
      publicationState: ?PublicationStates,
      // A list of IdeaContentLinks that are in fact Extracts on the Post. Extracts are valuable entities taken from
      extracts: ?Array<?{|
        // The ID of the object.
        id: string,
        // The date the Extract was created, in UTC timezone.
        creationDate: ?any,
        // A flag for importance of the Extract.
        important: ?boolean,
        // The body of text that is extracted from the post. This is not language dependent, but rather just unicode text.
        body: string,
        // The lang of the extract.
        lang: ?string,
        // The taxonomy (or classification) of the extracted body. The options are one of:
        //
        //
        // issue: The body of text is an issue.
        //
        // actionable_solution: The body of text is a potentially actionable solution.
        //
        // knowledge: The body of text is in fact knowledge gained by the community.
        //
        // example: The body of text is an example in the context that it was derived from.
        //
        // concept: The body of text is a high level concept.
        //
        // argument: The body of text is an argument for/against in the context that it was extracted from.
        //
        // cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.
        //
        //
        extractNature: ?string,
        // The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:
        //
        //
        // classify: This body of text should be re-classified by an priviledged user.
        //
        // make_generic: The body of text is a specific example and not generic.
        //
        // argument: A user must give more arguments.
        //
        // give_examples: A user must give more examples.
        //
        // more_specific: A user must be more specific within the same context.
        //
        // mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.
        //
        // display_multi_column: A priviledged user should activate the Mutli-Column view.
        //
        // display_thread: A priviledged user should activate the Thread view.
        //
        // display_tokens: A priviledged user should activate the Token Vote view.
        //
        // display_open_questions: A priviledged user should activate the Open Question view.
        //
        // display_bright_mirror: A priviledged user should activate the Bright Mirror view.
        //
        //
        extractAction: ?string,
        // A graphene Field containing the state of the extract. The options are:
        // SUBMITTED,
        //
        // PUBLISHED
        //
        extractState: ?ExtractStates,
        // A list of TextFragmentIdentifiers.
        textFragmentIdentifiers: ?Array<?{|
          // The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned.
          xpathStart: ?string,
          // The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
          // Often times the xpathEnd variable is the same as the xpathStart selector.
          xpathEnd: ?string,
          // The character offset index where an extract begins, beginning from index 0 in a string of text.
          offsetStart: ?number,
          // The character offset index where an extract ends in a string of text.
          offsetEnd: ?number
        |}>,
        // The AgentProfile object description of the creator.
        creator: ?{|
          // The ID of the object.
          id: string,
          // The unique database identifier of the User.
          userId: number,
          // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
          displayName: ?string,
          // A boolean flag that shows if the User is deleted.
          // If True, the User information is cleansed from the system, and the User can no longer log in.
          isDeleted: ?boolean,
          // A boolean flag describing if the User is a machine user or human user.
          isMachine: ?boolean,
          // The preferences of the User.
          preferences: ?{|
            // The harvesting Translation preference.
            harvestingTranslation: ?{|
              // The source locale of the translation.
              localeFrom: string,
              // The target locale of the translation.
              localeInto: string
            |}
          |}
        |},
        // The list of tags of the extract.
        tags: ?Array<?{|
          // The ID of the object.
          id: string,
          // The value of the tag. This is not language dependent, but rather just unicode text.
          value: string
        |}>
      |}>,
      // List of attachements to the post.
      attachments: ?Array<?{|
        // The ID of the object.
        id: string,
        // Any file that can be attached. A file metadata object, described by the Document object.
        document: ?{|
          // The ID of the object.
          id: string,
          // The filename title.
          title: ?string,
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string
        |}
      |}>,
      // Keywords associated with the post, according to NLP engine.
      keywords: ?Array<?{|
        // The score associated with the tag (0-1, increasing relevance)
        score: ?number,
        // The number of times the tag was found
        count: ?number,
        // The tag keyword
        value: ?string
      |}>,
      // A list of abstract tags associated to the post.
      tags: ?Array<?{|
        // The ID of the object.
        id: string,
        // The value of the tag. This is not language dependent, but rather just unicode text.
        value: string
      |}>
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
  // A mutation to add a Token Vote.
  addTokenVote: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      // The list of Votes by a specific User.
      myVotes: Array<?(
        | {
            // The number of Tokens used on a certain Vote.
            voteValue: number,
            proposalId: string,
            tokenCategoryId: string
          }
        | {}
      )>
    |}
  |}
|};

export type confirmExtractMutationVariables = {|
  extractId: string
|};

export type confirmExtractMutation = {|
  confirmExtract: ?{|
    // A Boolean of whether the extract was successfully confirmed or not.
    success: ?boolean
  |}
|};

export type createDiscussionPhaseMutationVariables = {|
  lang: string,
  identifier?: ?string,
  titleEntries: Array<?LangStringEntryInput>,
  descriptionEntries?: ?Array<?LangStringEntryInput>,
  start: any,
  end: any,
  image?: ?string,
  order: number
|};

export type createDiscussionPhaseMutation = {|
  // A mutation that enables the creation of a DiscussionPhase.
  createDiscussionPhase: ?{|
    discussionPhase: ?{|
      // The ID of the object.
      id: string,
      // Identifier of the Phase. Possible phase identifiers: "survey", "thread", "multiColumns", "voteSession", "brightMirror".
      identifier: ?string,
      // A title of the Phase. in a given language.
      title: ?string,
      // A list of possible languages of the entity as LangStringEntry objects. These are the title of the phase in various languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A description of the Phase. in a given language.
      description: ?string,
      // A list of possible languages of the entity as LangStringEntry objects. These are the description of the phase in various languages.
      descriptionEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // An ISO 8601, UTC timezoned time representing the starting date of the phase.
      start: ?any,
      // An ISO 8601, UTC timezoned time representing the ending date of the phase.
      end: ?any,
      // A Order of the phase in the Timeline. as a float
      order: ?number,
      // The image displayed on the phase.A file metadata object, described by the Document object.
      image: ?{|
        // The MIME-Type of the file uploaded.
        mimeType: ?string,
        // The filename title.
        title: ?string,
        // A url to an image or a document to be attached.
        externalUrl: ?string
      |}
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
  // A mutation enabling the creation of a GaugeVoteSpecification.
  createGaugeVoteSpecification: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      // The Relay.Node ID type of the Vote Session object.
      voteSessionId: string,
      // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
      instructionsEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A flag specifying if the module has been customized for a specific Proposal.
      isCustom: boolean,
      // The list of GaugeChoiceSpecifications available on a Gauge. These describe all of the options available in the GaugeVote.
      choices: ?Array<?{|
        // The ID of the object.
        id: string,
        value: number,
        // A list of possible languages of the entity as LangStringEntry objects. The label of the Gauge in various languages.
        labelEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>
      |}>,
      // The Relay.Node ID type of the Vote Specification template object. A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications.
      voteSpecTemplateId: ?string
    |}
  |}
|};

export type createLandingPageModuleMutationVariables = {|
  typeIdentifier: string,
  enabled?: ?boolean,
  order?: ?number,
  configuration?: ?string,
  titleEntries?: ?Array<LangStringEntryInput>,
  subtitleEntries?: ?Array<LangStringEntryInput>
|};

export type createLandingPageModuleMutation = {|
  // A mutation that allows for the creation of the LandingPageModule.
  createLandingPageModule: ?{|
    // A LandingPageModules that is associated to the debate.
    landingPageModule: ?{|
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      subtitleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // The JSON-based configuration of the LandingPageModule in the debate.
      configuration: ?string,
      // Whether the Module is activated or not.
      enabled: ?boolean,
      // The LandingPageModuleType describing the Module.
      moduleType: ?{|
        // The unique ID of the module type. These can be one of:
        //
        //
        // HEADER: The header section of the landing page.
        //
        // INTRODUCTION: The introduction section.
        //
        // TIMELINE: The list of timelines present in the debate.
        //
        // FOOTER: The footer in the landing page, including information such as privacy policies, etc..
        //
        // TOP_THEMATICS: The section hosting the top active thematics.
        //
        // TWEETS: The tweets section, displaying top tweets in the landing page.
        //
        // CHATBOT: The chatbot section, according to the configured chatbot.
        //
        // CONTACT: The contacts section.
        //
        // NEWS: The latest news section, as configured.
        //
        // DATA: The data sections.
        //
        // PARTNERS: The partners section, highlighting the contributing partners' logos.
        //
        //
        identifier: string,
        // The title of the section.
        title: ?string
      |},
      // The order of the Module in the entire LandingPage.
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
  // A mutation to create a numerical Gauge.
  createNumberGaugeVoteSpecification: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      // The Relay.Node ID type of the Vote Session object.
      voteSessionId: string,
      // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
      instructionsEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A flag specifying if the module has been customized for a specific Proposal.
      isCustom: boolean,
      // The minimum value on the Gauge.
      minimum: ?number,
      // The maximum value on the Gauge.
      maximum: ?number,
      // The number of intervals between the minimum and maximum values.
      nbTicks: ?number,
      // The unit used on the Gauge. This could be anything desired, like:
      //
      // USD ($) or Euros (€)
      //
      // Months
      //
      // PPM (Parts per million)
      //
      // etc
      unit: ?string,
      // The Relay.Node ID type of the Vote Specification template object. A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications.
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
  attachments?: ?Array<?string>,
  publicationState?: ?PublicationStates,
  extractId?: ?string
|};

export type createPostMutation = {|
  // A mutation which enables the creation of a Post.
  createPost: ?{|
    post: ?{|
      // The ID of the object.
      id: string,
      // The internal database ID of the post.
      // This should never be used in logical computations, however, it exists to give the exact database id for use in sorting or creating classifiers for Posts.
      dbId: ?number,
      // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
      subjectEntries: ?Array<?{|
        // The unicode encoded string representation of the content.
        value: ?string,
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
      bodyEntries: ?Array<?{|
        // The unicode encoded string representation of the content.
        value: ?string,
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string
      |}>,
      // A list of SentimentCounts which counts each sentiment expressed. These include:
      //
      // Like,
      //
      // Agree,
      //
      // Disagree,
      //
      // Like,
      //
      // Don't Understand
      //
      // More Info
      //
      sentimentCounts: ?{|
        // The number of Sentiments disagreeing with the post.
        disagree: ?number,
        // The number of Sentiments expressing "dont_understand" on the Post.
        dontUnderstand: ?number,
        // The number of Sentiments expressed "like" on the post.
        like: ?number,
        // The number of Sentiments requesting "more_info" on the post.
        moreInfo: ?number
      |},
      // The SentimentType that the API calling User has on the Post, if any.
      mySentiment: ?SentimentTypes,
      // A list of IdeaContentLinks, which describe all of the connections the Post has with various Ideas.
      indirectIdeaContentLinks: ?Array<?{|
        // The Idea object associated with an IdeaContentLink.
        idea: ?{|
          // The ID of the object.
          id: string,
          // The title of the Idea, often shown in the Idea header itself.
          title: ?string,
          // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
          messageViewOverride: ?string
        |}
      |}>,
      creator: ?{|
        // The ID of the object.
        id: string,
        // The unique database identifier of the User.
        userId: number,
        // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
        displayName: ?string,
        // A boolean flag that shows if the User is deleted.
        // If True, the User information is cleansed from the system, and the User can no longer log in.
        isDeleted: ?boolean,
        // A boolean flag describing if the User is a machine user or human user.
        isMachine: ?boolean,
        // The preferences of the User.
        preferences: ?{|
          // The harvesting Translation preference.
          harvestingTranslation: ?{|
            // The source locale of the translation.
            localeFrom: string,
            // The target locale of the translation.
            localeInto: string
          |}
        |}
      |},
      // The User or AgentProfile who created the parent post.
      parentPostCreator: ?{|
        // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
        displayName: ?string
      |},
      // A boolean flag to say whether the post is modified or not.
      modified: ?boolean,
      // A ??? in a given language.
      bodyMimeType: string,
      // A graphene Field containing the state of the publication of a certain post. The options are:
      // DRAFT,
      //
      // SUBMITTED_IN_EDIT_GRACE_PERIOD,
      //
      // SUBMITTED_AWAITING_MODERATION,
      //
      // PUBLISHED,
      //
      // MODERATED_TEXT_ON_DEMAND,
      //
      // MODERATED_TEXT_NEVER_AVAILABLE,
      //
      // DELETED_BY_USER,
      //
      // DELETED_BY_ADMIN,
      //
      // WIDGET_SCOPED
      //
      publicationState: ?PublicationStates,
      // A list of IdeaContentLinks that are in fact Extracts on the Post. Extracts are valuable entities taken from
      extracts: ?Array<?{|
        // The ID of the object.
        id: string,
        // The date the Extract was created, in UTC timezone.
        creationDate: ?any,
        // A flag for importance of the Extract.
        important: ?boolean,
        // The body of text that is extracted from the post. This is not language dependent, but rather just unicode text.
        body: string,
        // The lang of the extract.
        lang: ?string,
        // The taxonomy (or classification) of the extracted body. The options are one of:
        //
        //
        // issue: The body of text is an issue.
        //
        // actionable_solution: The body of text is a potentially actionable solution.
        //
        // knowledge: The body of text is in fact knowledge gained by the community.
        //
        // example: The body of text is an example in the context that it was derived from.
        //
        // concept: The body of text is a high level concept.
        //
        // argument: The body of text is an argument for/against in the context that it was extracted from.
        //
        // cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.
        //
        //
        extractNature: ?string,
        // The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:
        //
        //
        // classify: This body of text should be re-classified by an priviledged user.
        //
        // make_generic: The body of text is a specific example and not generic.
        //
        // argument: A user must give more arguments.
        //
        // give_examples: A user must give more examples.
        //
        // more_specific: A user must be more specific within the same context.
        //
        // mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.
        //
        // display_multi_column: A priviledged user should activate the Mutli-Column view.
        //
        // display_thread: A priviledged user should activate the Thread view.
        //
        // display_tokens: A priviledged user should activate the Token Vote view.
        //
        // display_open_questions: A priviledged user should activate the Open Question view.
        //
        // display_bright_mirror: A priviledged user should activate the Bright Mirror view.
        //
        //
        extractAction: ?string,
        // A graphene Field containing the state of the extract. The options are:
        // SUBMITTED,
        //
        // PUBLISHED
        //
        extractState: ?ExtractStates,
        // A list of TextFragmentIdentifiers.
        textFragmentIdentifiers: ?Array<?{|
          // The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned.
          xpathStart: ?string,
          // The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
          // Often times the xpathEnd variable is the same as the xpathStart selector.
          xpathEnd: ?string,
          // The character offset index where an extract begins, beginning from index 0 in a string of text.
          offsetStart: ?number,
          // The character offset index where an extract ends in a string of text.
          offsetEnd: ?number
        |}>,
        // The AgentProfile object description of the creator.
        creator: ?{|
          // The ID of the object.
          id: string,
          // The unique database identifier of the User.
          userId: number,
          // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
          displayName: ?string,
          // A boolean flag that shows if the User is deleted.
          // If True, the User information is cleansed from the system, and the User can no longer log in.
          isDeleted: ?boolean,
          // A boolean flag describing if the User is a machine user or human user.
          isMachine: ?boolean,
          // The preferences of the User.
          preferences: ?{|
            // The harvesting Translation preference.
            harvestingTranslation: ?{|
              // The source locale of the translation.
              localeFrom: string,
              // The target locale of the translation.
              localeInto: string
            |}
          |}
        |},
        // The list of tags of the extract.
        tags: ?Array<?{|
          // The ID of the object.
          id: string,
          // The value of the tag. This is not language dependent, but rather just unicode text.
          value: string
        |}>
      |}>,
      // List of attachements to the post.
      attachments: ?Array<?{|
        // The ID of the object.
        id: string,
        // Any file that can be attached. A file metadata object, described by the Document object.
        document: ?{|
          // The ID of the object.
          id: string,
          // The filename title.
          title: ?string,
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string
        |}
      |}>,
      // Keywords associated with the post, according to NLP engine.
      keywords: ?Array<?{|
        // The score associated with the tag (0-1, increasing relevance)
        score: ?number,
        // The number of times the tag was found
        count: ?number,
        // The tag keyword
        value: ?string
      |}>,
      // A list of abstract tags associated to the post.
      tags: ?Array<?{|
        // The ID of the object.
        id: string,
        // The value of the tag. This is not language dependent, but rather just unicode text.
        value: string
      |}>,
      // The parent of a Post, if the Post is a reply to an existing Post. The Relay.Node ID type of the Post object.
      parentId: ?string,
      // The date that the object was created, in UTC timezone, in ISO 8601 format.
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
  // A mutation that enables the creation of a Proposal.
  createProposal: ?{|
    proposal: ?{|
      // The ID of the object.
      id: string,
      // The order of the Idea, Thematic, Question in the idea tree.
      order: ?number,
      // A list of possible languages of the entity as LangStringEntry objects. This is the Idea title in multiple languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. This is the description of the Idea in multiple languages.
      descriptionEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>
    |}
  |}
|};

export type createResourceMutationVariables = {|
  doc?: ?string,
  image?: ?string,
  lang: string,
  titleEntries: Array<?LangStringEntryInput>,
  textEntries: Array<?LangStringEntryInput>,
  embedCode?: ?string,
  order?: ?number
|};

export type createResourceMutation = {|
  // A mutation that enables a Resource to be created.
  createResource: ?{|
    resource: ?{|
      // A file attached to the ResourceA file metadata object, described by the Document object.
      doc: ?{|
        // A url to an image or a document to be attached.
        externalUrl: ?string,
        // The MIME-Type of the file uploaded.
        mimeType: ?string,
        // The filename title.
        title: ?string
      |},
      // The URL for any i-frame based content that matches the Content-Security-Policy of the server.
      // In effect, this is the "src" code inside of an iframe-based attachment to a Resource.
      embedCode: ?string,
      // The ID of the object.
      id: string,
      // An image attached to the ResourceA file metadata object, described by the Document object.
      image: ?{|
        // A url to an image or a document to be attached.
        externalUrl: ?string,
        // The MIME-Type of the file uploaded.
        mimeType: ?string,
        // The filename title.
        title: ?string
      |},
      text: ?string,
      title: ?string,
      // A list of possible languages of the entity as LangStringEntry objects. The title of the Resource in various languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The title of the Resource in various languages.
      textEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // The order of the Resource on the Resources Center page.A file metadata object, described by the Document object.
      order: ?number
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
  // A mutation that allows for the creation of new Sections
  createSection: ?{|
    section: ?{|
      // The ID of the object.
      id: string,
      // There are 5 section types:
      //
      // HOMEPAGE
      //
      // DEBATE
      //
      // SYNTHESES
      //
      // RESOURCES_CENTER
      //
      // CUSTOM
      //
      // ADMINISTRATION
      sectionType: string,
      // An optional field. Should the tab redirect to a location outside of the platform, the URL is the location to redirect towards.
      url: ?string,
      // A The title of the Section. in a given language.
      title: ?string,
      // The order of the Sections on the top of the page.
      order: number
    |}
  |}
|};

export type createSynthesisMutationVariables = {|
  image?: ?string,
  bodyEntries: Array<?LangStringEntryInput>,
  subjectEntries: Array<?LangStringEntryInput>,
  synthesisType: SynthesisTypes,
  publicationState: PublicationStates
|};

export type createSynthesisMutation = {|
  // A mutation that enables a Synthesis to be created.
  createSynthesis: ?{|
    synthesisPost: ?{|
      // The ID of the object.
      id: string,
      // A graphene Field containing the state of the publication of a certain post. The options are:
      // DRAFT,
      //
      // SUBMITTED_IN_EDIT_GRACE_PERIOD,
      //
      // SUBMITTED_AWAITING_MODERATION,
      //
      // PUBLISHED,
      //
      // MODERATED_TEXT_ON_DEMAND,
      //
      // MODERATED_TEXT_NEVER_AVAILABLE,
      //
      // DELETED_BY_USER,
      //
      // DELETED_BY_ADMIN,
      //
      // WIDGET_SCOPED
      //
      publicationState: ?PublicationStates,
      // Graphene Field modeling a relationship to a published synthesis.
      publishesSynthesis: ?{|
        // The ID of the object.
        id: string,
        // The type of Synthesis to be created
        synthesisType: SynthesisTypes,
        // A list of possible languages of the entity as LangStringEntry objects. The subject in various languages.
        subjectEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>,
        // A list of possible languages of the entity as LangStringEntry objects. The body in various languages.
        bodyEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>,
        // This is a header image document object that will be visible on the Synthesis view's header.A file metadata object, described by the Document object.
        img: ?{|
          // The ID of the object.
          id: string,
          // The filename title.
          title: ?string,
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string
        |}
      |}
    |}
  |}
|};

export type createTextFieldMutationVariables = {|
  lang?: ?string,
  titleEntries: Array<?LangStringEntryInput>,
  order: number,
  required: boolean,
  hidden: boolean,
  options?: ?Array<?SelectFieldOptionInput>
|};

export type createTextFieldMutation = {|
  // A mutation that allows for the creation of a TextField.
  createTextField: ?{|
    field: ?(
      | {
          // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
          titleEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A Text Field Label in a given language.
          title: ?string,
          // The position (order) of the Field compared to other Fields.
          order: ?number,
          // A flag indicating if the Field requires an input or not.
          required: ?boolean,
          // A flag indicating if the Field is hidden for the user or not.
          hidden: boolean,
          // The ID of the object.
          id: string
        }
      | {
          // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
          titleEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A Text Field Label in a given language.
          title: ?string,
          // The position (order) of the Field compared to other Fields.
          order: ?number,
          // A flag indicating if the Field requires an input or not.
          required: ?boolean,
          // A flag indicating if the Field is hidden for the user or not.
          hidden: boolean,
          // The ID of the object.
          id: string,
          options: ?Array<?{|
            // The ID of the object.
            id: string,
            // The position (order) of the field.
            order: number,
            // A Text Field Label in a given language.
            label: ?string,
            // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
            labelEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>
          |}>
        }
    )
  |}
|};

export type createThematicMutationVariables = {|
  discussionPhaseId: number,
  image?: ?string,
  titleEntries: Array<?LangStringEntryInput>,
  descriptionEntries?: ?Array<?LangStringEntryInput>,
  questions?: ?Array<?QuestionInput>,
  announcement?: ?IdeaAnnouncementInput,
  order?: ?number,
  messageViewOverride?: ?string
|};

export type createThematicMutation = {|
  // A mutation to create a new thematic.
  createThematic: ?{|
    thematic: ?{
      // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
      messageViewOverride: ?string,
      // The order of the Idea, Thematic, Question in the idea tree.
      order: ?number,
      // The title of the Idea, often shown in the Idea header itself.
      title: ?string,
      // The description of the Idea, often shown in the header of the Idea.
      description: ?string,
      // An Announcement object representing a summary of an Idea. This is often included in a header display of an Idea.
      announcement: ?{|
        // A title of announcement in a given language.
        title: ?string,
        // A body of announcement in a given language.
        body: ?string,
        // A summary of announcement in a given language.
        summary: ?string
      |},
      // Header image associated with the idea. A file metadata object, described by the Document object.
      img: ?{|
        // A url to an image or a document to be attached.
        externalUrl: ?string,
        // The MIME-Type of the file uploaded.
        mimeType: ?string
      |},
      // A list of Question objects that are bound to the Thematic.
      questions: ?Array<?{|
        // The ID of the object.
        id: string,
        // The Question to be asked itself, in the language given.
        title: ?string
      |}>,
      // The ID of the object.
      id: string
    }
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
  // A mutation enabling the creation of a TokenVoteSpecification.
  createTokenVoteSpecification: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      // The Relay.Node ID type of the Vote Session object.
      voteSessionId: string,
      // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
      instructionsEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A flag specifying if the module has been customized for a specific Proposal.
      isCustom: boolean,
      exclusiveCategories: ?boolean,
      // The list of Token category specification(TokenCategorySpecification).
      tokenCategories: Array<?{|
        // The ID of the object.
        id: string,
        totalNumber: number,
        // A list of possible languages of the entity as LangStringEntry objects. The title of the Token Category in various languages.
        titleEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>,
        color: ?string
      |}>,
      // The Relay.Node ID type of the Vote Specification template object. A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications.
      voteSpecTemplateId: ?string
    |}
  |}
|};

export type deleteDiscussionPhaseMutationVariables = {|
  id: string
|};

export type deleteDiscussionPhaseMutation = {|
  // A mutation that enabled the removal of an existing DiscussionPhase.
  deleteDiscussionPhase: ?{|
    success: ?boolean
  |}
|};

export type deleteExtractMutationVariables = {|
  extractId: string
|};

export type deleteExtractMutation = {|
  deleteExtract: ?{|
    // A Boolean of whether the extract was successfully saved or not.
    success: ?boolean
  |}
|};

export type deletePostMutationVariables = {|
  postId: string
|};

export type deletePostMutation = {|
  // A mutation to delete a Post.
  deletePost: ?{|
    post: ?{|
      // The ID of the object.
      id: string,
      // A graphene Field containing the state of the publication of a certain post. The options are:
      // DRAFT,
      //
      // SUBMITTED_IN_EDIT_GRACE_PERIOD,
      //
      // SUBMITTED_AWAITING_MODERATION,
      //
      // PUBLISHED,
      //
      // MODERATED_TEXT_ON_DEMAND,
      //
      // MODERATED_TEXT_NEVER_AVAILABLE,
      //
      // DELETED_BY_USER,
      //
      // DELETED_BY_ADMIN,
      //
      // WIDGET_SCOPED
      //
      publicationState: ?PublicationStates
    |}
  |}
|};

export type deleteProposalMutationVariables = {|
  id: string
|};

export type deleteProposalMutation = {|
  // A mutation that enables the deletion of an existing Proposal.
  deleteProposal: ?{|
    success: ?boolean
  |}
|};

export type deleteResourceMutationVariables = {|
  resourceId: string
|};

export type deleteResourceMutation = {|
  // A mutation that enables the deletion of a Resource. Once a resource is deleted, it cannot be resurected.
  deleteResource: ?{|
    success: ?boolean
  |}
|};

export type deleteSectionMutationVariables = {|
  sectionId: string
|};

export type deleteSectionMutation = {|
  // A mutation that allows an existing Section to be deleted.
  deleteSection: ?{|
    success: ?boolean
  |}
|};

export type deleteSentimentMutationVariables = {|
  postId: string
|};

export type deleteSentimentMutation = {|
  // A mutation to delete the Sentiment by the API-calling User on a particular Post.
  deleteSentiment: ?{|
    post: ?{|
      // The ID of the object.
      id: string,
      // A list of SentimentCounts which counts each sentiment expressed. These include:
      //
      // Like,
      //
      // Agree,
      //
      // Disagree,
      //
      // Like,
      //
      // Don't Understand
      //
      // More Info
      //
      sentimentCounts: ?{|
        // The number of Sentiments expressed "like" on the post.
        like: ?number,
        // The number of Sentiments disagreeing with the post.
        disagree: ?number,
        // The number of Sentiments expressing "dont_understand" on the Post.
        dontUnderstand: ?number,
        // The number of Sentiments requesting "more_info" on the post.
        moreInfo: ?number
      |},
      // The SentimentType that the API calling User has on the Post, if any.
      mySentiment: ?SentimentTypes
    |}
  |}
|};

export type deleteSynthesisMutationVariables = {|
  id: string
|};

export type deleteSynthesisMutation = {|
  // A mutation that enables the deletion of a Synthesis.
  deleteSynthesis: ?{|
    success: ?boolean
  |}
|};

export type deleteTextFieldMutationVariables = {|
  id: string
|};

export type deleteTextFieldMutation = {|
  // A mutation that enables the removal of an existing TextField.
  deleteTextField: ?{|
    success: ?boolean
  |}
|};

export type deleteThematicMutationVariables = {|
  thematicId: string
|};

export type deleteThematicMutation = {|
  // A mutation to delete a thematic.
  deleteThematic: ?{|
    success: ?boolean
  |}
|};

export type DeleteUserInformationMutationVariables = {|
  id: string
|};

export type DeleteUserInformationMutation = {|
  // A mutation allowing a user to delete all his information according to article 17 of GDPR.
  // All vital information regarding the User acrosst the database is cleansed.
  deleteUserInformation: ?{|
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
  // A mutation enabling an existing VoteSpecification to be deleted.
  deleteVoteSpecification: ?{|
    success: ?boolean
  |}
|};

export type removeTagMutationVariables = {|
  taggableId: string,
  id: string,
  contentLocale: string
|};

export type removeTagMutation = {|
  // A mutation to create a Tag association to a Post.
  removeTag: ?{|
    success: ?boolean,
    post: ?{|
      // The ID of the object.
      id: string,
      // The internal database ID of the post.
      // This should never be used in logical computations, however, it exists to give the exact database id for use in sorting or creating classifiers for Posts.
      dbId: ?number,
      // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
      subjectEntries: ?Array<?{|
        // The unicode encoded string representation of the content.
        value: ?string,
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
      bodyEntries: ?Array<?{|
        // The unicode encoded string representation of the content.
        value: ?string,
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string
      |}>,
      // A list of SentimentCounts which counts each sentiment expressed. These include:
      //
      // Like,
      //
      // Agree,
      //
      // Disagree,
      //
      // Like,
      //
      // Don't Understand
      //
      // More Info
      //
      sentimentCounts: ?{|
        // The number of Sentiments disagreeing with the post.
        disagree: ?number,
        // The number of Sentiments expressing "dont_understand" on the Post.
        dontUnderstand: ?number,
        // The number of Sentiments expressed "like" on the post.
        like: ?number,
        // The number of Sentiments requesting "more_info" on the post.
        moreInfo: ?number
      |},
      // The SentimentType that the API calling User has on the Post, if any.
      mySentiment: ?SentimentTypes,
      // A list of IdeaContentLinks, which describe all of the connections the Post has with various Ideas.
      indirectIdeaContentLinks: ?Array<?{|
        // The Idea object associated with an IdeaContentLink.
        idea: ?{|
          // The ID of the object.
          id: string,
          // The title of the Idea, often shown in the Idea header itself.
          title: ?string,
          // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
          messageViewOverride: ?string
        |}
      |}>,
      creator: ?{|
        // The ID of the object.
        id: string,
        // The unique database identifier of the User.
        userId: number,
        // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
        displayName: ?string,
        // A boolean flag that shows if the User is deleted.
        // If True, the User information is cleansed from the system, and the User can no longer log in.
        isDeleted: ?boolean,
        // A boolean flag describing if the User is a machine user or human user.
        isMachine: ?boolean,
        // The preferences of the User.
        preferences: ?{|
          // The harvesting Translation preference.
          harvestingTranslation: ?{|
            // The source locale of the translation.
            localeFrom: string,
            // The target locale of the translation.
            localeInto: string
          |}
        |}
      |},
      // The User or AgentProfile who created the parent post.
      parentPostCreator: ?{|
        // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
        displayName: ?string
      |},
      // A boolean flag to say whether the post is modified or not.
      modified: ?boolean,
      // A ??? in a given language.
      bodyMimeType: string,
      // A graphene Field containing the state of the publication of a certain post. The options are:
      // DRAFT,
      //
      // SUBMITTED_IN_EDIT_GRACE_PERIOD,
      //
      // SUBMITTED_AWAITING_MODERATION,
      //
      // PUBLISHED,
      //
      // MODERATED_TEXT_ON_DEMAND,
      //
      // MODERATED_TEXT_NEVER_AVAILABLE,
      //
      // DELETED_BY_USER,
      //
      // DELETED_BY_ADMIN,
      //
      // WIDGET_SCOPED
      //
      publicationState: ?PublicationStates,
      // A list of IdeaContentLinks that are in fact Extracts on the Post. Extracts are valuable entities taken from
      extracts: ?Array<?{|
        // The ID of the object.
        id: string,
        // The date the Extract was created, in UTC timezone.
        creationDate: ?any,
        // A flag for importance of the Extract.
        important: ?boolean,
        // The body of text that is extracted from the post. This is not language dependent, but rather just unicode text.
        body: string,
        // The lang of the extract.
        lang: ?string,
        // The taxonomy (or classification) of the extracted body. The options are one of:
        //
        //
        // issue: The body of text is an issue.
        //
        // actionable_solution: The body of text is a potentially actionable solution.
        //
        // knowledge: The body of text is in fact knowledge gained by the community.
        //
        // example: The body of text is an example in the context that it was derived from.
        //
        // concept: The body of text is a high level concept.
        //
        // argument: The body of text is an argument for/against in the context that it was extracted from.
        //
        // cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.
        //
        //
        extractNature: ?string,
        // The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:
        //
        //
        // classify: This body of text should be re-classified by an priviledged user.
        //
        // make_generic: The body of text is a specific example and not generic.
        //
        // argument: A user must give more arguments.
        //
        // give_examples: A user must give more examples.
        //
        // more_specific: A user must be more specific within the same context.
        //
        // mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.
        //
        // display_multi_column: A priviledged user should activate the Mutli-Column view.
        //
        // display_thread: A priviledged user should activate the Thread view.
        //
        // display_tokens: A priviledged user should activate the Token Vote view.
        //
        // display_open_questions: A priviledged user should activate the Open Question view.
        //
        // display_bright_mirror: A priviledged user should activate the Bright Mirror view.
        //
        //
        extractAction: ?string,
        // A graphene Field containing the state of the extract. The options are:
        // SUBMITTED,
        //
        // PUBLISHED
        //
        extractState: ?ExtractStates,
        // A list of TextFragmentIdentifiers.
        textFragmentIdentifiers: ?Array<?{|
          // The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned.
          xpathStart: ?string,
          // The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
          // Often times the xpathEnd variable is the same as the xpathStart selector.
          xpathEnd: ?string,
          // The character offset index where an extract begins, beginning from index 0 in a string of text.
          offsetStart: ?number,
          // The character offset index where an extract ends in a string of text.
          offsetEnd: ?number
        |}>,
        // The AgentProfile object description of the creator.
        creator: ?{|
          // The ID of the object.
          id: string,
          // The unique database identifier of the User.
          userId: number,
          // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
          displayName: ?string,
          // A boolean flag that shows if the User is deleted.
          // If True, the User information is cleansed from the system, and the User can no longer log in.
          isDeleted: ?boolean,
          // A boolean flag describing if the User is a machine user or human user.
          isMachine: ?boolean,
          // The preferences of the User.
          preferences: ?{|
            // The harvesting Translation preference.
            harvestingTranslation: ?{|
              // The source locale of the translation.
              localeFrom: string,
              // The target locale of the translation.
              localeInto: string
            |}
          |}
        |},
        // The list of tags of the extract.
        tags: ?Array<?{|
          // The ID of the object.
          id: string,
          // The value of the tag. This is not language dependent, but rather just unicode text.
          value: string
        |}>
      |}>,
      // List of attachements to the post.
      attachments: ?Array<?{|
        // The ID of the object.
        id: string,
        // Any file that can be attached. A file metadata object, described by the Document object.
        document: ?{|
          // The ID of the object.
          id: string,
          // The filename title.
          title: ?string,
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string
        |}
      |}>,
      // Keywords associated with the post, according to NLP engine.
      keywords: ?Array<?{|
        // The score associated with the tag (0-1, increasing relevance)
        score: ?number,
        // The number of times the tag was found
        count: ?number,
        // The tag keyword
        value: ?string
      |}>,
      // A list of abstract tags associated to the post.
      tags: ?Array<?{|
        // The ID of the object.
        id: string,
        // The value of the tag. This is not language dependent, but rather just unicode text.
        value: string
      |}>
    |}
  |}
|};

export type updateAcceptedCookiesMutationVariables = {|
  actions: Array<?CookieTypes>
|};

export type updateAcceptedCookiesMutation = {|
  // A mutation that allows the addition of accepted and rejected list of cookies by a registered user.
  updateAcceptedCookies: ?{|
    user: ?{|
      // The list of cookies accepted by the agent.
      acceptedCookies: ?Array<?CookieTypes>
    |}
  |}
|};

export type UpdateDiscussionMutationVariables = {|
  titleEntries?: ?Array<LangStringEntryInput>,
  subtitleEntries?: ?Array<LangStringEntryInput>,
  buttonLabelEntries?: ?Array<LangStringEntryInput>,
  headerImage?: ?string,
  logoImage?: ?string,
  startDate?: ?any,
  endDate?: ?any
|};

export type UpdateDiscussionMutation = {|
  // The mutation that allows to update an existing Discussion object
  updateDiscussion: ?{|
    discussion: ?{|
      // The ID of the object.
      id: string,
      // A list of possible languages of the entity as LangStringEntry objects. %s
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. %s
      subtitleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. %s
      buttonLabelEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // The file representing the header of the landing page. A file metadata object, described by the Document object.
      headerImage: ?{|
        // A url to an image or a document to be attached.
        externalUrl: ?string,
        // The MIME-Type of the file uploaded.
        mimeType: ?string
      |},
      // The file representing the logo of the debate. A file metadata object, described by the Document object.
      logoImage: ?{|
        // A url to an image or a document to be attached.
        externalUrl: ?string,
        // The MIME-Type of the file uploaded.
        mimeType: ?string
      |},
      // The start date of a discussion. A datetime that is either set in mutation, or calculated from the start of the first phase.
      startDate: ?any,
      // The end date of a discussion. A datetime that is either set in a mutation, or calculated from the end of last phase.
      endDate: ?any
    |}
  |}
|};

export type updateDiscussionPhaseMutationVariables = {|
  id: string,
  lang: string,
  identifier: string,
  titleEntries: Array<?LangStringEntryInput>,
  descriptionEntries?: ?Array<?LangStringEntryInput>,
  start: any,
  end: any,
  image?: ?string,
  order: number
|};

export type updateDiscussionPhaseMutation = {|
  // A mutation that enables the creation of a DiscussionPhase.
  updateDiscussionPhase: ?{|
    discussionPhase: ?{|
      // The ID of the object.
      id: string,
      // Identifier of the Phase. Possible phase identifiers: "survey", "thread", "multiColumns", "voteSession", "brightMirror".
      identifier: ?string,
      // A title of the Phase. in a given language.
      title: ?string,
      // A list of possible languages of the entity as LangStringEntry objects. These are the title of the phase in various languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A description of the Phase. in a given language.
      description: ?string,
      // A list of possible languages of the entity as LangStringEntry objects. These are the description of the phase in various languages.
      descriptionEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // An ISO 8601, UTC timezoned time representing the starting date of the phase.
      start: ?any,
      // An ISO 8601, UTC timezoned time representing the ending date of the phase.
      end: ?any,
      // A Order of the phase in the Timeline. as a float
      order: ?number,
      // The image displayed on the phase.A file metadata object, described by the Document object.
      image: ?{|
        // The MIME-Type of the file uploaded.
        mimeType: ?string,
        // The filename title.
        title: ?string,
        // A url to an image or a document to be attached.
        externalUrl: ?string
      |}
    |}
  |}
|};

export type updateDiscussionPreferenceMutationVariables = {|
  languages?: ?Array<?string>,
  withModeration?: ?boolean,
  withTranslation?: ?boolean,
  withSemanticAnalysis?: ?boolean,
  tabTitle?: ?string,
  favicon?: ?string,
  slug?: ?string,
  logo?: ?string
|};

export type updateDiscussionPreferenceMutation = {|
  // A way to save Discussion Preferences on a debate.
  updateDiscussionPreferences: ?{|
    preferences: ?{|
      // A list of LocalePreference metadata objects on the discussion which describe the languages supported by the debate.
      languages: ?Array<?{|
        // The ISO 639-1 language string of the locale. Ex. '"fr"'.
        locale: ?string
      |}>,
      // A Boolean flag indicating whether the moderation is activated or not.
      withModeration: ?boolean,
      // A string used to form the URL of the discussion.
      slug: string
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
  // A mutation to update an existing extract.
  updateExtract: ?{|
    extract: ?{|
      // The ID of the object.
      id: string,
      // The date the Extract was created, in UTC timezone.
      creationDate: ?any,
      // A flag for importance of the Extract.
      important: ?boolean,
      // The body of text that is extracted from the post. This is not language dependent, but rather just unicode text.
      body: string,
      // The lang of the extract.
      lang: ?string,
      // The taxonomy (or classification) of the extracted body. The options are one of:
      //
      //
      // issue: The body of text is an issue.
      //
      // actionable_solution: The body of text is a potentially actionable solution.
      //
      // knowledge: The body of text is in fact knowledge gained by the community.
      //
      // example: The body of text is an example in the context that it was derived from.
      //
      // concept: The body of text is a high level concept.
      //
      // argument: The body of text is an argument for/against in the context that it was extracted from.
      //
      // cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.
      //
      //
      extractNature: ?string,
      // The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:
      //
      //
      // classify: This body of text should be re-classified by an priviledged user.
      //
      // make_generic: The body of text is a specific example and not generic.
      //
      // argument: A user must give more arguments.
      //
      // give_examples: A user must give more examples.
      //
      // more_specific: A user must be more specific within the same context.
      //
      // mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.
      //
      // display_multi_column: A priviledged user should activate the Mutli-Column view.
      //
      // display_thread: A priviledged user should activate the Thread view.
      //
      // display_tokens: A priviledged user should activate the Token Vote view.
      //
      // display_open_questions: A priviledged user should activate the Open Question view.
      //
      // display_bright_mirror: A priviledged user should activate the Bright Mirror view.
      //
      //
      extractAction: ?string,
      // A graphene Field containing the state of the extract. The options are:
      // SUBMITTED,
      //
      // PUBLISHED
      //
      extractState: ?ExtractStates,
      // A list of TextFragmentIdentifiers.
      textFragmentIdentifiers: ?Array<?{|
        // The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned.
        xpathStart: ?string,
        // The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
        // Often times the xpathEnd variable is the same as the xpathStart selector.
        xpathEnd: ?string,
        // The character offset index where an extract begins, beginning from index 0 in a string of text.
        offsetStart: ?number,
        // The character offset index where an extract ends in a string of text.
        offsetEnd: ?number
      |}>,
      // The AgentProfile object description of the creator.
      creator: ?{|
        // The ID of the object.
        id: string,
        // The unique database identifier of the User.
        userId: number,
        // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
        displayName: ?string,
        // A boolean flag that shows if the User is deleted.
        // If True, the User information is cleansed from the system, and the User can no longer log in.
        isDeleted: ?boolean,
        // A boolean flag describing if the User is a machine user or human user.
        isMachine: ?boolean,
        // The preferences of the User.
        preferences: ?{|
          // The harvesting Translation preference.
          harvestingTranslation: ?{|
            // The source locale of the translation.
            localeFrom: string,
            // The target locale of the translation.
            localeInto: string
          |}
        |}
      |},
      // The list of tags of the extract.
      tags: ?Array<?{|
        // The ID of the object.
        id: string,
        // The value of the tag. This is not language dependent, but rather just unicode text.
        value: string
      |}>
    |}
  |}
|};

export type updateExtractTagsMutationVariables = {|
  id: string,
  tags?: ?Array<?string>
|};

export type updateExtractTagsMutation = {|
  updateExtractTags: ?{|
    tags: ?Array<?{|
      // The ID of the object.
      id: string,
      // The value of the tag. This is not language dependent, but rather just unicode text.
      value: string
    |}>
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
      // The Relay.Node ID type of the Vote Session object.
      voteSessionId: string,
      // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
      instructionsEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A flag specifying if the module has been customized for a specific Proposal.
      isCustom: boolean,
      // The list of GaugeChoiceSpecifications available on a Gauge. These describe all of the options available in the GaugeVote.
      choices: ?Array<?{|
        // The ID of the object.
        id: string,
        value: number,
        // A list of possible languages of the entity as LangStringEntry objects. The label of the Gauge in various languages.
        labelEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>
      |}>
    |}
  |}
|};

export type UpdateHarvestingTranslationPreferenceMutationVariables = {|
  id: string,
  translation: TranslationInput
|};

export type UpdateHarvestingTranslationPreferenceMutation = {|
  // A mutation to save harversting translation preferences
  updateHarvestingTranslationPreference: ?{|
    // The user preferences for a discussion
    preferences: ?{|
      // The harvesting Translation preference.
      harvestingTranslation: ?{|
        // The source locale of the translation.
        localeFrom: string,
        // The target locale of the translation.
        localeInto: string
      |}
    |}
  |}
|};

export type updateIdeasMutationVariables = {|
  discussionPhaseId: number,
  ideas: Array<?IdeaInput>
|};

export type updateIdeasMutation = {|
  // A mutation to create/update/delete ideas for a phase.
  updateIdeas: ?{|
    query: ?{|
      // List of all ideas on the debate.
      thematics: ?Array<?{
        // The Relay.Node ID type of the Idea object.
        parentId: ?string,
        // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
        messageViewOverride: ?string,
        // The order of the Idea, Thematic, Question in the idea tree.
        order: ?number,
        // The total number of active posts on that idea (excludes deleted posts).
        numPosts: ?number,
        // A list of possible languages of the entity as LangStringEntry objects. This is the Idea title in multiple languages.
        titleEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>,
        // A list of possible languages of the entity as LangStringEntry objects. This is the description of the Idea in multiple languages.
        descriptionEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>,
        // Header image associated with the idea. A file metadata object, described by the Document object.
        img: ?{|
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string,
          // The filename title.
          title: ?string
        |},
        // An Announcement object representing a summary of an Idea. This is often included in a header display of an Idea.
        announcement: ?{|
          // A list of possible languages of the entity as LangStringEntry objects. This is the title of announcement in multiple languages.
          titleEntries: Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A list of possible languages of the entity as LangStringEntry objects. This is the body of announcement in multiple languages.
          bodyEntries: Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A list of possible languages of the entity as LangStringEntry objects. This is the quote of the announcement in multiple languages.
          quoteEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A list of possible languages of the entity as LangStringEntry objects. This is the summry of the announcement in multiple languages.
          summaryEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>
        |},
        // A list of Question objects that are bound to the Thematic.
        questions: ?Array<?{|
          // The ID of the object.
          id: string,
          // A list of possible languages of the entity as LangStringEntry objects.
          titleEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>
        |}>,
        // A list of IdeaMessageColumn objects, if any set, on an Idea.
        messageColumns: ?Array<?{|
          // The ID of the object.
          id: string,
          // A CSS color that will be used to theme the column.
          color: ?string,
          // A Synthesis done on the column, of type Post.
          columnSynthesis: ?{|
            // The ID of the object.
            id: string,
            // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
            subjectEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>,
            // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
            bodyEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>
          |},
          // The order of the message column in the Idea/Thematic.
          index: ?number,
          // The unique classification identifier of the MessageColumn. All content who will be put under this column must have this classifer.
          messageClassifier: string,
          // A list of possible languages of the entity as LangStringEntry objects. The name of the column in multiple languages.
          nameEntries: Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A list of possible languages of the entity as LangStringEntry objects. The title of the column in multiple languages.
          titleEntries: Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>
        |}>,
        // The ID of the object.
        id: string
      }>,
      // An idea union between either an Idea type or a Thematic type.
      rootIdea: ?{
        // The ID of the object.
        id: string
      }
    |}
  |}
|};

export type updateLandingPageModuleMutationVariables = {|
  id: string,
  enabled?: ?boolean,
  order?: ?number,
  configuration?: ?string,
  titleEntries?: ?Array<LangStringEntryInput>,
  subtitleEntries?: ?Array<LangStringEntryInput>
|};

export type updateLandingPageModuleMutation = {|
  // A mutation that allows for updating an existing LandingPageModule.
  updateLandingPageModule: ?{|
    // A LandingPageModules that is associated to the debate.
    landingPageModule: ?{|
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      subtitleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // The JSON-based configuration of the LandingPageModule in the debate.
      configuration: ?string,
      // Whether the Module is activated or not.
      enabled: ?boolean,
      // The LandingPageModuleType describing the Module.
      moduleType: ?{|
        // The unique ID of the module type. These can be one of:
        //
        //
        // HEADER: The header section of the landing page.
        //
        // INTRODUCTION: The introduction section.
        //
        // TIMELINE: The list of timelines present in the debate.
        //
        // FOOTER: The footer in the landing page, including information such as privacy policies, etc..
        //
        // TOP_THEMATICS: The section hosting the top active thematics.
        //
        // TWEETS: The tweets section, displaying top tweets in the landing page.
        //
        // CHATBOT: The chatbot section, according to the configured chatbot.
        //
        // CONTACT: The contacts section.
        //
        // NEWS: The latest news section, as configured.
        //
        // DATA: The data sections.
        //
        // PARTNERS: The partners section, highlighting the contributing partners' logos.
        //
        //
        identifier: string,
        // The title of the section.
        title: ?string
      |},
      // The order of the Module in the entire LandingPage.
      order: number
    |}
  |}
|};

export type UpdateLegalContentsMutationVariables = {|
  cookiesPolicyAttachments?: ?Array<?string>,
  legalNoticeAttachments?: ?Array<?string>,
  privacyPolicyAttachments?: ?Array<?string>,
  termsAndConditionsAttachments?: ?Array<?string>,
  userGuidelinesAttachments?: ?Array<?string>,
  cookiesPolicyEntries: Array<?LangStringEntryInput>,
  legalNoticeEntries: Array<?LangStringEntryInput>,
  privacyPolicyEntries: Array<?LangStringEntryInput>,
  termsAndConditionsEntries: Array<?LangStringEntryInput>,
  userGuidelinesEntries: Array<?LangStringEntryInput>,
  mandatoryLegalContentsValidation: boolean
|};

export type UpdateLegalContentsMutation = {|
  // A mutation to update the Legal Contents of a debate.
  updateLegalContents: ?{|
    legalContents: ?{|
      // A boolean flag to activate mandatory validation of legal contents after SSO login.
      mandatoryLegalContentsValidation: boolean,
      // A list of possible languages of the entity as LangStringEntry objects.
      legalNoticeEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects.
      termsAndConditionsEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects.
      cookiesPolicyEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects.
      privacyPolicyEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects.
      userGuidelinesEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A Attachments for legal notice in a given language.
      legalNoticeAttachments: ?Array<?{|
        // The ID of the object.
        id: string,
        // Any file that can be attached. A file metadata object, described by the Document object.
        document: ?{|
          // The ID of the object.
          id: string,
          // The filename title.
          title: ?string,
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string
        |}
      |}>,
      // A Attachments for terms and conditions. in a given language.
      termsAndConditionsAttachments: ?Array<?{|
        // The ID of the object.
        id: string,
        // Any file that can be attached. A file metadata object, described by the Document object.
        document: ?{|
          // The ID of the object.
          id: string,
          // The filename title.
          title: ?string,
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string
        |}
      |}>,
      // A Attachments for cookies policy. in a given language.
      cookiesPolicyAttachments: ?Array<?{|
        // The ID of the object.
        id: string,
        // Any file that can be attached. A file metadata object, described by the Document object.
        document: ?{|
          // The ID of the object.
          id: string,
          // The filename title.
          title: ?string,
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string
        |}
      |}>,
      // A Attachments for privacy policy. in a given language.
      privacyPolicyAttachments: ?Array<?{|
        // The ID of the object.
        id: string,
        // Any file that can be attached. A file metadata object, described by the Document object.
        document: ?{|
          // The ID of the object.
          id: string,
          // The filename title.
          title: ?string,
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string
        |}
      |}>,
      // A Attachments for user guidelines. in a given language.
      userGuidelinesAttachments: ?Array<?{|
        // The ID of the object.
        id: string,
        // Any file that can be attached. A file metadata object, described by the Document object.
        document: ?{|
          // The ID of the object.
          id: string,
          // The filename title.
          title: ?string,
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string
        |}
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
  // A mutation to update existing NumberGaugeVoteSpecifications.
  updateNumberGaugeVoteSpecification: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      // The Relay.Node ID type of the Vote Session object.
      voteSessionId: string,
      // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
      instructionsEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A flag specifying if the module has been customized for a specific Proposal.
      isCustom: boolean,
      // The minimum value on the Gauge.
      minimum: ?number,
      // The maximum value on the Gauge.
      maximum: ?number,
      // The number of intervals between the minimum and maximum values.
      nbTicks: ?number,
      // The unit used on the Gauge. This could be anything desired, like:
      //
      // USD ($) or Euros (€)
      //
      // Months
      //
      // PPM (Parts per million)
      //
      // etc
      unit: ?string
    |}
  |}
|};

export type updatePostMutationVariables = {|
  contentLocale: string,
  postId: string,
  subject?: ?string,
  body: string,
  attachments?: ?Array<?string>,
  publicationState?: ?PublicationStates
|};

export type updatePostMutation = {|
  // A mutation called when a Post is updated.
  updatePost: ?{|
    post: ?{|
      // The ID of the object.
      id: string,
      // The internal database ID of the post.
      // This should never be used in logical computations, however, it exists to give the exact database id for use in sorting or creating classifiers for Posts.
      dbId: ?number,
      // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
      subjectEntries: ?Array<?{|
        // The unicode encoded string representation of the content.
        value: ?string,
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
      bodyEntries: ?Array<?{|
        // The unicode encoded string representation of the content.
        value: ?string,
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string
      |}>,
      // A list of SentimentCounts which counts each sentiment expressed. These include:
      //
      // Like,
      //
      // Agree,
      //
      // Disagree,
      //
      // Like,
      //
      // Don't Understand
      //
      // More Info
      //
      sentimentCounts: ?{|
        // The number of Sentiments disagreeing with the post.
        disagree: ?number,
        // The number of Sentiments expressing "dont_understand" on the Post.
        dontUnderstand: ?number,
        // The number of Sentiments expressed "like" on the post.
        like: ?number,
        // The number of Sentiments requesting "more_info" on the post.
        moreInfo: ?number
      |},
      // The SentimentType that the API calling User has on the Post, if any.
      mySentiment: ?SentimentTypes,
      // A list of IdeaContentLinks, which describe all of the connections the Post has with various Ideas.
      indirectIdeaContentLinks: ?Array<?{|
        // The Idea object associated with an IdeaContentLink.
        idea: ?{|
          // The ID of the object.
          id: string,
          // The title of the Idea, often shown in the Idea header itself.
          title: ?string,
          // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
          messageViewOverride: ?string
        |}
      |}>,
      creator: ?{|
        // The ID of the object.
        id: string,
        // The unique database identifier of the User.
        userId: number,
        // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
        displayName: ?string,
        // A boolean flag that shows if the User is deleted.
        // If True, the User information is cleansed from the system, and the User can no longer log in.
        isDeleted: ?boolean,
        // A boolean flag describing if the User is a machine user or human user.
        isMachine: ?boolean,
        // The preferences of the User.
        preferences: ?{|
          // The harvesting Translation preference.
          harvestingTranslation: ?{|
            // The source locale of the translation.
            localeFrom: string,
            // The target locale of the translation.
            localeInto: string
          |}
        |}
      |},
      // The User or AgentProfile who created the parent post.
      parentPostCreator: ?{|
        // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
        displayName: ?string
      |},
      // A boolean flag to say whether the post is modified or not.
      modified: ?boolean,
      // A ??? in a given language.
      bodyMimeType: string,
      // A graphene Field containing the state of the publication of a certain post. The options are:
      // DRAFT,
      //
      // SUBMITTED_IN_EDIT_GRACE_PERIOD,
      //
      // SUBMITTED_AWAITING_MODERATION,
      //
      // PUBLISHED,
      //
      // MODERATED_TEXT_ON_DEMAND,
      //
      // MODERATED_TEXT_NEVER_AVAILABLE,
      //
      // DELETED_BY_USER,
      //
      // DELETED_BY_ADMIN,
      //
      // WIDGET_SCOPED
      //
      publicationState: ?PublicationStates,
      // A list of IdeaContentLinks that are in fact Extracts on the Post. Extracts are valuable entities taken from
      extracts: ?Array<?{|
        // The ID of the object.
        id: string,
        // The date the Extract was created, in UTC timezone.
        creationDate: ?any,
        // A flag for importance of the Extract.
        important: ?boolean,
        // The body of text that is extracted from the post. This is not language dependent, but rather just unicode text.
        body: string,
        // The lang of the extract.
        lang: ?string,
        // The taxonomy (or classification) of the extracted body. The options are one of:
        //
        //
        // issue: The body of text is an issue.
        //
        // actionable_solution: The body of text is a potentially actionable solution.
        //
        // knowledge: The body of text is in fact knowledge gained by the community.
        //
        // example: The body of text is an example in the context that it was derived from.
        //
        // concept: The body of text is a high level concept.
        //
        // argument: The body of text is an argument for/against in the context that it was extracted from.
        //
        // cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.
        //
        //
        extractNature: ?string,
        // The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:
        //
        //
        // classify: This body of text should be re-classified by an priviledged user.
        //
        // make_generic: The body of text is a specific example and not generic.
        //
        // argument: A user must give more arguments.
        //
        // give_examples: A user must give more examples.
        //
        // more_specific: A user must be more specific within the same context.
        //
        // mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.
        //
        // display_multi_column: A priviledged user should activate the Mutli-Column view.
        //
        // display_thread: A priviledged user should activate the Thread view.
        //
        // display_tokens: A priviledged user should activate the Token Vote view.
        //
        // display_open_questions: A priviledged user should activate the Open Question view.
        //
        // display_bright_mirror: A priviledged user should activate the Bright Mirror view.
        //
        //
        extractAction: ?string,
        // A graphene Field containing the state of the extract. The options are:
        // SUBMITTED,
        //
        // PUBLISHED
        //
        extractState: ?ExtractStates,
        // A list of TextFragmentIdentifiers.
        textFragmentIdentifiers: ?Array<?{|
          // The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned.
          xpathStart: ?string,
          // The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
          // Often times the xpathEnd variable is the same as the xpathStart selector.
          xpathEnd: ?string,
          // The character offset index where an extract begins, beginning from index 0 in a string of text.
          offsetStart: ?number,
          // The character offset index where an extract ends in a string of text.
          offsetEnd: ?number
        |}>,
        // The AgentProfile object description of the creator.
        creator: ?{|
          // The ID of the object.
          id: string,
          // The unique database identifier of the User.
          userId: number,
          // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
          displayName: ?string,
          // A boolean flag that shows if the User is deleted.
          // If True, the User information is cleansed from the system, and the User can no longer log in.
          isDeleted: ?boolean,
          // A boolean flag describing if the User is a machine user or human user.
          isMachine: ?boolean,
          // The preferences of the User.
          preferences: ?{|
            // The harvesting Translation preference.
            harvestingTranslation: ?{|
              // The source locale of the translation.
              localeFrom: string,
              // The target locale of the translation.
              localeInto: string
            |}
          |}
        |},
        // The list of tags of the extract.
        tags: ?Array<?{|
          // The ID of the object.
          id: string,
          // The value of the tag. This is not language dependent, but rather just unicode text.
          value: string
        |}>
      |}>,
      // List of attachements to the post.
      attachments: ?Array<?{|
        // The ID of the object.
        id: string,
        // Any file that can be attached. A file metadata object, described by the Document object.
        document: ?{|
          // The ID of the object.
          id: string,
          // The filename title.
          title: ?string,
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string
        |}
      |}>,
      // Keywords associated with the post, according to NLP engine.
      keywords: ?Array<?{|
        // The score associated with the tag (0-1, increasing relevance)
        score: ?number,
        // The number of times the tag was found
        count: ?number,
        // The tag keyword
        value: ?string
      |}>,
      // A list of abstract tags associated to the post.
      tags: ?Array<?{|
        // The ID of the object.
        id: string,
        // The value of the tag. This is not language dependent, but rather just unicode text.
        value: string
      |}>
    |}
  |}
|};

export type updateProfileFieldsMutationVariables = {|
  data: Array<?FieldDataInput>,
  lang: string
|};

export type updateProfileFieldsMutation = {|
  // A mutation that enables an existing ProfileField to be updated.
  updateProfileFields: ?{|
    profileFields: ?Array<?{|
      // The ID of the object.
      id: string,
      // The configuration options affecting this field.
      configurableField:
        | {
            // The type of the field. The possible options are:
            //
            // TEXT
            //
            // EMAIL
            //
            // PASSWORD
            fieldType: string,
            // The ID of the object.
            id: string,
            // The unique identifier of the field.
            identifier: ?string,
            // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
            titleEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>,
            // A Text Field Label in a given language.
            title: ?string,
            // The position (order) of the Field compared to other Fields.
            order: ?number,
            // A flag indicating if the Field requires an input or not.
            required: ?boolean,
            // A flag indicating if the Field is hidden for the user or not.
            hidden: boolean
          }
        | {
            // The ID of the object.
            id: string,
            // The unique identifier of the field.
            identifier: ?string,
            // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
            titleEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>,
            // A Text Field Label in a given language.
            title: ?string,
            // The position (order) of the Field compared to other Fields.
            order: ?number,
            // A flag indicating if the Field requires an input or not.
            required: ?boolean,
            // A flag indicating if the Field is hidden for the user or not.
            hidden: boolean,
            options: ?Array<?{|
              // The ID of the object.
              id: string,
              // The position (order) of the field.
              order: number,
              // A Text Field Label in a given language.
              label: ?string,
              // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
              labelEntries: ?Array<?{|
                // The ISO 639-1 locale code of the language the content represents.
                localeCode: string,
                // The unicode encoded string representation of the content.
                value: ?string
              |}>
            |}>
          },
      // The value of the field. It can be of various types.
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
  // A mutation that enables existing Proposals to be updated.
  updateProposal: ?{|
    proposal: ?{|
      // The ID of the object.
      id: string,
      // The order of the Idea, Thematic, Question in the idea tree.
      order: ?number,
      // A list of possible languages of the entity as LangStringEntry objects. This is the Idea title in multiple languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. This is the description of the Idea in multiple languages.
      descriptionEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>
    |}
  |}
|};

export type updateResourceMutationVariables = {|
  id: string,
  doc?: ?string,
  image?: ?string,
  lang: string,
  titleEntries: Array<?LangStringEntryInput>,
  textEntries: Array<?LangStringEntryInput>,
  embedCode?: ?string,
  order?: ?number
|};

export type updateResourceMutation = {|
  // A mutation that enables existing Resources to be updated.
  updateResource: ?{|
    resource: ?{|
      // A file attached to the ResourceA file metadata object, described by the Document object.
      doc: ?{|
        // A url to an image or a document to be attached.
        externalUrl: ?string,
        // The MIME-Type of the file uploaded.
        mimeType: ?string,
        // The filename title.
        title: ?string
      |},
      // The URL for any i-frame based content that matches the Content-Security-Policy of the server.
      // In effect, this is the "src" code inside of an iframe-based attachment to a Resource.
      embedCode: ?string,
      // The ID of the object.
      id: string,
      // An image attached to the ResourceA file metadata object, described by the Document object.
      image: ?{|
        // A url to an image or a document to be attached.
        externalUrl: ?string,
        // The MIME-Type of the file uploaded.
        mimeType: ?string,
        // The filename title.
        title: ?string
      |},
      text: ?string,
      title: ?string,
      // A list of possible languages of the entity as LangStringEntry objects. The title of the Resource in various languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The title of the Resource in various languages.
      textEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // The order of the Resource on the Resources Center page.A file metadata object, described by the Document object.
      order: ?number
    |}
  |}
|};

export type UpdateResourcesCenterMutationVariables = {|
  headerImage?: ?string,
  titleEntries: Array<?LangStringEntryInput>
|};

export type UpdateResourcesCenterMutation = {|
  // The mutation that allows to update existing Resource Center objects.
  updateResourcesCenter: ?{|
    resourcesCenter: ?{|
      // The name of the resource center in all available languages
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // The main image associated with the resource centerA file metadata object, described by the Document object.
      headerImage: ?{|
        // A url to an image or a document to be attached.
        externalUrl: ?string,
        // The filename title.
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
  // A mutation that allows for an existing Section to be updated.
  updateSection: ?{|
    section: ?{|
      // The ID of the object.
      id: string,
      // An optional field. Should the tab redirect to a location outside of the platform, the URL is the location to redirect towards.
      url: ?string,
      // A The title of the Section. in a given language.
      title: ?string,
      // There are 5 section types:
      //
      // HOMEPAGE
      //
      // DEBATE
      //
      // SYNTHESES
      //
      // RESOURCES_CENTER
      //
      // CUSTOM
      //
      // ADMINISTRATION
      sectionType: string,
      // The order of the Sections on the top of the page.
      order: number
    |}
  |}
|};

export type updateShareCountMutationVariables = {|
  nodeId: string
|};

export type updateShareCountMutation = {|
  // A mutation called when a user shares a post/idea.
  updateShareCount: ?{|
    node: ?(
      | {
          // The ID of the object.
          id: string
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
      | {
          // The ID of the object.
          id: string
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
    )
  |}
|};

export type updateSynthesisMutationVariables = {|
  id: string,
  image?: ?string,
  bodyEntries: Array<?LangStringEntryInput>,
  subjectEntries: Array<?LangStringEntryInput>,
  publicationState: PublicationStates
|};

export type updateSynthesisMutation = {|
  // A mutation that enables a Synthesis to be updated.
  updateSynthesis: ?{|
    synthesisPost: ?{|
      // The ID of the object.
      id: string,
      // A graphene Field containing the state of the publication of a certain post. The options are:
      // DRAFT,
      //
      // SUBMITTED_IN_EDIT_GRACE_PERIOD,
      //
      // SUBMITTED_AWAITING_MODERATION,
      //
      // PUBLISHED,
      //
      // MODERATED_TEXT_ON_DEMAND,
      //
      // MODERATED_TEXT_NEVER_AVAILABLE,
      //
      // DELETED_BY_USER,
      //
      // DELETED_BY_ADMIN,
      //
      // WIDGET_SCOPED
      //
      publicationState: ?PublicationStates,
      // Graphene Field modeling a relationship to a published synthesis.
      publishesSynthesis: ?{|
        // The ID of the object.
        id: string,
        // The type of Synthesis to be created
        synthesisType: SynthesisTypes,
        // A list of possible languages of the entity as LangStringEntry objects. The subject in various languages.
        subjectEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>,
        // A list of possible languages of the entity as LangStringEntry objects. The body in various languages.
        bodyEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
          value: ?string
        |}>,
        // This is a header image document object that will be visible on the Synthesis view's header.A file metadata object, described by the Document object.
        img: ?{|
          // The ID of the object.
          id: string,
          // The filename title.
          title: ?string,
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string
        |}
      |}
    |}
  |}
|};

export type updateTagMutationVariables = {|
  id: string,
  value: string,
  taggableId?: ?string
|};

export type updateTagMutation = {|
  // A mutation to update or replace the value of an existing tag.
  updateTag: ?{|
    tag: ?{|
      // The ID of the object.
      id: string,
      // The value of the tag. This is not language dependent, but rather just unicode text.
      value: string
    |}
  |}
|};

export type updateTextFieldMutationVariables = {|
  id: string,
  lang: string,
  titleEntries: Array<?LangStringEntryInput>,
  order: number,
  required: boolean,
  hidden: boolean,
  options?: ?Array<?SelectFieldOptionInput>
|};

export type updateTextFieldMutation = {|
  // A mutation that allows an existing TextField to be updated.
  updateTextField: ?{|
    field: ?(
      | {
          // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
          titleEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A Text Field Label in a given language.
          title: ?string,
          // The position (order) of the Field compared to other Fields.
          order: ?number,
          // A flag indicating if the Field requires an input or not.
          required: ?boolean,
          // A flag indicating if the Field is hidden for the user or not.
          hidden: boolean,
          // The ID of the object.
          id: string
        }
      | {
          // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
          titleEntries: ?Array<?{|
            // The ISO 639-1 locale code of the language the content represents.
            localeCode: string,
            // The unicode encoded string representation of the content.
            value: ?string
          |}>,
          // A Text Field Label in a given language.
          title: ?string,
          // The position (order) of the Field compared to other Fields.
          order: ?number,
          // A flag indicating if the Field requires an input or not.
          required: ?boolean,
          // A flag indicating if the Field is hidden for the user or not.
          hidden: boolean,
          // The ID of the object.
          id: string,
          options: ?Array<?{|
            // The ID of the object.
            id: string,
            // The position (order) of the field.
            order: number,
            // A Text Field Label in a given language.
            label: ?string,
            // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
            labelEntries: ?Array<?{|
              // The ISO 639-1 locale code of the language the content represents.
              localeCode: string,
              // The unicode encoded string representation of the content.
              value: ?string
            |}>
          |}>
        }
    )
  |}
|};

export type updateThematicMutationVariables = {|
  id: string,
  image?: ?string,
  titleEntries: Array<?LangStringEntryInput>,
  descriptionEntries?: ?Array<?LangStringEntryInput>,
  questions?: ?Array<?QuestionInput>,
  announcement?: ?IdeaAnnouncementInput,
  order?: ?number,
  messageViewOverride?: ?string
|};

export type updateThematicMutation = {|
  // A mutation to update a thematic.
  updateThematic: ?{|
    thematic: ?{
      // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
      messageViewOverride: ?string,
      // The order of the Idea, Thematic, Question in the idea tree.
      order: ?number,
      // The title of the Idea, often shown in the Idea header itself.
      title: ?string,
      // The description of the Idea, often shown in the header of the Idea.
      description: ?string,
      // An Announcement object representing a summary of an Idea. This is often included in a header display of an Idea.
      announcement: ?{|
        // A title of announcement in a given language.
        title: ?string,
        // A body of announcement in a given language.
        body: ?string,
        // A summary of announcement in a given language.
        summary: ?string
      |},
      // Header image associated with the idea. A file metadata object, described by the Document object.
      img: ?{|
        // A url to an image or a document to be attached.
        externalUrl: ?string,
        // The MIME-Type of the file uploaded.
        mimeType: ?string
      |},
      // A list of Question objects that are bound to the Thematic.
      questions: ?Array<?{|
        // The ID of the object.
        id: string,
        // The Question to be asked itself, in the language given.
        title: ?string
      |}>,
      // The ID of the object.
      id: string
    }
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
  // A mutation enabling an existing TokenVoteSpecification to be updated.
  updateTokenVoteSpecification: ?{|
    voteSpecification: ?{|
      // The ID of the object.
      id: string,
      // The Relay.Node ID type of the Vote Session object.
      voteSessionId: string,
      // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
      titleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
      instructionsEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A flag specifying if the module has been customized for a specific Proposal.
      isCustom: boolean,
      exclusiveCategories: ?boolean,
      // The list of Token category specification(TokenCategorySpecification).
      tokenCategories: Array<?{|
        // The ID of the object.
        id: string,
        totalNumber: number,
        // A list of possible languages of the entity as LangStringEntry objects. The title of the Token Category in various languages.
        titleEntries: ?Array<?{|
          // The ISO 639-1 locale code of the language the content represents.
          localeCode: string,
          // The unicode encoded string representation of the content.
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
  // A mutation with which a User can update his name, his username, his avatar image or his password.
  updateUser: ?{|
    user: ?{|
      // The ID of the object.
      id: string,
      // The name of the User.
      name: ?string,
      // The unique user name of the User. This field is unique throughout the server.
      username: ?string,
      // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
      displayName: ?string,
      // Image appearing on the avatar of the User. A file metadata object, described by the Document object.
      image: ?{|
        // A url to an image or a document to be attached.
        externalUrl: ?string
      |}
    |}
  |}
|};

export type UpdateVoteSessionMutationVariables = {|
  ideaId: string,
  propositionsSectionTitleEntries?: ?Array<?LangStringEntryInput>,
  seeCurrentVotes?: ?boolean
|};

export type UpdateVoteSessionMutation = {|
  // A mutation that allows for existing VoteSessions to be updated.
  updateVoteSession: ?{|
    voteSession: ?{|
      // A flag allowing users to view the current votes.
      seeCurrentVotes: boolean,
      // A list of possible languages of the entity as LangStringEntry objects. The Proposal section's title in various languages.
      propositionsSectionTitleEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>
    |}
  |}
|};

export type uploadDocumentMutationVariables = {|
  file: string
|};

export type uploadDocumentMutation = {|
  // A mutation allowing the uploading of a File object.
  uploadDocument: ?{|
    document: ?{|
      // The ID of the object.
      id: string,
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string,
      // The filename title.
      title: ?string
    |}
  |}
|};

export type validatePostMutationVariables = {|
  postId: string
|};

export type validatePostMutation = {|
  // A mutation to validate a submitted Post.
  validatePost: ?{|
    post: ?{|
      // The ID of the object.
      id: string,
      // A graphene Field containing the state of the publication of a certain post. The options are:
      // DRAFT,
      //
      // SUBMITTED_IN_EDIT_GRACE_PERIOD,
      //
      // SUBMITTED_AWAITING_MODERATION,
      //
      // PUBLISHED,
      //
      // MODERATED_TEXT_ON_DEMAND,
      //
      // MODERATED_TEXT_NEVER_AVAILABLE,
      //
      // DELETED_BY_USER,
      //
      // DELETED_BY_ADMIN,
      //
      // WIDGET_SCOPED
      //
      publicationState: ?PublicationStates
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
    | {}
    | {}
    | {
        // The ID of the object.
        id: string,
        // The name of the User.
        name: ?string,
        // The unique user name of the User. This field is unique throughout the server.
        username: ?string,
        // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
        displayName: ?string,
        // The email used by the User for identification.
        email: ?string,
        // The date that the object was created, in UTC timezone, in ISO 8601 format.
        creationDate: ?any,
        // A boolean flag describing if the User has a password.
        hasPassword: ?boolean,
        // A boolean flag that shows if the User is deleted.
        // If True, the User information is cleansed from the system, and the User can no longer log in.
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
    | {}
    | {}
  )
|};

export type tokenVoteSpecificationFragment = {|
  // The ID of the object.
  id: string,
  // The Relay.Node ID type of the Vote Session object.
  voteSessionId: string,
  // A The instructions of the VoteSpecification. in a given language.
  instructions: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
  titleEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
  instructionsEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A flag specifying if the module has been customized for a specific Proposal.
  isCustom: boolean,
  exclusiveCategories: ?boolean,
  // The list of Token category specification(TokenCategorySpecification).
  tokenCategories: Array<?{|
    // The ID of the object.
    id: string,
    totalNumber: number,
    // categories which have the same typename will be comparable (example: "positive")
    typename: string,
    // A The title of the Token Category. in a given language.
    title: ?string,
    // A list of possible languages of the entity as LangStringEntry objects. The title of the Token Category in various languages.
    titleEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    color: ?string
  |}>,
  // The Relay.Node ID type of the Vote Specification template object. A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications.
  voteSpecTemplateId: ?string,
  // The type of the VoteSpecification.
  voteType: ?string
|};

export type tokenVoteSpecificationResultsFragment = {|
  // The list of Votes by a specific User.
  myVotes: Array<?(
    | {
        // The number of Tokens used on a certain Vote.
        voteValue: number,
        proposalId: string,
        tokenCategoryId: string
      }
    | {}
  )>,
  // The total number of Voters for this Vote.
  numVotes: number,
  // The list of information regarding votes (VotesByCategory).
  tokenVotes: Array<?{|
    // The Relay.Node ID type of the TokenCategory object.
    tokenCategoryId: string,
    // The number of tokens on that Category.
    numToken: number
  |}>
|};

export type numberGaugeVoteSpecificationFragment = {|
  // The ID of the object.
  id: string,
  // The Relay.Node ID type of the Vote Session object.
  voteSessionId: string,
  // A The instructions of the VoteSpecification. in a given language.
  instructions: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
  titleEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
  instructionsEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A flag specifying if the module has been customized for a specific Proposal.
  isCustom: boolean,
  // The minimum value on the Gauge.
  minimum: ?number,
  // The maximum value on the Gauge.
  maximum: ?number,
  // The number of intervals between the minimum and maximum values.
  nbTicks: ?number,
  // The unit used on the Gauge. This could be anything desired, like:
  //
  // USD ($) or Euros (€)
  //
  // Months
  //
  // PPM (Parts per million)
  //
  // etc
  unit: ?string,
  // The Relay.Node ID type of the Vote Specification template object. A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications.
  voteSpecTemplateId: ?string,
  // The type of the VoteSpecification.
  voteType: ?string
|};

export type numberGaugeVoteSpecificationResultsFragment = {|
  // The list of Votes by a specific User.
  myVotes: Array<?(
    | {}
    | {
        // The value entered on the GaugeVote.
        selectedValue: number,
        proposalId: string
      }
  )>,
  // The total number of Voters for this Vote.
  numVotes: number,
  // The average value of the Votes submitted by all Users.
  averageResult: ?number
|};

export type gaugeVoteSpecificationFragment = {|
  // The ID of the object.
  id: string,
  // The Relay.Node ID type of the Vote Session object.
  voteSessionId: string,
  // A The instructions of the VoteSpecification. in a given language.
  instructions: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. The title of the VoteSpecification in various languages.
  titleEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A list of possible languages of the entity as LangStringEntry objects. The instructions of the VoteSpecification in various languages.
  instructionsEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A flag specifying if the module has been customized for a specific Proposal.
  isCustom: boolean,
  // The list of GaugeChoiceSpecifications available on a Gauge. These describe all of the options available in the GaugeVote.
  choices: ?Array<?{|
    // The ID of the object.
    id: string,
    value: number,
    // A The label of the Gauge in a given language.
    label: ?string,
    // A list of possible languages of the entity as LangStringEntry objects. The label of the Gauge in various languages.
    labelEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>
  |}>,
  // The Relay.Node ID type of the Vote Specification template object. A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications.
  voteSpecTemplateId: ?string,
  // The type of the VoteSpecification.
  voteType: ?string
|};

export type gaugeVoteSpecificationResultsFragment = {|
  // The list of Votes by a specific User.
  myVotes: Array<?(
    | {}
    | {
        // The value entered on the GaugeVote.
        selectedValue: number,
        proposalId: string
      }
  )>,
  // The total number of Voters for this Vote.
  numVotes: number,
  // A The label of the average value for the Gauge in a given language.
  averageLabel: ?string,
  // A The average value for the Gauge as a float
  averageResult: ?number
|};

export type ADocumentFragment = {|
  // The ID of the object.
  id: string,
  // The filename title.
  title: ?string,
  // A url to an image or a document to be attached.
  externalUrl: ?string,
  // The MIME-Type of the file uploaded.
  mimeType: ?string
|};

export type AgentProfileInfoFragment = {|
  // The ID of the object.
  id: string,
  // The unique database identifier of the User.
  userId: number,
  // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
  displayName: ?string,
  // A boolean flag that shows if the User is deleted.
  // If True, the User information is cleansed from the system, and the User can no longer log in.
  isDeleted: ?boolean,
  // A boolean flag describing if the User is a machine user or human user.
  isMachine: ?boolean,
  // The preferences of the User.
  preferences: ?{|
    // The harvesting Translation preference.
    harvestingTranslation: ?{|
      // The source locale of the translation.
      localeFrom: string,
      // The target locale of the translation.
      localeInto: string
    |}
  |}
|};

export type AttachmentFragment = {|
  // The ID of the object.
  id: string,
  // Any file that can be attached. A file metadata object, described by the Document object.
  document: ?{|
    // The ID of the object.
    id: string,
    // The filename title.
    title: ?string,
    // A url to an image or a document to be attached.
    externalUrl: ?string,
    // The MIME-Type of the file uploaded.
    mimeType: ?string
  |}
|};

export type BrightMirrorFictionFragment = {|
  // The ID of the object.
  id: string,
  // The internal database ID of the post.
  // This should never be used in logical computations, however, it exists to give the exact database id for use in sorting or creating classifiers for Posts.
  dbId: ?number,
  // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
  subjectEntries: ?Array<?{|
    // The unicode encoded string representation of the content.
    value: ?string,
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string
  |}>,
  // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
  bodyEntries: ?Array<?{|
    // The unicode encoded string representation of the content.
    value: ?string,
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string
  |}>,
  // The date that the object was created, in UTC timezone, in ISO 8601 format.
  creationDate: ?any,
  // A graphene Field containing the state of the publication of a certain post. The options are:
  // DRAFT,
  //
  // SUBMITTED_IN_EDIT_GRACE_PERIOD,
  //
  // SUBMITTED_AWAITING_MODERATION,
  //
  // PUBLISHED,
  //
  // MODERATED_TEXT_ON_DEMAND,
  //
  // MODERATED_TEXT_NEVER_AVAILABLE,
  //
  // DELETED_BY_USER,
  //
  // DELETED_BY_ADMIN,
  //
  // WIDGET_SCOPED
  //
  publicationState: ?PublicationStates,
  // A boolean flag to say whether the post is modified or not.
  modified: ?boolean,
  creator: ?{|
    // The ID of the object.
    id: string,
    // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
    displayName: ?string,
    // A boolean flag that shows if the User is deleted.
    // If True, the User information is cleansed from the system, and the User can no longer log in.
    isDeleted: ?boolean,
    // The unique database identifier of the User.
    userId: number,
    // Image appearing on the avatar of the User. A file metadata object, described by the Document object.
    image: ?{|
      // A url to an image or a document to be attached.
      externalUrl: ?string
    |}
  |},
  // A list of SentimentCounts which counts each sentiment expressed. These include:
  //
  // Like,
  //
  // Agree,
  //
  // Disagree,
  //
  // Like,
  //
  // Don't Understand
  //
  // More Info
  //
  sentimentCounts: ?{|
    // The number of Sentiments disagreeing with the post.
    disagree: ?number,
    // The number of Sentiments expressing "dont_understand" on the Post.
    dontUnderstand: ?number,
    // The number of Sentiments expressed "like" on the post.
    like: ?number,
    // The number of Sentiments requesting "more_info" on the post.
    moreInfo: ?number
  |},
  // The SentimentType that the API calling User has on the Post, if any.
  mySentiment: ?SentimentTypes,
  // The User or AgentProfile who created the parent post.
  parentPostCreator: ?{|
    // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
    displayName: ?string
  |},
  // A ??? in a given language.
  bodyMimeType: string,
  // A list of IdeaContentLinks that are in fact Extracts on the Post. Extracts are valuable entities taken from
  extracts: ?Array<?{|
    // The ID of the object.
    id: string,
    // The date the Extract was created, in UTC timezone.
    creationDate: ?any,
    // A flag for importance of the Extract.
    important: ?boolean,
    // The body of text that is extracted from the post. This is not language dependent, but rather just unicode text.
    body: string,
    // The lang of the extract.
    lang: ?string,
    // The taxonomy (or classification) of the extracted body. The options are one of:
    //
    //
    // issue: The body of text is an issue.
    //
    // actionable_solution: The body of text is a potentially actionable solution.
    //
    // knowledge: The body of text is in fact knowledge gained by the community.
    //
    // example: The body of text is an example in the context that it was derived from.
    //
    // concept: The body of text is a high level concept.
    //
    // argument: The body of text is an argument for/against in the context that it was extracted from.
    //
    // cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.
    //
    //
    extractNature: ?string,
    // The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:
    //
    //
    // classify: This body of text should be re-classified by an priviledged user.
    //
    // make_generic: The body of text is a specific example and not generic.
    //
    // argument: A user must give more arguments.
    //
    // give_examples: A user must give more examples.
    //
    // more_specific: A user must be more specific within the same context.
    //
    // mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.
    //
    // display_multi_column: A priviledged user should activate the Mutli-Column view.
    //
    // display_thread: A priviledged user should activate the Thread view.
    //
    // display_tokens: A priviledged user should activate the Token Vote view.
    //
    // display_open_questions: A priviledged user should activate the Open Question view.
    //
    // display_bright_mirror: A priviledged user should activate the Bright Mirror view.
    //
    //
    extractAction: ?string,
    // A graphene Field containing the state of the extract. The options are:
    // SUBMITTED,
    //
    // PUBLISHED
    //
    extractState: ?ExtractStates,
    // A list of TextFragmentIdentifiers.
    textFragmentIdentifiers: ?Array<?{|
      // The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned.
      xpathStart: ?string,
      // The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
      // Often times the xpathEnd variable is the same as the xpathStart selector.
      xpathEnd: ?string,
      // The character offset index where an extract begins, beginning from index 0 in a string of text.
      offsetStart: ?number,
      // The character offset index where an extract ends in a string of text.
      offsetEnd: ?number
    |}>,
    // The AgentProfile object description of the creator.
    creator: ?{|
      // The ID of the object.
      id: string,
      // The unique database identifier of the User.
      userId: number,
      // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
      displayName: ?string,
      // A boolean flag that shows if the User is deleted.
      // If True, the User information is cleansed from the system, and the User can no longer log in.
      isDeleted: ?boolean,
      // A boolean flag describing if the User is a machine user or human user.
      isMachine: ?boolean,
      // The preferences of the User.
      preferences: ?{|
        // The harvesting Translation preference.
        harvestingTranslation: ?{|
          // The source locale of the translation.
          localeFrom: string,
          // The target locale of the translation.
          localeInto: string
        |}
      |}
    |},
    // A list of comment post related to an extract.
    comments: ?Array<?{|
      // The ID of the object.
      id: string,
      // A Body of the post (the main content of the post). in a given language.
      body: ?string,
      // The date that the object was created, in UTC timezone, in ISO 8601 format.
      creationDate: ?any,
      creator: ?{|
        // The ID of the object.
        id: string,
        // The unique database identifier of the User.
        userId: number,
        // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
        displayName: ?string,
        // A boolean flag that shows if the User is deleted.
        // If True, the User information is cleansed from the system, and the User can no longer log in.
        isDeleted: ?boolean,
        // A boolean flag describing if the User is a machine user or human user.
        isMachine: ?boolean,
        // The preferences of the User.
        preferences: ?{|
          // The harvesting Translation preference.
          harvestingTranslation: ?{|
            // The source locale of the translation.
            localeFrom: string,
            // The target locale of the translation.
            localeInto: string
          |}
        |}
      |},
      // List of attachements to the post.
      attachments: ?Array<?{|
        // The ID of the object.
        id: string,
        // Any file that can be attached. A file metadata object, described by the Document object.
        document: ?{|
          // The ID of the object.
          id: string,
          // The filename title.
          title: ?string,
          // A url to an image or a document to be attached.
          externalUrl: ?string,
          // The MIME-Type of the file uploaded.
          mimeType: ?string
        |}
      |}>,
      // The parent of a Post, if the Post is a reply to an existing Post. The Relay.Node ID type of the Post object.
      parentId: ?string,
      // A graphene Field containing the state of the publication of a certain post. The options are:
      // DRAFT,
      //
      // SUBMITTED_IN_EDIT_GRACE_PERIOD,
      //
      // SUBMITTED_AWAITING_MODERATION,
      //
      // PUBLISHED,
      //
      // MODERATED_TEXT_ON_DEMAND,
      //
      // MODERATED_TEXT_NEVER_AVAILABLE,
      //
      // DELETED_BY_USER,
      //
      // DELETED_BY_ADMIN,
      //
      // WIDGET_SCOPED
      //
      publicationState: ?PublicationStates
    |}>
  |}>,
  // Keywords associated with the post, according to NLP engine.
  keywords: ?Array<?{|
    // The score associated with the tag (0-1, increasing relevance)
    score: ?number,
    // The number of times the tag was found
    count: ?number,
    // The tag keyword
    value: ?string
  |}>,
  // A list of abstract tags associated to the post.
  tags: ?Array<?{|
    // The ID of the object.
    id: string,
    // The value of the tag. This is not language dependent, but rather just unicode text.
    value: string
  |}>
|};

export type discussionPhaseFragment = {|
  // The ID of the object.
  id: string,
  // Identifier of the Phase. Possible phase identifiers: "survey", "thread", "multiColumns", "voteSession", "brightMirror".
  identifier: ?string,
  // A title of the Phase. in a given language.
  title: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. These are the title of the phase in various languages.
  titleEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A description of the Phase. in a given language.
  description: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. These are the description of the phase in various languages.
  descriptionEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // An ISO 8601, UTC timezoned time representing the starting date of the phase.
  start: ?any,
  // An ISO 8601, UTC timezoned time representing the ending date of the phase.
  end: ?any,
  // A Order of the phase in the Timeline. as a float
  order: ?number,
  // The image displayed on the phase.A file metadata object, described by the Document object.
  image: ?{|
    // The MIME-Type of the file uploaded.
    mimeType: ?string,
    // The filename title.
    title: ?string,
    // A url to an image or a document to be attached.
    externalUrl: ?string
  |}
|};

export type ExtractFragment = {|
  // The ID of the object.
  id: string,
  // The date the Extract was created, in UTC timezone.
  creationDate: ?any,
  // A flag for importance of the Extract.
  important: ?boolean,
  // The body of text that is extracted from the post. This is not language dependent, but rather just unicode text.
  body: string,
  // The lang of the extract.
  lang: ?string,
  // The taxonomy (or classification) of the extracted body. The options are one of:
  //
  //
  // issue: The body of text is an issue.
  //
  // actionable_solution: The body of text is a potentially actionable solution.
  //
  // knowledge: The body of text is in fact knowledge gained by the community.
  //
  // example: The body of text is an example in the context that it was derived from.
  //
  // concept: The body of text is a high level concept.
  //
  // argument: The body of text is an argument for/against in the context that it was extracted from.
  //
  // cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.
  //
  //
  extractNature: ?string,
  // The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:
  //
  //
  // classify: This body of text should be re-classified by an priviledged user.
  //
  // make_generic: The body of text is a specific example and not generic.
  //
  // argument: A user must give more arguments.
  //
  // give_examples: A user must give more examples.
  //
  // more_specific: A user must be more specific within the same context.
  //
  // mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.
  //
  // display_multi_column: A priviledged user should activate the Mutli-Column view.
  //
  // display_thread: A priviledged user should activate the Thread view.
  //
  // display_tokens: A priviledged user should activate the Token Vote view.
  //
  // display_open_questions: A priviledged user should activate the Open Question view.
  //
  // display_bright_mirror: A priviledged user should activate the Bright Mirror view.
  //
  //
  extractAction: ?string,
  // A graphene Field containing the state of the extract. The options are:
  // SUBMITTED,
  //
  // PUBLISHED
  //
  extractState: ?ExtractStates,
  // A list of TextFragmentIdentifiers.
  textFragmentIdentifiers: ?Array<?{|
    // The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned.
    xpathStart: ?string,
    // The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
    // Often times the xpathEnd variable is the same as the xpathStart selector.
    xpathEnd: ?string,
    // The character offset index where an extract begins, beginning from index 0 in a string of text.
    offsetStart: ?number,
    // The character offset index where an extract ends in a string of text.
    offsetEnd: ?number
  |}>,
  // The AgentProfile object description of the creator.
  creator: ?{|
    // The ID of the object.
    id: string,
    // The unique database identifier of the User.
    userId: number,
    // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
    displayName: ?string,
    // A boolean flag that shows if the User is deleted.
    // If True, the User information is cleansed from the system, and the User can no longer log in.
    isDeleted: ?boolean,
    // A boolean flag describing if the User is a machine user or human user.
    isMachine: ?boolean,
    // The preferences of the User.
    preferences: ?{|
      // The harvesting Translation preference.
      harvestingTranslation: ?{|
        // The source locale of the translation.
        localeFrom: string,
        // The target locale of the translation.
        localeInto: string
      |}
    |}
  |},
  // The list of tags of the extract.
  tags: ?Array<?{|
    // The ID of the object.
    id: string,
    // The value of the tag. This is not language dependent, but rather just unicode text.
    value: string
  |}>
|};

export type ExtractCommentFragment = {|
  // The ID of the object.
  id: string,
  // A Body of the post (the main content of the post). in a given language.
  body: ?string,
  // The date that the object was created, in UTC timezone, in ISO 8601 format.
  creationDate: ?any,
  creator: ?{|
    // The ID of the object.
    id: string,
    // The unique database identifier of the User.
    userId: number,
    // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
    displayName: ?string,
    // A boolean flag that shows if the User is deleted.
    // If True, the User information is cleansed from the system, and the User can no longer log in.
    isDeleted: ?boolean,
    // A boolean flag describing if the User is a machine user or human user.
    isMachine: ?boolean,
    // The preferences of the User.
    preferences: ?{|
      // The harvesting Translation preference.
      harvestingTranslation: ?{|
        // The source locale of the translation.
        localeFrom: string,
        // The target locale of the translation.
        localeInto: string
      |}
    |}
  |},
  // List of attachements to the post.
  attachments: ?Array<?{|
    // The ID of the object.
    id: string,
    // Any file that can be attached. A file metadata object, described by the Document object.
    document: ?{|
      // The ID of the object.
      id: string,
      // The filename title.
      title: ?string,
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string
    |}
  |}>,
  // The parent of a Post, if the Post is a reply to an existing Post. The Relay.Node ID type of the Post object.
  parentId: ?string,
  // A graphene Field containing the state of the publication of a certain post. The options are:
  // DRAFT,
  //
  // SUBMITTED_IN_EDIT_GRACE_PERIOD,
  //
  // SUBMITTED_AWAITING_MODERATION,
  //
  // PUBLISHED,
  //
  // MODERATED_TEXT_ON_DEMAND,
  //
  // MODERATED_TEXT_NEVER_AVAILABLE,
  //
  // DELETED_BY_USER,
  //
  // DELETED_BY_ADMIN,
  //
  // WIDGET_SCOPED
  //
  publicationState: ?PublicationStates
|};

export type FictionExtractFragment = {|
  // The ID of the object.
  id: string,
  // The date the Extract was created, in UTC timezone.
  creationDate: ?any,
  // A flag for importance of the Extract.
  important: ?boolean,
  // The body of text that is extracted from the post. This is not language dependent, but rather just unicode text.
  body: string,
  // The lang of the extract.
  lang: ?string,
  // The taxonomy (or classification) of the extracted body. The options are one of:
  //
  //
  // issue: The body of text is an issue.
  //
  // actionable_solution: The body of text is a potentially actionable solution.
  //
  // knowledge: The body of text is in fact knowledge gained by the community.
  //
  // example: The body of text is an example in the context that it was derived from.
  //
  // concept: The body of text is a high level concept.
  //
  // argument: The body of text is an argument for/against in the context that it was extracted from.
  //
  // cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.
  //
  //
  extractNature: ?string,
  // The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:
  //
  //
  // classify: This body of text should be re-classified by an priviledged user.
  //
  // make_generic: The body of text is a specific example and not generic.
  //
  // argument: A user must give more arguments.
  //
  // give_examples: A user must give more examples.
  //
  // more_specific: A user must be more specific within the same context.
  //
  // mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.
  //
  // display_multi_column: A priviledged user should activate the Mutli-Column view.
  //
  // display_thread: A priviledged user should activate the Thread view.
  //
  // display_tokens: A priviledged user should activate the Token Vote view.
  //
  // display_open_questions: A priviledged user should activate the Open Question view.
  //
  // display_bright_mirror: A priviledged user should activate the Bright Mirror view.
  //
  //
  extractAction: ?string,
  // A graphene Field containing the state of the extract. The options are:
  // SUBMITTED,
  //
  // PUBLISHED
  //
  extractState: ?ExtractStates,
  // A list of TextFragmentIdentifiers.
  textFragmentIdentifiers: ?Array<?{|
    // The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned.
    xpathStart: ?string,
    // The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
    // Often times the xpathEnd variable is the same as the xpathStart selector.
    xpathEnd: ?string,
    // The character offset index where an extract begins, beginning from index 0 in a string of text.
    offsetStart: ?number,
    // The character offset index where an extract ends in a string of text.
    offsetEnd: ?number
  |}>,
  // The AgentProfile object description of the creator.
  creator: ?{|
    // The ID of the object.
    id: string,
    // The unique database identifier of the User.
    userId: number,
    // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
    displayName: ?string,
    // A boolean flag that shows if the User is deleted.
    // If True, the User information is cleansed from the system, and the User can no longer log in.
    isDeleted: ?boolean,
    // A boolean flag describing if the User is a machine user or human user.
    isMachine: ?boolean,
    // The preferences of the User.
    preferences: ?{|
      // The harvesting Translation preference.
      harvestingTranslation: ?{|
        // The source locale of the translation.
        localeFrom: string,
        // The target locale of the translation.
        localeInto: string
      |}
    |}
  |},
  // A list of comment post related to an extract.
  comments: ?Array<?{|
    // The ID of the object.
    id: string,
    // A Body of the post (the main content of the post). in a given language.
    body: ?string,
    // The date that the object was created, in UTC timezone, in ISO 8601 format.
    creationDate: ?any,
    creator: ?{|
      // The ID of the object.
      id: string,
      // The unique database identifier of the User.
      userId: number,
      // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
      displayName: ?string,
      // A boolean flag that shows if the User is deleted.
      // If True, the User information is cleansed from the system, and the User can no longer log in.
      isDeleted: ?boolean,
      // A boolean flag describing if the User is a machine user or human user.
      isMachine: ?boolean,
      // The preferences of the User.
      preferences: ?{|
        // The harvesting Translation preference.
        harvestingTranslation: ?{|
          // The source locale of the translation.
          localeFrom: string,
          // The target locale of the translation.
          localeInto: string
        |}
      |}
    |},
    // List of attachements to the post.
    attachments: ?Array<?{|
      // The ID of the object.
      id: string,
      // Any file that can be attached. A file metadata object, described by the Document object.
      document: ?{|
        // The ID of the object.
        id: string,
        // The filename title.
        title: ?string,
        // A url to an image or a document to be attached.
        externalUrl: ?string,
        // The MIME-Type of the file uploaded.
        mimeType: ?string
      |}
    |}>,
    // The parent of a Post, if the Post is a reply to an existing Post. The Relay.Node ID type of the Post object.
    parentId: ?string,
    // A graphene Field containing the state of the publication of a certain post. The options are:
    // DRAFT,
    //
    // SUBMITTED_IN_EDIT_GRACE_PERIOD,
    //
    // SUBMITTED_AWAITING_MODERATION,
    //
    // PUBLISHED,
    //
    // MODERATED_TEXT_ON_DEMAND,
    //
    // MODERATED_TEXT_NEVER_AVAILABLE,
    //
    // DELETED_BY_USER,
    //
    // DELETED_BY_ADMIN,
    //
    // WIDGET_SCOPED
    //
    publicationState: ?PublicationStates
  |}>
|};

export type IdeaContentLinkFragment = {|
  // The Idea object associated with an IdeaContentLink.
  idea: ?{|
    // The ID of the object.
    id: string,
    // The title of the Idea, often shown in the Idea header itself.
    title: ?string,
    // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
    messageViewOverride: ?string
  |}
|};

export type ideaDataFragment = {
  // The Relay.Node ID type of the Idea object.
  parentId: ?string,
  // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
  messageViewOverride: ?string,
  // The order of the Idea, Thematic, Question in the idea tree.
  order: ?number,
  // The total number of active posts on that idea (excludes deleted posts).
  numPosts: ?number,
  // A list of possible languages of the entity as LangStringEntry objects. This is the Idea title in multiple languages.
  titleEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A list of possible languages of the entity as LangStringEntry objects. This is the description of the Idea in multiple languages.
  descriptionEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // Header image associated with the idea. A file metadata object, described by the Document object.
  img: ?{|
    // A url to an image or a document to be attached.
    externalUrl: ?string,
    // The MIME-Type of the file uploaded.
    mimeType: ?string,
    // The filename title.
    title: ?string
  |},
  // An Announcement object representing a summary of an Idea. This is often included in a header display of an Idea.
  announcement: ?{|
    // A list of possible languages of the entity as LangStringEntry objects. This is the title of announcement in multiple languages.
    titleEntries: Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A list of possible languages of the entity as LangStringEntry objects. This is the body of announcement in multiple languages.
    bodyEntries: Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A list of possible languages of the entity as LangStringEntry objects. This is the quote of the announcement in multiple languages.
    quoteEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A list of possible languages of the entity as LangStringEntry objects. This is the summry of the announcement in multiple languages.
    summaryEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>
  |},
  // A list of Question objects that are bound to the Thematic.
  questions: ?Array<?{|
    // The ID of the object.
    id: string,
    // A list of possible languages of the entity as LangStringEntry objects.
    titleEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>
  |}>,
  // A list of IdeaMessageColumn objects, if any set, on an Idea.
  messageColumns: ?Array<?{|
    // The ID of the object.
    id: string,
    // A CSS color that will be used to theme the column.
    color: ?string,
    // A Synthesis done on the column, of type Post.
    columnSynthesis: ?{|
      // The ID of the object.
      id: string,
      // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
      subjectEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>,
      // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
      bodyEntries: ?Array<?{|
        // The ISO 639-1 locale code of the language the content represents.
        localeCode: string,
        // The unicode encoded string representation of the content.
        value: ?string
      |}>
    |},
    // The order of the message column in the Idea/Thematic.
    index: ?number,
    // The unique classification identifier of the MessageColumn. All content who will be put under this column must have this classifer.
    messageClassifier: string,
    // A list of possible languages of the entity as LangStringEntry objects. The name of the column in multiple languages.
    nameEntries: Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A list of possible languages of the entity as LangStringEntry objects. The title of the column in multiple languages.
    titleEntries: Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>
  |}>
};

export type IdeaMessageColumnFragment = {|
  // A CSS color that will be used to theme the column.
  color: ?string,
  // A Synthesis done on the column, of type Post.
  columnSynthesis: ?{|
    // The ID of the object.
    id: string,
    // A Subject of the post in a given language.
    subject: ?string,
    // A Body of the post (the main content of the post). in a given language.
    body: ?string,
    // The SentimentType that the API calling User has on the Post, if any.
    mySentiment: ?SentimentTypes,
    // A list of SentimentCounts which counts each sentiment expressed. These include:
    //
    // Like,
    //
    // Agree,
    //
    // Disagree,
    //
    // Like,
    //
    // Don't Understand
    //
    // More Info
    //
    sentimentCounts: ?{|
      // The number of Sentiments disagreeing with the post.
      disagree: ?number,
      // The number of Sentiments expressing "dont_understand" on the Post.
      dontUnderstand: ?number,
      // The number of Sentiments expressed "like" on the post.
      like: ?number,
      // The number of Sentiments requesting "more_info" on the post.
      moreInfo: ?number
    |}
  |},
  // The order of the message column in the Idea/Thematic.
  index: ?number,
  // The unique classification identifier of the MessageColumn. All content who will be put under this column must have this classifer.
  messageClassifier: string,
  // A The name of the column in a given language.
  name: ?string,
  // The number of posts contributed to only this column.
  numPosts: ?number,
  // A The title of the column in a given language.
  title: ?string
|};

export type IdeaMessageColumnDataFragment = {|
  // The ID of the object.
  id: string,
  // A CSS color that will be used to theme the column.
  color: ?string,
  // A Synthesis done on the column, of type Post.
  columnSynthesis: ?{|
    // The ID of the object.
    id: string,
    // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
    subjectEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
    bodyEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>
  |},
  // The order of the message column in the Idea/Thematic.
  index: ?number,
  // The unique classification identifier of the MessageColumn. All content who will be put under this column must have this classifer.
  messageClassifier: string,
  // A list of possible languages of the entity as LangStringEntry objects. The name of the column in multiple languages.
  nameEntries: Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A list of possible languages of the entity as LangStringEntry objects. The title of the column in multiple languages.
  titleEntries: Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>
|};

export type langStringEntryFragment = {|
  // The ISO 639-1 locale code of the language the content represents.
  localeCode: string,
  // The unicode encoded string representation of the content.
  value: ?string
|};

export type MultilingualSynthesisPostFragment = {|
  // The ID of the object.
  id: string,
  // A graphene Field containing the state of the publication of a certain post. The options are:
  // DRAFT,
  //
  // SUBMITTED_IN_EDIT_GRACE_PERIOD,
  //
  // SUBMITTED_AWAITING_MODERATION,
  //
  // PUBLISHED,
  //
  // MODERATED_TEXT_ON_DEMAND,
  //
  // MODERATED_TEXT_NEVER_AVAILABLE,
  //
  // DELETED_BY_USER,
  //
  // DELETED_BY_ADMIN,
  //
  // WIDGET_SCOPED
  //
  publicationState: ?PublicationStates,
  // Graphene Field modeling a relationship to a published synthesis.
  publishesSynthesis: ?{|
    // The ID of the object.
    id: string,
    // The type of Synthesis to be created
    synthesisType: SynthesisTypes,
    // A list of possible languages of the entity as LangStringEntry objects. The subject in various languages.
    subjectEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // A list of possible languages of the entity as LangStringEntry objects. The body in various languages.
    bodyEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>,
    // This is a header image document object that will be visible on the Synthesis view's header.A file metadata object, described by the Document object.
    img: ?{|
      // The ID of the object.
      id: string,
      // The filename title.
      title: ?string,
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string
    |}
  |}
|};

export type PostFragment = {|
  // The ID of the object.
  id: string,
  // The internal database ID of the post.
  // This should never be used in logical computations, however, it exists to give the exact database id for use in sorting or creating classifiers for Posts.
  dbId: ?number,
  // A list of possible languages of the entity as LangStringEntry objects. The subject of the post in various languages.
  subjectEntries: ?Array<?{|
    // The unicode encoded string representation of the content.
    value: ?string,
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string
  |}>,
  // A list of possible languages of the entity as LangStringEntry objects. The body of the post in various languages.
  bodyEntries: ?Array<?{|
    // The unicode encoded string representation of the content.
    value: ?string,
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string
  |}>,
  // A list of SentimentCounts which counts each sentiment expressed. These include:
  //
  // Like,
  //
  // Agree,
  //
  // Disagree,
  //
  // Like,
  //
  // Don't Understand
  //
  // More Info
  //
  sentimentCounts: ?{|
    // The number of Sentiments disagreeing with the post.
    disagree: ?number,
    // The number of Sentiments expressing "dont_understand" on the Post.
    dontUnderstand: ?number,
    // The number of Sentiments expressed "like" on the post.
    like: ?number,
    // The number of Sentiments requesting "more_info" on the post.
    moreInfo: ?number
  |},
  // The SentimentType that the API calling User has on the Post, if any.
  mySentiment: ?SentimentTypes,
  // A list of IdeaContentLinks, which describe all of the connections the Post has with various Ideas.
  indirectIdeaContentLinks: ?Array<?{|
    // The Idea object associated with an IdeaContentLink.
    idea: ?{|
      // The ID of the object.
      id: string,
      // The title of the Idea, often shown in the Idea header itself.
      title: ?string,
      // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
      messageViewOverride: ?string
    |}
  |}>,
  creator: ?{|
    // The ID of the object.
    id: string,
    // The unique database identifier of the User.
    userId: number,
    // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
    displayName: ?string,
    // A boolean flag that shows if the User is deleted.
    // If True, the User information is cleansed from the system, and the User can no longer log in.
    isDeleted: ?boolean,
    // A boolean flag describing if the User is a machine user or human user.
    isMachine: ?boolean,
    // The preferences of the User.
    preferences: ?{|
      // The harvesting Translation preference.
      harvestingTranslation: ?{|
        // The source locale of the translation.
        localeFrom: string,
        // The target locale of the translation.
        localeInto: string
      |}
    |}
  |},
  // The User or AgentProfile who created the parent post.
  parentPostCreator: ?{|
    // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
    displayName: ?string
  |},
  // A boolean flag to say whether the post is modified or not.
  modified: ?boolean,
  // A ??? in a given language.
  bodyMimeType: string,
  // A graphene Field containing the state of the publication of a certain post. The options are:
  // DRAFT,
  //
  // SUBMITTED_IN_EDIT_GRACE_PERIOD,
  //
  // SUBMITTED_AWAITING_MODERATION,
  //
  // PUBLISHED,
  //
  // MODERATED_TEXT_ON_DEMAND,
  //
  // MODERATED_TEXT_NEVER_AVAILABLE,
  //
  // DELETED_BY_USER,
  //
  // DELETED_BY_ADMIN,
  //
  // WIDGET_SCOPED
  //
  publicationState: ?PublicationStates,
  // A list of IdeaContentLinks that are in fact Extracts on the Post. Extracts are valuable entities taken from
  extracts: ?Array<?{|
    // The ID of the object.
    id: string,
    // The date the Extract was created, in UTC timezone.
    creationDate: ?any,
    // A flag for importance of the Extract.
    important: ?boolean,
    // The body of text that is extracted from the post. This is not language dependent, but rather just unicode text.
    body: string,
    // The lang of the extract.
    lang: ?string,
    // The taxonomy (or classification) of the extracted body. The options are one of:
    //
    //
    // issue: The body of text is an issue.
    //
    // actionable_solution: The body of text is a potentially actionable solution.
    //
    // knowledge: The body of text is in fact knowledge gained by the community.
    //
    // example: The body of text is an example in the context that it was derived from.
    //
    // concept: The body of text is a high level concept.
    //
    // argument: The body of text is an argument for/against in the context that it was extracted from.
    //
    // cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.
    //
    //
    extractNature: ?string,
    // The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:
    //
    //
    // classify: This body of text should be re-classified by an priviledged user.
    //
    // make_generic: The body of text is a specific example and not generic.
    //
    // argument: A user must give more arguments.
    //
    // give_examples: A user must give more examples.
    //
    // more_specific: A user must be more specific within the same context.
    //
    // mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.
    //
    // display_multi_column: A priviledged user should activate the Mutli-Column view.
    //
    // display_thread: A priviledged user should activate the Thread view.
    //
    // display_tokens: A priviledged user should activate the Token Vote view.
    //
    // display_open_questions: A priviledged user should activate the Open Question view.
    //
    // display_bright_mirror: A priviledged user should activate the Bright Mirror view.
    //
    //
    extractAction: ?string,
    // A graphene Field containing the state of the extract. The options are:
    // SUBMITTED,
    //
    // PUBLISHED
    //
    extractState: ?ExtractStates,
    // A list of TextFragmentIdentifiers.
    textFragmentIdentifiers: ?Array<?{|
      // The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned.
      xpathStart: ?string,
      // The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
      // Often times the xpathEnd variable is the same as the xpathStart selector.
      xpathEnd: ?string,
      // The character offset index where an extract begins, beginning from index 0 in a string of text.
      offsetStart: ?number,
      // The character offset index where an extract ends in a string of text.
      offsetEnd: ?number
    |}>,
    // The AgentProfile object description of the creator.
    creator: ?{|
      // The ID of the object.
      id: string,
      // The unique database identifier of the User.
      userId: number,
      // How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined.
      displayName: ?string,
      // A boolean flag that shows if the User is deleted.
      // If True, the User information is cleansed from the system, and the User can no longer log in.
      isDeleted: ?boolean,
      // A boolean flag describing if the User is a machine user or human user.
      isMachine: ?boolean,
      // The preferences of the User.
      preferences: ?{|
        // The harvesting Translation preference.
        harvestingTranslation: ?{|
          // The source locale of the translation.
          localeFrom: string,
          // The target locale of the translation.
          localeInto: string
        |}
      |}
    |},
    // The list of tags of the extract.
    tags: ?Array<?{|
      // The ID of the object.
      id: string,
      // The value of the tag. This is not language dependent, but rather just unicode text.
      value: string
    |}>
  |}>,
  // List of attachements to the post.
  attachments: ?Array<?{|
    // The ID of the object.
    id: string,
    // Any file that can be attached. A file metadata object, described by the Document object.
    document: ?{|
      // The ID of the object.
      id: string,
      // The filename title.
      title: ?string,
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string
    |}
  |}>,
  // Keywords associated with the post, according to NLP engine.
  keywords: ?Array<?{|
    // The score associated with the tag (0-1, increasing relevance)
    score: ?number,
    // The number of times the tag was found
    count: ?number,
    // The tag keyword
    value: ?string
  |}>,
  // A list of abstract tags associated to the post.
  tags: ?Array<?{|
    // The ID of the object.
    id: string,
    // The value of the tag. This is not language dependent, but rather just unicode text.
    value: string
  |}>
|};

export type ResourceFragment = {|
  // A file attached to the ResourceA file metadata object, described by the Document object.
  doc: ?{|
    // A url to an image or a document to be attached.
    externalUrl: ?string,
    // The MIME-Type of the file uploaded.
    mimeType: ?string,
    // The filename title.
    title: ?string
  |},
  // The URL for any i-frame based content that matches the Content-Security-Policy of the server.
  // In effect, this is the "src" code inside of an iframe-based attachment to a Resource.
  embedCode: ?string,
  // The ID of the object.
  id: string,
  // An image attached to the ResourceA file metadata object, described by the Document object.
  image: ?{|
    // A url to an image or a document to be attached.
    externalUrl: ?string,
    // The MIME-Type of the file uploaded.
    mimeType: ?string,
    // The filename title.
    title: ?string
  |},
  text: ?string,
  title: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. The title of the Resource in various languages.
  titleEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A list of possible languages of the entity as LangStringEntry objects. The title of the Resource in various languages.
  textEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // The order of the Resource on the Resources Center page.A file metadata object, described by the Document object.
  order: ?number
|};

export type selectFieldFragment = {|
  // The ID of the object.
  id: string,
  // The unique identifier of the field.
  identifier: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
  titleEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A Text Field Label in a given language.
  title: ?string,
  // The position (order) of the Field compared to other Fields.
  order: ?number,
  // A flag indicating if the Field requires an input or not.
  required: ?boolean,
  // A flag indicating if the Field is hidden for the user or not.
  hidden: boolean,
  options: ?Array<?{|
    // The ID of the object.
    id: string,
    // The position (order) of the field.
    order: number,
    // A Text Field Label in a given language.
    label: ?string,
    // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
    labelEntries: ?Array<?{|
      // The ISO 639-1 locale code of the language the content represents.
      localeCode: string,
      // The unicode encoded string representation of the content.
      value: ?string
    |}>
  |}>
|};

export type SentimentCountsFragment = {|
  // The number of Sentiments disagreeing with the post.
  disagree: ?number,
  // The number of Sentiments expressing "dont_understand" on the Post.
  dontUnderstand: ?number,
  // The number of Sentiments expressed "like" on the post.
  like: ?number,
  // The number of Sentiments requesting "more_info" on the post.
  moreInfo: ?number
|};

export type SynthesisPostFragment = {|
  // The ID of the object.
  id: string,
  // Graphene Field modeling a relationship to a published synthesis.
  publishesSynthesis: ?{|
    // The ID of the object.
    id: string,
    // The type of Synthesis to be created
    synthesisType: SynthesisTypes,
    // The subject of the synthesis.
    subject: ?string,
    // The introduction of the synthesis.
    introduction: ?string,
    // The body of the full text synthesis.
    body: ?string,
    // The conclusion of the synthesis.
    conclusion: ?string,
    // The creation date of the synthesis.
    creationDate: ?any,
    // This is a header image document object that will be visible on the Synthesis view's header.A file metadata object, described by the Document object.
    img: ?{|
      // The ID of the object.
      id: string,
      // The filename title.
      title: ?string,
      // A url to an image or a document to be attached.
      externalUrl: ?string,
      // The MIME-Type of the file uploaded.
      mimeType: ?string
    |},
    // This is the list of ideas related to the synthesis.
    ideas: ?Array<?{
      // The ID of the object.
      id: string,
      // A list of Relay.Node ID's representing the parents Ideas of the Idea.
      ancestors: ?Array<?string>,
      // The title of the Idea, often shown in the Idea header itself.
      title: ?string,
      // A Synthesis title in a given language.
      synthesisTitle: ?string,
      // The IdeaUnion between an Idea or a Thematic. This can be used to query specific fields unique to the type of Idea.
      live: ?{
        // The ID of the object.
        id: string,
        // The order of the Idea, Thematic, Question in the idea tree.
        order: ?number,
        // The total number of active posts on that idea (excludes deleted posts).
        numPosts: ?number,
        // The total number of users who contributed to the Idea/Thematic/Question.
        //
        // Contribution is counted as either as a sentiment set, a post created.
        numContributors: ?number,
        // A list of IdeaMessageColumn objects, if any set, on an Idea.
        messageColumns: ?Array<?{|
          // A CSS color that will be used to theme the column.
          color: ?string,
          // A Synthesis done on the column, of type Post.
          columnSynthesis: ?{|
            // The ID of the object.
            id: string,
            // A Subject of the post in a given language.
            subject: ?string,
            // A Body of the post (the main content of the post). in a given language.
            body: ?string,
            // The SentimentType that the API calling User has on the Post, if any.
            mySentiment: ?SentimentTypes,
            // A list of SentimentCounts which counts each sentiment expressed. These include:
            //
            // Like,
            //
            // Agree,
            //
            // Disagree,
            //
            // Like,
            //
            // Don't Understand
            //
            // More Info
            //
            sentimentCounts: ?{|
              // The number of Sentiments disagreeing with the post.
              disagree: ?number,
              // The number of Sentiments expressing "dont_understand" on the Post.
              dontUnderstand: ?number,
              // The number of Sentiments expressed "like" on the post.
              like: ?number,
              // The number of Sentiments requesting "more_info" on the post.
              moreInfo: ?number
            |}
          |},
          // The order of the message column in the Idea/Thematic.
          index: ?number,
          // The unique classification identifier of the MessageColumn. All content who will be put under this column must have this classifer.
          messageClassifier: string,
          // A The name of the column in a given language.
          name: ?string,
          // The number of posts contributed to only this column.
          numPosts: ?number,
          // A The title of the column in a given language.
          title: ?string
        |}>,
        // Type of view for this idea: survey, thread, messageColumns, voteSession, brightMirror.
        messageViewOverride: ?string,
        // Header image associated with the idea. A file metadata object, described by the Document object.
        img: ?{|
          // A url to an image or a document to be attached.
          externalUrl: ?string
        |},
        // A list of all Posts under the Idea. These include posts of the subIdeas.
        posts: ?{|
          edges: Array<?{|
            // The item at the end of the edge
            node: ?{|
              // A list of SentimentCounts which counts each sentiment expressed. These include:
              //
              // Like,
              //
              // Agree,
              //
              // Disagree,
              //
              // Like,
              //
              // Don't Understand
              //
              // More Info
              //
              sentimentCounts: ?{|
                // The number of Sentiments expressed "like" on the post.
                like: ?number,
                // The number of Sentiments disagreeing with the post.
                disagree: ?number,
                // The number of Sentiments expressing "dont_understand" on the Post.
                dontUnderstand: ?number,
                // The number of Sentiments requesting "more_info" on the post.
                moreInfo: ?number
              |},
              // A graphene Field containing the state of the publication of a certain post. The options are:
              // DRAFT,
              //
              // SUBMITTED_IN_EDIT_GRACE_PERIOD,
              //
              // SUBMITTED_AWAITING_MODERATION,
              //
              // PUBLISHED,
              //
              // MODERATED_TEXT_ON_DEMAND,
              //
              // MODERATED_TEXT_NEVER_AVAILABLE,
              //
              // DELETED_BY_USER,
              //
              // DELETED_BY_ADMIN,
              //
              // WIDGET_SCOPED
              //
              publicationState: ?PublicationStates
            |}
          |}>
        |}
      }
    }>
  |}
|};

export type textFieldFragment = {|
  // The type of the field. The possible options are:
  //
  // TEXT
  //
  // EMAIL
  //
  // PASSWORD
  fieldType: string,
  // The ID of the object.
  id: string,
  // The unique identifier of the field.
  identifier: ?string,
  // A list of possible languages of the entity as LangStringEntry objects. The label in multiple languaes.
  titleEntries: ?Array<?{|
    // The ISO 639-1 locale code of the language the content represents.
    localeCode: string,
    // The unicode encoded string representation of the content.
    value: ?string
  |}>,
  // A Text Field Label in a given language.
  title: ?string,
  // The position (order) of the Field compared to other Fields.
  order: ?number,
  // A flag indicating if the Field requires an input or not.
  required: ?boolean,
  // A flag indicating if the Field is hidden for the user or not.
  hidden: boolean
|};

export type translationFragment = {|
  // The source locale of the translation.
  localeFrom: string,
  // The target locale of the translation.
  localeInto: string
|};
