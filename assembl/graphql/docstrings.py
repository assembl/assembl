# -*- coding:utf-8 -*-


class Default:
    required_language_input = """A locale input is required to specify in which language the content should be returned."""
    langstring_entries = """A list of possible languages of the entity as LangStringEntry objects. %s"""
    document = """%sA file metadata object, described by the Document object."""
    string_entry = """A %s in a given language."""
    float_entry = """A %s as a float"""
    node_id = """The Relay.Node ID type of the %s object."""
    creation_date = "The date that the object was created, in UTC timezone, in ISO 8601 format."
    object_id = """The SQLALCHEMY ID of the %s object."""
    phase_identifier = """The phase identifier. Could be one of:\n
    \"survey\"\n
    \"thread\"\n
    \"multiColumns\"\n
    \"voteSession\"\n
    \"brightMirror\"\n
    """
    discussion_phase_id = "The database id of a discussion phase."


class Schema:
    __doc__ = """The platform's Schema describing the core functionalities."""
    node = """A Relay node. Any entity that uses the Relay object structure, along with connections (edges), can be queried from Node."""
    root_idea = """An idea union between either an Idea type or a Thematic type."""
    ideas = """List of all ideas on the debate."""
    syntheses = """A list of all syntheses on the debate."""
    num_participants = """The number of active participants on the debate with any form of contribution."""
    discussion_preferences = """
        The dicussion preferences of the debate.
        These are configurations that characterize how the debate will behave, look, and act under certain conditions."""
    default_preferences = """The default discussion preferences. These are server wide settings, independent of the debate."""
    locales = """The list of locales supported on the debate. These are the languages of the debate."""
    total_sentiments = """The total count of sentiments on the debate, regardless of chosen type. Deleted users' sentiments are not counted."""
    has_syntheses = """A boolean flag indicating if the debate has yet released a synthesis or not."""
    vote_session = """A vote session's meta data, if a vote session exists."""
    resources = """A list of Resource meta data on the debate."""
    resources_center = """A singular Resource Center meta data object."""
    has_resources_center = """A boolean flag indicating if the debate has a resource center set or not."""
    sections = """A list of Section meta data on the discussion."""
    legal_contents = """The legal contents metadata representing the data."""
    has_legal_notice = """A boolean flag of whether a debate has set a legal notice."""
    has_terms_and_conditions = """A boolean flag of whether a debate has set terms and conditions."""
    has_cookies_policy = """A boolean flag of whether a debate has set a cookie policy."""
    has_privacy_policy = """A boolean flag of whether a debate has set a privacy policy."""
    has_user_guidelines = """A boolean flag of whether a debate has set user guidelines."""
    visits_analytics = """The object containing the summary data of analytics on the page, based on time-series analysis of analytics engine data."""
    discussion = """The discussion object metadata."""
    landing_page_module_types = """The metadata object for LandingPageModule object."""
    landing_page_modules = """A list of LandingPageModules."""
    text_fields = """A list of ConfigurableField union, where each text field represents a field on a bound entity."""
    profile_fields = """A list of ConfigurableField union, where each text field represents a field on a profile only."""
    timeline = """A list of DiscussionPhase objects, descriping the timeline objects on the debate."""


class SchemaPosts:
    __doc__ = """The list of posts contained in the phases with the specified identifiers and modified between specified start date and the specified end date"""
    start_date = "A date representing a temporal filter. Only the posts modified after this date will be selected."
    end_date = "A date representing a temporal filter. Only the posts modified before this date will be selected."
    identifiers = "A list of phase identifiers. " + Default.phase_identifier


class Discussion:
    __doc__ = """The Discussion object. This object describes certain parts of the core state of the debate."""
    id = Default.object_id % ("Discussion",)
    homepage_url = """A URL for the homepage (optional). Often placed on the logo."""
    title = """The title of the discussion, in the language specified by the input"""
    subtitle = """The subtitle of the discussion, in the language specified by the input"""
    button_label = """The value inside of the participation button in the landing page."""
    header_image = Default.document % ("The file representing the header of the landing page. ", )
    logo_image = Default.document % ("The file representing the logo of the debate. ", )
    slug = """A string used to form the URL of the discussion."""


class UpdateDiscussion:
    __doc__ = """The mutation that allows to update an existing Discussion object"""
    header_image = Default.document % ("The header image that will be viewed on the discussion's landing page. ",)
    logo_image = Default.document % ("The smalller logo image that will be viewed on the discussion's navigation bar. ",)
    button_label_entries = """The contents inside of the \"follow\" button in the landing page."""
    title_entries = """The title contents shown on the landing page of a discussion, just above the \"follow\" button. """
    subtitle_entries = """The subtitle contents shown on the landing page of a discussion, just above the \"follow\" button, under the title content. """


class LangString:
    value = """The unicode encoded string representation of the content."""
    locale_code = """The ISO 639-1 locale code of the language the content represents."""
    translated_from_locale_code = """The ISO 639-1 locale code of the original content represented by the translated content presented."""
    supposed_understood = "A boolean that specifies if the language presented is understood by the user or not."
    error_code = "The error code thrown by the translation service when translating an entity. Could be null if no error occurs."


class LocalePreference:
    __doc__ = """The locale stored in the Discussion Preferences metadata object."""
    locale = """The ISO 639-1 language string of the locale. Ex. \'"fr"\'. """
    name = """The name of the locale, in the language of the locale given. Ex. French, if the given locale is \'"en"\'."""
    native_name = """The name of the locale, in the original language. Ex Français."""


class DiscussionPreferences:
    __doc__ = """A discussion can have many preferences. This metadata object describes these preferences."""
    languages = """A list of LocalePreference metadata objects on the discussion which describe the languages supported by the debate."""
    tab_title = """The title in the tab."""
    favicon = Default.document % ("""The site favicon.""",)


class ResourcesCenter:
    __doc__ = """A Resource Center is a place where discussion related data can be stored for all to access. There can be zero or more
    Resource Centers created per discussion by a discussion administrator, and can be viewed by all members of the debate."""
    title = """The name of the resource center in a specific language."""
    title_entries = """The name of the resource center in all available languages"""
    header_image = Default.document % ("""The main image associated with the resource center""",)


class LegalContents:
    __doc__ = """The pages where you can see the legal informations regarding a debate."""
    legal_notice = Default.string_entry % ("Legal Notice",)
    terms_and_conditions = Default.string_entry % ("Terms and Conditions",)
    legal_notice_entries = Default.langstring_entries % ("",)
    terms_and_conditions_entries = Default.langstring_entries % ("",)
    cookies_policy = Default.string_entry % ("Cookie Policy",)
    privacy_policy = Default.string_entry % ("Privacy Policy",)
    cookies_policy_entries = Default.langstring_entries % ("",)
    privacy_policy_entries = Default.langstring_entries % ("",)
    user_guidelines = Default.string_entry % ("User Guidelines",)
    user_guidelines_entries = Default.langstring_entries % ("",)


class UpdateResourcesCenter:
    __doc__ = """The mutation that allows to update existing Resource Center objects."""
    title_entries = Default.string_entry
    header_image = Default.document % ("""Update the main image associated with a ResourceCenter. """,)


class UpdateDiscussionPreferences:
    __doc__ = """A way to save Discussion Preferences on a debate."""
    languages = """The list of languages in ISO 639-1 locale code that the debate should support."""
    tab_title = DiscussionPreferences.tab_title
    favicon = DiscussionPreferences.favicon


class UpdateLegalContents:
    __doc__ = """A mutation to update the Legal Contents of a debate."""
    legal_notice_entries = Default.langstring_entries % ("This is the list of all Legal Notices in various languages.",)
    terms_and_conditions_entries = Default.langstring_entries % ("This is the list of all Terms and Conditions in various languages.",)
    cookies_policy_entries = Default.langstring_entries % ("This is the list of all Cookie Policies in various languages.",)
    privacy_policy_entries = Default.langstring_entries % ("This is the list of all Privay Policies in various languages.",)
    user_guidelines_entries = Default.langstring_entries % ("This is the list of all User Guidelines in various languages.",)


class VisitsAnalytics:
    __doc__ = """This object describes the analytics data gathered on the debate throughout its total lifecycle. The analytics is carried out
    by Matomo (formerly known as Piwik), an open-source anaytics engine."""
    sum_visits_length = """The total number of hours spent on the platform by all users."""
    nb_pageviews = """The total number of page views accumulated."""
    nb_uniq_pageviews = """The total number of unique page views."""


class Synthesis:
    __doc__ = """Class to model the synthesis of a discussion. A synthesis is one of the core features of Assembl that a debate administrator
    uses to synthesize the main ideas of a debate. It has an introduction and a conclusion"""
    id = Default.object_id % ("Synthesis",)
    subject = """The subject of the synthesis."""
    subject_entries = Default.langstring_entries % ("The subject in various languages.",)
    introduction = """The introduction of the synthesis."""
    introduction_entries = Default.langstring_entries % ("The introduction in various languages.",)
    conclusion = """The conclusion of the synthesis."""
    conclusion_entries = Default.langstring_entries % ("This is the conclusion of the synthesis in different languages.",)
    ideas = """This is the list of ideas related to the synthesis."""
    img = Default.document % ("""The img field is a header image URL/document object that will be visible on the Synthesis view's header.""")
    creation_date = """The creation date of the synthesis."""
    post = """Synthesis post to be created."""


class TextFragmentIdentifier:
    __doc__ = """A text fragment metadata that describes the positioning of the fragment both in the DOM and its position in the string of text."""
    xpath_start = """The xPath selector starting point in the DOM, representing where the string text that the fragment is held is positioned."""
    offset_start = """The character offset index where an extract begins, beginning from index 0 in a string of text."""
    xpath_end = """The xPath selector ending point in the DOM, representing where the string text that the fragment is held is positioned.
    Often times the xpathEnd variable is the same as the xpathStart selector."""
    offset_end = """The character offset index where an extract ends in a string of text."""


class ExtractInterface:
    __doc__ = """An Extract is an extraction of text from a post which is deemed to be important by a priviledged user."""
    body = """The body of text that is extracted from the post. This is not language dependent, but rather just unicode text."""
    important = """A flag for importance of the Extract."""
    extract_nature = """The taxonomy (or classification) of the extracted body. The options are one of:\n\n
        issue: The body of text is an issue.\n
        actionable_solution: The body of text is a potentially actionable solution.\n
        knowledge: The body of text is in fact knowledge gained by the community.\n
        example: The body of text is an example in the context that it was derived from.\n
        concept: The body of text is a high level concept.\n
        argument: The body of text is an argument for/against in the context that it was extracted from.\n
        cognitive_bias: The body of text, in fact, has cognitive bias in the context it was extracted from.\n
    """
    extract_action = """The taxonomy (or classification) of the actions that can be taken from the extracted body. The options are one of:\n\n
        classify: This body of text should be re-classified by an priviledged user.\n
        make_generic: The body of text is a specific example and not generic.\n
        argument: A user must give more arguments.\n
        give_examples: A user must give more examples.\n
        more_specific: A user must be more specific within the same context.\n
        mix_match: The body of text has relevancy in another section of the deabte. These should be mixed and matched to create greater meaning.\n
        display_multi_column: A priviledged user should activate the Mutli-Column view.\n
        display_thread: A priviledged user should activate the Thread view.\n
        display_tokens: A priviledged user should activate the Token Vote view.\n
        display_open_questions: A priviledged user should activate the Open Question view.\n
        display_bright_mirror: A priviledged user should activate the Bright Mirror view.\n
    """
    extract_state = """A graphene Field containing the state of the extract. The options are:
    SUBMITTED,\n
    PUBLISHED\n"""
    text_fragment_identifiers = """A list of TextFragmentIdentifiers."""
    creation_date = """The date the Extract was created, in UTC timezone."""
    creator_id = """The id of the User who created the extract."""
    creator = """The AgentProfile object description of the creator."""
    lang = """The lang of the extract."""


class PostExtract:
    post_id = Default.node_id % ("Post")
    body = ExtractInterface.body
    xpath_start = TextFragmentIdentifier.xpath_start
    xpath_end = TextFragmentIdentifier.xpath_end
    offset_start = TextFragmentIdentifier.offset_start
    offset_end = TextFragmentIdentifier.offset_end
    lang = """The lang of the extract."""


class AddPostsExtract:
    __doc__ = """A mutation to add a list of Extracts."""
    extracts = """A list of PostExtract"""
    extract_nature = ExtractInterface.extract_nature
    extract_state = ExtractInterface.extract_state
    status = """A Boolean of whether the extracts was successfully added or not."""


class UpdateExtract:
    __doc__ = """A mutation to update an existing extract."""
    extract_id = """The Relay.Node ID type of the Extract object to the updated."""
    idea_id = """The Relay.Node ID type of the Idea object associated to the Extract."""
    important = ExtractInterface.important
    extract_nature = ExtractInterface.extract_nature
    extract_action = ExtractInterface.extract_action
    body = ExtractInterface.body


class DeleteExtract:
    extract_id = UpdateExtract.extract_id
    success = """A Boolean of whether the extract was successfully saved or not."""


class ConfirmExtract:
    extract_id = UpdateExtract.extract_id
    success = """A Boolean of whether the extract was successfully confirmed or not."""


class Locale:
    __doc__ = """The Locale object describing the language model."""
    locale_code = """The ISO 639-1 locale code of the language of choice."""
    label = """The name of the locale, in a specifically given language."""


class Video:
    __doc__ = """The Video subsection in an Idea (or Thematic). This object describes the contents surrounding the video module."""
    title = Default.string_entry % ("Title of the video.")
    description_top = Default.string_entry % ("Description on top side of the video.")
    description_bottom = Default.string_entry % ("Description on bottom side of the video.")
    description_side = Default.string_entry % ("Description on one of the sides of the video.")
    html_code = "HTML Code to add extra content in the video module section to be injected."
    media_file = "File (image or video) to use in the video module section."
    title_entries = Default.langstring_entries % ("Title of the video in various languages.")
    description_entries_top = Default.langstring_entries % ("Description on the top of the video in various languages.")
    description_entries_bottom = Default.langstring_entries % ("Description on the bottom of the video in various languages.")
    description_entries_side = Default.langstring_entries % ("Description on the side of the video in various languages.")


class VoteResults:
    __doc__ = """The metadata describing the resulting votes on a Thematic or Idea."""
    num_participants = """The count of participants on the vote session."""
    participants = """The list of users who participated on the vote session. The length of the list matches the number of participants."""


class IdeaInterface:
    __doc__ = """An Idea or Thematic is an object describing a classification or cluster of discussions on a debate.
    Ideas, like Posts, can be based on each other."""
    title = "The title of the Idea, often shown in the Idea header itself."
    title_entries = Default.langstring_entries % ("This is the Idea title in multiple languages.",)
    description = "The description of the Idea, often shown in the header of the Idea."
    description_entries = Default.langstring_entries % ("This is the description of the Idea in multiple languages.",)
    num_posts = "The total number of active posts on that idea (excludes deleted posts)."
    num_total_posts = "The total number of posts on that idea and on all its children ideas."
    num_contributors = """The total number of users who contributed to the Idea/Thematic/Question.\n
    Contribution is counted as either as a sentiment set, a post created."""
    num_children = "The total number of children ideas (called \"subideas\") on the Idea or Thematic."
    img = Default.document % "Header image associated with the idea. "
    order = "The order of the Idea, Thematic, Question in the idea tree."
    live = """The IdeaUnion between an Idea or a Thematic. This can be used to query specific fields unique to the type of Idea."""
    message_view_override = """Use a non-standard view for this idea.\nCurrently only supporting "messageColumns" and "brightMirror"."""
    total_sentiments = "Total number of sentiments expressed by participants on posts related to that idea."
    vote_specifications = """The VoteSpecificationUnion placed on the Idea. This is the metadata describing the configuration of a VoteSession."""
    type = """The type of the idea. The class name of the idea."""


class IdeaAnnouncement:
    __doc__ = """The metadata object describing an announcement banner on an Idea.
    An announcement is visible in the header of every Idea."""
    title = Default.string_entry % ("title of announcement")
    body = Default.string_entry % ("body of announcement")
    title_entries = Default.langstring_entries % ("This is the title of announcement in multiple languages.",)
    body_entries = Default.langstring_entries % ("This is the body of announcement in multiple languages.")


class IdeaMessageColumn:
    __doc__ = """The metadata object describing a single MessageColumn. Once a Thematic or Idea has a MessageColumn,
    the entity is under the message mode."""
    message_classifier = "The unique classification identifier of the MessageColumn. All content who will be put under this column must have this classifer."
    color = "The CSS based RGB HEX code of the theme colour chosen for this column."
    index = """The order of the message column in the Idea/Thematic."""
    idea = """The Idea/Thematic that the message column is associated with."""
    name = Default.string_entry % ("The name of the column")
    title = Default.string_entry % ("The title of the column")
    column_synthesis = """A Synthesis done on the column, of type Post."""
    num_posts = """The number of posts contributed to only this column."""


class Idea:
    __doc__ = """An Idea metadata object represents the configuration and classification of on idea that has grown from the debate.
    All ideas are currently created under a RootIdea, and Ideas can have subidea trees, Thematics and Questions associated to them."""
    id = Default.object_id % ("Idea",)
    synthesis_title = Default.string_entry % ("Synthesis title",)
    children = """A list of all immediate child Ideas on the Idea, exluding any hidden Ideas. The RootIdea will not be shown here, for example.
    The subchildren of each subIdea is not shown here."""
    parent_id = Default.node_id % ("Idea",)
    posts = """A list of all Posts under the Idea. These include posts of the subIdeas."""
    contributors = """A list of participants who made a contribution to the idea by creating a post.
    A participant who only made a sentiment is not included."""
    announcement = """An Announcement object representing a summary of an Idea. This is often included in a header display of an Idea."""
    message_columns = """A list of IdeaMessageColumn objects, if any set, on an Idea."""
    ancestors = """A list of Relay.Node ID's representing the parents Ideas of the Idea."""
    vote_results = """The VoteResult object showing the status and result of a VoteSession on Idea."""


class Question:
    __doc__ = """A Question is a subtype of a Thematic, where each Thematic can ask multiple Questions in the Survey Phase.
    Each Question can have many Posts associated to it as a response."""
    id = Default.object_id % ("Question",)
    num_posts = IdeaInterface.num_posts
    num_contributors = IdeaInterface.num_contributors
    title = """The Question to be asked itself, in the language given."""
    title_entries = Default.langstring_entries % ("")
    posts = """The list of all posts under the Question."""
    thematic = """The Thematic that the Question is categorized under. A Question, in the end, is an Idea type, as well as a Thematic."""
    total_sentiments = """The count of total sentiments """


class QuestionInput:
    id = """Id of the question input."""
    title_entries = Default.langstring_entries % ("Title of the question in various languages.")


class VideoInput:
    title_entries = Default.langstring_entries % ("Title of the video in various languages.")
    description_entries_top = Default.langstring_entries % ("Description on the top of the video in various languages.")
    description_entries_bottom = Default.langstring_entries % ("Description on the bottom of the video in various languages.")
    description_entries_side = Default.langstring_entries % ("Description on the side of the video in various languages.")
    html_code = "HTML Code to add extra content in the video module section to be injected."
    media_file = "File (image or video) to use in the video module section."


class Thematic:
    __doc__ = """A Thematic is an Idea that exists under the Survey Phase of a debate.
    Thematics differ slightly from Ideas because Thematics' subideas are Questions."""
    questions = """A list of Question objects that are bound to the Thematic."""
    video = """A Video objet that is often integrated to the header of a Thematic."""


class CreateThematic:
    __doc__ = """A mutation to create a new thematic."""
    title_entries = IdeaInterface.title_entries
    description_entries = IdeaInterface.description_entries
    discussion_phase_id = Default.discussion_phase_id
    video = Thematic.video
    questions = Thematic.questions
    image = Default.document % ("An Image to be shown in the Thematic. ")
    order = Default.float_entry % (" Order of the thematic.")


class UpdateThematic:
    __doc__ = "A mutation to update a thematic."
    id = Default.node_id % ("Thematic") + " The identifier of the Thematic to be updated."
    title_entries = CreateThematic.title_entries
    description_entries = CreateThematic.description_entries
    video = CreateThematic.video
    questions = CreateThematic.questions
    image = CreateThematic.image
    order = CreateThematic.order


class DeleteThematic:
    __doc__ = """A mutation to delete a thematic."""
    thematic_id = Default.node_id % ("Thematic") + " An identifier of the Thematic to be deleted."


class LandingPageModuleType:
    __doc__ = """The metadata description of the types of modules (or sections) available in the landing page."""
    default_order = """The default order of this LandingPageModuleType in the context of the landing page."""
    editable_order = """A boolean flag indicating whether the LandingPageModuleType's order can be editeded or not."""
    identifier = """The unique ID of the module type. These can be one of:\n\n
        HEADER: The header section of the landing page.\n
        INTRODUCTION: The introduction section.\n
        TIMELINE: The list of timelines present in the debate.\n
        FOOTER: The footer in the landing page, including information such as privacy policies, etc..\n
        TOP_THEMATICS: The section hosting the top active thematics.\n
        TWEETS: The tweets section, displaying top tweets in the landing page.\n
        CHATBOT: The chatbot section, according to the configured chatbot.\n
        CONTACT: The contacts section.\n
        NEWS: The latest news section, as configured.\n
        DATA: The data sections.\n
        PARTNERS: The partners section, highlighting the contributing partners' logos.\n
    """
    required = """A Boolean flag defining if the section is required for the landing page or not."""
    title = """The title of the section."""
    title_entries = Default.langstring_entries % ("The Title will be available in every supported language.",)


class LandingPageModule:
    __doc__ = """The LandingPageModule configurations for the debate."""
    # TODO: Add more to the configuration description
    configuration = """The JSON-based configuration of the LandingPageModule in the debate."""
    order = """The order of the Module in the entire LandingPage."""
    enabled = """Whether the Module is activated or not."""
    module_type = """The LandingPageModuleType describing the Module."""
    exists_in_database = """A flag describign whether the module already exists in the database or not."""


class CreateLandingPageModule:
    __doc__ = """A mutation that allows for the creation of the LandingPageModule."""
    type_identifier = LandingPageModuleType.identifier
    enabled = LandingPageModule.enabled
    order = LandingPageModule.order
    configuration = LandingPageModule.configuration
    landing_page_module = """A LandingPageModules that is associated to the debate."""


class UpdateLandingPageModule:
    __doc__ = """A mutation that allows for updating an existing LandingPageModule."""
    id = Default.node_id % "LandingPageModule"
    enabled = LandingPageModule.enabled
    order = LandingPageModule.order
    configuration = LandingPageModule.configuration
    landing_page_module = CreateLandingPageModule.landing_page_module


class PostAttachment:
    __doc__ = "The Attachment object associated with a Post."
    document = Default.document % ("Any file that can be attached to a Post. ")


class IdeaContentLink:
    __doc__ = "An object representing a link between an Idea and a Post type (of any kind - there are multiple types of Posts)."
    idea_id = "The database identifier of the Idea that is linked to a Post."
    post_id = "The database identifier of the Post that is linked to an Idea."
    creator_id = "The database identifier of the participant who created the link."
    type = """The type of the IdeaContentLink. Can be one of:\n
    IdeaContentLink\n
    IdeaContentPositiveLink\n
    IdeaContentWidgetLink\n
    IdeaRelatedPostLink\n
    IdeaContentNegativeLink\n
    IdeaThreadContextBreakLink\n
    Extract\n\n
    Note that the most commonly faced IdeaContentLink in the wild is the IdeaRelatedPostLink.
    """
    idea = "The Idea object associated with an IdeaContentLink."
    post = "The Post object associated with an IdeaContentLink."
    creator = "The User or AgentProfile who created the link."
    creation_date = Default.creation_date


class PostInterface:
    __doc__ = "A Post object, representing a contribution made by a user."
    creator = "The User object who created the Post entity."
    message_classifier = "The classification ID for a Post that is under a column view. The classifer must match the identifier of a message column."
    creation_date = Default.creation_date
    modification_date = "Date of the modification of the post, if any."
    subject = Default.string_entry % ("Subject of the post")
    body = Default.string_entry % ("Body of the post (the main content of the post).")
    subject_entries = Default.langstring_entries % ("The subject of the post in various languages.")
    body_entries = Default.langstring_entries % ("The body of the post in various languages.")
    sentiment_counts = """A list of SentimentCounts which counts each sentiment expressed. These include:\n
    Like,\n
    Agree,\n
    Disagree,\n
    Like,\n
    Don't Understand\n
    More Info\n"""
    my_sentiment = "The SentimentType that the API calling User has on the Post, if any."
    indirect_idea_content_links = "A list of IdeaContentLinks, which describe all of the connections the Post has with various Ideas."
    extracts = "A list of IdeaContentLinks that are in fact Extracts on the Post. Extracts are valuable entities taken from"
    parent_id = """The parent of a Post, if the Post is a reply to an existing Post. """ + Default.node_id % ("Post")
    db_id = """The internal database ID of the post.
    This should never be used in logical computations, however, it exists to give the exact database id for use in sorting or creating classifiers for Posts."""
    body_mime_type = Default.string_entry % "???"
    publication_state = """A graphene Field containing the state of the publication of a certain post. The options are:
    DRAFT,\n
    SUBMITTED_IN_EDIT_GRACE_PERIOD,\n
    SUBMITTED_AWAITING_MODERATION,\n
    PUBLISHED,\n
    MODERATED_TEXT_ON_DEMAND,\n
    MODERATED_TEXT_NEVER_AVAILABLE,\n
    DELETED_BY_USER,\n
    DELETED_BY_ADMIN,\n
    WIDGET_SCOPED\n"""
    attachments = "List of attachements to the post."
    original_locale = Default.string_entry % ("Locale in which the original message was written.")
    publishes_synthesis = "Graphene Field modeling a relationship to a published synthesis."
    type = """The type of the post. The class name of the post."""
    discussion_id = """The database identifier of the Discussion."""
    modified = """A boolean flag to say whether the post is modified or not."""
    parent_post_creator = "The User or AgentProfile who created the parent post."


class Post:
    __doc__ = PostInterface.__doc__
    message_id = "The email-compatible message-id for the Post."


class CreatePost:
    __doc__ = "A mutation which enables the creation of a Post."
    subject = PostInterface.subject
    body = PostInterface.body
    idea_id = Default.node_id % ("Idea")
    # A Post (except proposals in survey phase) can reply to another post.
    # See related code in views/api/post.py
    parent_id = PostInterface.parent_id
    attachments = PostInterface.attachments
    message_classifier = PostInterface.message_classifier
    publication_state = PostInterface.publication_state


class UpdatePost:
    __doc__ = "A mutation called when a Post is updated."
    post_id = Default.node_id % ("Post") + " The identifier of the Post to be updated."
    subject = "The subject of Post, updated in the original langauge of the Post."
    body = Default.string_entry % ("Post body") + " This is just a string input, and will update the original language body of the Post."
    attachments = "A list of Attachments to be appended to the Post."
    publication_state = PostInterface.publication_state


class DeletePost:
    __doc__ = "A mutation to delete a Post."
    post_id = Default.node_id % "Post" + " This is the Post identifier that is to be deleted."


class UndeletePost:
    __doc__ = "A mutation called to resurrect Post after being deleted."
    post_id = Default.node_id % "Post" + " This is the Post identifier that is to be resurrected."


class AddPostAttachment:
    __doc__ = "A mutation to add Attachment to a Post."
    post_id = Default.node_id % ("Post") + " The identifier of the Post that the Attachment will be connected to."
    file = "The path of the file to be attached."


class DeletePostAttachment:
    post_id = Default.node_id % ("Post") + " The identifier of the Post that the Attachment will be deleted from."
    attachment_id = "The database identifier of the Attachement to be deleted."


class AddPostExtract:
    __doc__ = "A mutation to harvest an Extract from a Post."
    post_id = Default.node_id % ("Post")
    body = "The body of text defined in this Extract on the Post."
    important = "An optional boolean to set the extract as a nugget. The default is False."
    lang = """The lang of the extract."""
    xpath_start = TextFragmentIdentifier.xpath_start
    xpath_end = TextFragmentIdentifier.xpath_end
    offset_start = TextFragmentIdentifier.offset_start
    offset_end = TextFragmentIdentifier.offset_end


class Document:
    __doc__ = """An object representing a File of an Attachment.
    In most cases, a Document is used in an Attachement to a Post, Idea, Thematic, Synthesis, etc"""
    title = "The filename title."
    mime_type = "The MIME-Type of the file uploaded."
    external_url = "A url to an image or a document to be attached."
    av_checked = """Antivirus check status of the File, for servers that support Anti-Virus filtering. The possible options are:\n
    \"unchecked\": The AV did not make a check on this file.\n
    \"passed\": The AV did a pass on this file, and it passed AV check.\n
    \"failed\": The AV did a pass on this file, and the file failed the AV check. Under this condition, the file would not be touched or
    accessed by the application.\n"""


class UploadDocument:
    __doc__ = "A mutation allowing the uploading of a File object."
    file = "The File to be uploaded. This is a byte-stream Blob object, represented in the front-end by the MDN File object format."


class SentimentCounts:
    __doc__ = """An object containing the number of Sentiments expressed on a specific Post.
    There are four Sentiments: "dont_understand", "disagree", "like", "more_info"."""
    dont_understand = """The number of Sentiments expressing "dont_understand" on the Post."""
    disagree = """The number of Sentiments disagreeing with the post."""
    like = """The number of Sentiments expressed "like" on the post."""
    more_info = """The number of Sentiments requesting "more_info" on the post."""


class AddSentiment:
    __doc__ = """A mutation that allows for Sentiments to be added to a Post by the API-calling User."""
    post_id = Default.node_id % ("Post") + " A User can only add one sentiment per post."
    type = """The Type of the Sentiment to be expressed on the Post. There are four options:\n
    LIKE\n
    DISAGREE\n
    DONT_UNDERSTAND\n
    MORE_INFO\n"""


class DeleteSentiment:
    __doc__ = """A mutation to delete the Sentiment by the API-calling User on a particular Post."""
    post_id = Default.node_id % ("Post")


class DiscussionPhase:
    __doc__ = """Assembl has four possible phases:\n
    survey: A divergence Phase, where Thematics are created, and Questions under each Thematic are asked\n
    thread: A second divergence Phase, where Ideas are created, and discussions occur under Ideas
    Under this phase, an Idea can be a regular threaded discussion, or an Idea under multi-columns\n
    multiColumns: This is a convergence Phase, as there is one major Idea in the Phase, which is under multi-column\n
    voteSession: This is another convergence Phase, as there is one major Idea in the Phase, and the Idea is under a VoteSession."""
    identifier = """Identifier of the Phase. Possible phase identifiers: \"survey\", \"thread\", \"multiColumns\", \"voteSession\", \"brightMirror\"."""
    is_thematics_table = "NOTE: THIS IS AN UNUSED VARIABLE CURRENTLY!"
    title = Default.string_entry % ("title of the Phase.")
    title_entries = Default.langstring_entries % ("These are the title of the phase in various languages.")
    description = Default.string_entry % ("description of the Phase.")
    description_entries = Default.langstring_entries % ("These are the description of the phase in various languages.")
    start = "An ISO 8601, UTC timezoned time representing the starting date of the phase."
    end = "An ISO 8601, UTC timezoned time representing the ending date of the phase."
    image = Default.document % ("The image displayed on the phase.")
    order = Default.float_entry % ("Order of the phase in the Timeline.")


class CreateDiscussionPhase:
    __doc__ = "A mutation that enables the creation of a DiscussionPhase."
    lang = Default.required_language_input
    identifier = DiscussionPhase.identifier
    is_thematics_table = DiscussionPhase.is_thematics_table
    title_entries = DiscussionPhase.title_entries
    start = DiscussionPhase.start
    end = DiscussionPhase.end
    order = DiscussionPhase.order


class UpdateDiscussionPhase:
    __doc__ = "A mutation that enables the updating of an existing DiscussionPhase."
    id = Default.node_id % ("DiscussionPhase")
    is_thematics_table = DiscussionPhase.is_thematics_table
    lang = CreateDiscussionPhase.lang
    identifier = DiscussionPhase.identifier
    title_entries = DiscussionPhase.title_entries
    description_entries = DiscussionPhase.description_entries
    start = DiscussionPhase.start
    end = DiscussionPhase.end
    image = DiscussionPhase.image
    order = DiscussionPhase.order


class DeleteDiscussionPhase:
    __doc__ = "A mutation that enabled the removal of an existing DiscussionPhase."
    id = Default.node_id % ("DiscussionPhase")


class Translation:
    __doc__ = "A translation from a locale into an other locale."
    locale_from = "The source locale of the translation."
    locale_into = "The target locale of the translation."


class Preferences:
    __doc__ = "The user preferences for a discussion"
    harvesting_translation = "The harvesting Translation preference."


class UpdateHarvestingTranslationPreference:
    __doc__ = "A mutation to save harversting translation preferences"
    id = Default.object_id % ("User",)
    translation = Translation.__doc__
    preferences = Preferences.__doc__


class AgentProfile:
    __doc__ = "A meta-data object describing the characteristics of a User or AgentProfile."
    user_id = "The unique database identifier of the User."
    name = "The name of the User."
    username = "The unique user name of the User. This field is unique throughout the server."
    display_name = "How the User is represented throughout the debate. If a user-name exists, this will be chosen. If it does not, the name is determined."
    email = "The email used by the User for identification."
    image = Default.document % ("Image appearing on the avatar of the User. ")
    creation_date = Default.creation_date
    has_password = "A boolean flag describing if the User has a password."
    is_deleted = """A boolean flag that shows if the User is deleted.
    If True, the User information is cleansed from the system, and the User can no longer log in."""
    is_machine = """A boolean flag describing if the User is a machine user or human user."""
    preferences = """The preferences of the User."""
    accepted_cookies = """The list of cookies accepted by the agent."""
    last_accepted_cgu_date = """The last time that the CGU was accepted by the user.
    Normally, this matches the sign-up date, but if the CGU was changed after a debate has started, then the user must agree to a CGU change,
    altering this date."""
    last_accepted_privacy_policy = """The last time that the Privacy Policy was accepted by the user.
    Normally, this matches the sign-up date, but if the Privacy Policy was changed after a debate has started, then the user must agree to a Policy change,
    altering this date."""
    last_rejected_cgu_date = """The last time that the CGU was rejected by the user. A user cannot sign up without accepting the CGU.
    However, if the CGU is changed after the debate has started, a user could reject the new rules, and alter this date."""
    last_rejected_privacy_policy_date = """The last time that the Privacy Policy was rejected by the user. A user cannot sign up without accepting the Privacy Policy.
    However, if the Policy is changed after the debate has started, a user could reject the new policy, and alter this date."""
    last_accepted_user_guideline_date = """The last time that the User Guideline were accepted by the user.
    Normally, this matches the sign-up date, but if the User Guideline was changed after a debate has started, then the user must agree to a User Guideline change,
    altering this date."""
    last_rejected_user_guideline_date = """The last time that the User Guideline was rejected by the user. A user cannot sign up without accepting the User Guideline.
    However, if the User Guideline is changed after the debate has started, a user could reject the new guideline, and alter this date."""


class UpdateUser:
    __doc__ = "A mutation with which a User can update his name, his username, his avatar image or his password."
    id = Default.node_id % ("User") + " The identifier of the User who is about to be updated."
    name = AgentProfile.name
    username = AgentProfile.username
    # this is the identifier of the part in a multipart POST
    image = AgentProfile.image
    old_password = "The old password to be submitted by the User (if/when he wants to change his password)."
    new_password = "The new password to be submitted by the User (if/when he wants to change his password)."
    new_password2 = "The retype of the new password to be submitted by the User (if/when he wants to change his password)."


class DeleteUserInformation:
    __doc__ = """A mutation allowing a user to delete all his information according to article 17 of GDPR.
    All vital information regarding the User acrosst the database is cleansed."""
    id = Default.node_id % ("User")


class UpdateAcceptedCookies:
    __doc__ = """A mutation that allows the addition of accepted and rejected list of cookies by a registered user."""
    actions = """The list of cookies that the user has chosen to accept. The current accepted list of cookies are:\n
    ACCEPT_CGU,\n
    ACCEPT_SESSION_ON_DISCUSSION,\n
    ACCEPT_TRACKING_ON_DISCUSSION,\n
    ACCEPT_PRIVACY_POLICY_ON_DISCUSSION,\n
    ACCEPT_LOCALE,\n
    REJECT_LOCALE,\n
    REJECT_CGU,\n
    REJECT_SESSION_ON_DISCUSSION,\n
    REJECT_TRACKING_ON_DISCUSSION,\n
    REJECT_PRIVACY_POLICY_ON_DISCUSSION,\n
    """


class VoteSession:
    __doc__ = """A Vote session is one of the four phases available in Assembl along with \n
    Survey,\n
    Multicolumn,\n
    thread)."""
    discussion_phase_id = "The database identifier of the DiscussionPhase the session is under."
    header_image = Default.document % ("The image appearing at the header of the Vote session page.")
    vote_specifications = "A list of VoteSpecifications."
    proposals = "The list of Proposals on which the Users will be allowed to vote."
    see_current_votes = "A flag allowing users to view the current votes."
    title = """The title of the VoteSession"""
    title_entries = Default.langstring_entries % """The title in various languages. """
    sub_title = """The subtitle of the VoteSession."""
    sub_title_entries = Default.langstring_entries % """The subtitle in various languages. """
    instructions_section_title = """The instructions section title to be given for a vote session."""
    instructions_section_title_entries = Default.langstring_entries % """The voting instruction's title in various languages. """
    instructions_section_content = """The instructions to be given for a vote session."""
    instructions_section_content_entries = Default.langstring_entries % """The voting instructions in various languages. """
    propositions_section_title = """The title of the section where all Propositions are given."""
    propositions_section_title_entries = Default.langstring_entries % """The Proposal section's title in various languages. """


class UpdateVoteSession:
    __doc__ = """A mutation that allows for existing VoteSessions to be updated."""
    discussion_phase_id = VoteSession.discussion_phase_id
    header_image = VoteSession.header_image
    see_current_votes = VoteSession.see_current_votes


class VoteSpecificationInterface:
    __doc__ = """A VoteSpecification metadata object is a set of configurations of a specific type of voting for a VoteSession."""
    title = Default.string_entry % ("The title of the VoteSpecification.")
    title_entries = Default.langstring_entries % ("The title of the VoteSpecification in various languages.")
    instructions = Default.string_entry % ("The instructions of the VoteSpecification.")
    instructions_entries = Default.langstring_entries % ("The instructions of the VoteSpecification in various languages.")
    is_custom = "A flag specifying if the module has been customized for a specific Proposal."
    vote_session_id = Default.node_id % "Vote Session"
    vote_spec_template_id = Default.node_id % "Vote Specification template" + \
        " A template is a VoteSpecification that this specification should template itself from. It is a form of inheritence for VoteSpecifications."
    # TODO: Give the list of types
    vote_type = "The type of the VoteSpecification."
    my_votes = "The list of Votes by a specific User."
    num_votes = "The total number of Voters for this Vote."


class TokenCategorySpecification:
    __doc__ = "A configuration of Token voting in a Vote Session."
    color = "A CSS-compatible Hex code depicting the colour of the Token."
    typename = "The unique identifier of the token."
    total_number = "The total number of Tokens allocated per vote."
    title = Default.string_entry % ("The title of the Token Category.",)
    title_entries = Default.langstring_entries % ("The title of the Token Category in various languages.",)


class VotesByCategory:
    __doc__ = "A metadata object describing votes per category."
    token_category_id = Default.node_id % "TokenCategory"
    num_token = "The number of tokens on that Category."


class TokenVoteSpecification:
    __doc__ = "A VoteSpecification metadata object is a set of configurations of a TokenVote type in the VoteSession."
    exlusive_categories = "A flag defining whether a User can submit his Vote to several Proposals."
    token_categories = "The list of Token category specification(TokenCategorySpecification)."
    token_votes = "The list of information regarding votes (VotesByCategory)."


class GaugeChoiceSpecification:
    __doc__ = "A VoteSpecification metadata object representing a choice in a GaugeVote."
    value = Default.float_entry % ("Gauge value")
    label = Default.string_entry % ("The label of the Gauge",)
    label_entries = Default.langstring_entries % ("The label of the Gauge in various languages.",)


class GaugeVoteSpecification:
    __doc__ = """A VoteSpecification metadata object is a set of configurations of a GaugeVote type in the VoteSession."""
    choices = "The list of GaugeChoiceSpecifications available on a Gauge. These describe all of the options available in the GaugeVote."
    average_label = Default.string_entry % ("The label of the average value for the Gauge")
    average_result = Default.float_entry % ("The average value for the Gauge")


class NumberGaugeVoteSpecification:
    __doc__ = """A specific GaugeVoteSpecification based on numerical values."""
    minimum = "The minimum value on the Gauge."
    maximum = "The maximum value on the Gauge."
    nb_ticks = "The number of intervals between the minimum and maximum values."
    unit = """The unit used on the Gauge. This could be anything desired, like:\n
    USD ($) or Euros (€)\n
    Months\n
    PPM (Parts per million)\n
    etc"""
    average_result = "The average value of the Votes submitted by all Users."


class TokenCategorySpecificationInput:
    title_entries = TokenCategorySpecification.title_entries
    total_number = TokenCategorySpecification.total_number
    typename = TokenCategorySpecification.typename
    color = TokenCategorySpecification.color


class GaugeChoiceSpecificationInput:
    label_entries = GaugeChoiceSpecification.label_entries
    value = GaugeChoiceSpecification.value


class CreateTokenVoteSpecification:
    __doc__ = "A mutation enabling the creation of a TokenVoteSpecification."
    vote_session_id = VoteSpecificationInterface.vote_session_id
    proposal_id = Default.node_id % ("Proposal",)
    title_entries = VoteSpecificationInterface.title_entries
    instructions_entries = VoteSpecificationInterface.instructions_entries
    is_custom = VoteSpecificationInterface.is_custom
    exclusive_categories = "A boolean flag to say whether the User can/can't vote on several Proposals."
    token_categories = TokenVoteSpecification.token_categories
    vote_spec_template_id = VoteSpecificationInterface.vote_spec_template_id


class UpdateTokenVoteSpecification:
    __doc__ = "A mutation enabling an existing TokenVoteSpecification to be updated."
    id = Default.node_id % ("Token Vote Specification",)
    title_entries = VoteSpecificationInterface.title_entries
    instructions_entries = VoteSpecificationInterface.instructions_entries
    is_custom = VoteSpecificationInterface.is_custom
    exclusive_categories = CreateTokenVoteSpecification.exclusive_categories
    token_categories = TokenVoteSpecification.token_categories


class DeleteVoteSpecification:
    __doc__ = """A mutation enabling an existing VoteSpecification to be deleted."""
    id = Default.node_id % ("Vote Specification",)


class CreateGaugeVoteSpecification:
    __doc__ = "A mutation enabling the creation of a GaugeVoteSpecification."
    vote_session_id = VoteSpecificationInterface.vote_session_id
    proposal_id = Default.node_id % ("Proposal",) + " This is the proposal identifier on which the Gauge Vote will be created."
    title_entries = VoteSpecificationInterface.title_entries
    instructions_entries = VoteSpecificationInterface.instructions_entries
    is_custom = VoteSpecificationInterface.is_custom
    choices = GaugeVoteSpecification.choices
    vote_spec_template_id = VoteSpecificationInterface.vote_spec_template_id


class UpdateGaugeVoteSpecification:
    id = Default.node_id % ("Gauge Vote Specification.",)
    title_entries = VoteSpecificationInterface.title_entries
    instructions_entries = VoteSpecificationInterface.instructions_entries
    is_custom = VoteSpecificationInterface.is_custom
    choices = GaugeVoteSpecification.choices


class CreateNumberGaugeVoteSpecification:
    __doc__ = "A mutation to create a numerical Gauge."
    vote_session_id = Default.node_id % ("Vote Session.") + " This is the identifier of the Vote session in which the numeric Gauge will be created."
    proposal_id = CreateGaugeVoteSpecification.proposal_id
    title_entries = VoteSpecificationInterface.title_entries
    instructions_entries = VoteSpecificationInterface.instructions_entries
    is_custom = VoteSpecificationInterface.is_custom
    minimum = NumberGaugeVoteSpecification.minimum
    maximum = NumberGaugeVoteSpecification.maximum
    nb_ticks = NumberGaugeVoteSpecification.nb_ticks
    unit = NumberGaugeVoteSpecification.unit
    vote_spec_template_id = VoteSpecificationInterface.vote_spec_template_id


class UpdateNumberGaugeVoteSpecification:
    __doc__ = "A mutation to update existing NumberGaugeVoteSpecifications."
    id = Default.node_id % ("Number Gauge Vote specification.",)
    title_entries = VoteSpecificationInterface.title_entries
    instructions_entries = VoteSpecificationInterface.instructions_entries
    is_custom = VoteSpecificationInterface.is_custom
    minimum = NumberGaugeVoteSpecification.minimum
    maximum = NumberGaugeVoteSpecification.maximum
    nb_ticks = NumberGaugeVoteSpecification.nb_ticks
    unit = NumberGaugeVoteSpecification.unit


class CreateProposal:
    __doc__ = "A mutation that enables the creation of a Proposal."
    vote_session_id = Default.node_id % ("Vote Session",)
    title_entries = Default.langstring_entries % ("The Proposal title in various languages.",)
    description_entries = Default.langstring_entries % ("The Proposal description in various languages.",)
    order = "The order (location) of the Proposal in the Vote session."


class UpdateProposal:
    __doc__ = "A mutation that enables existing Proposals to be updated."
    id = Default.node_id % ("Proposal",) + " This is the identifier of the proposal to be updated."
    title_entries = CreateProposal.title_entries
    description_entries = CreateProposal.description_entries
    order = CreateProposal.order


class DeleteProposal:
    __doc__ = "A mutation that enables the deletion of an existing Proposal."
    id = Default.node_id % ("Proposal",) + " This is the identifier of the proposal to eb deleted."


class VoteInterface:
    __doc__ = """In a vote session, Users are given the right to vote on certain proposal. There are two types of votes in Assembl:\n
    Token Vote\n
    Gauge Vote.
    """
    vote_date = Default.creation_date
    voter_id = Default.node_id % "Voter"
    vote_spec_id = Default.node_id % "Vote specification"
    proposal_id = Default.node_id % "Proposal"


class TokenVote:
    __doc__ = "A Vote submitted by a User on a TokenVote."
    vote_value = "The number of Tokens used on a certain Vote."
    token_category_id = "The category of the Token used."


class GaugeVote:
    __doc__ = "A Vote submitted by a User on a GaugeVote."
    vote_value = "The value entered on the GaugeVote."


class AddTokenVote:
    __doc__ = "A mutation to add a Token Vote."
    proposal_id = VoteInterface.proposal_id
    token_category_id = TokenVote.token_category_id
    vote_spec_id = VoteInterface.vote_spec_id
    vote_value = TokenVote.vote_value
    vote_specification = "The specification of the Vote session."


class AddGaugeVote:
    __doc__ = "A mutation to add a Gauge Vote."
    proposal_id = VoteInterface.proposal_id
    vote_spec_id = VoteInterface.vote_spec_id
    vote_value = GaugeVote.vote_value


class Section:
    __doc__ = """Sections are the tabs visible on the top navigation bar of a debate. There are 5 default sections:\n
    Home\n
    Debate\n
    Syntheses\n
    Resources center\n
    Administration.\n
    More can be added with any name desired, but only by a debate administrator.
    """
    order = "The order of the Sections on the top of the page."
    section_type = """There are 5 section types:\n
    HOMEPAGE\n
    DEBATE\n
    SYNTHESES\n
    RESOURCES_CENTER\n
    CUSTOM\n
    ADMINISTRATION"""
    title = Default.string_entry % ("The title of the Section.",)
    title_entries = Default.langstring_entries % ("The title of the Section in various languages.",)
    url = "An optional field. Should the tab redirect to a location outside of the platform, the URL is the location to redirect towards."


class CreateSection:
    __doc__ = """A mutation that allows for the creation of new Sections"""
    title_entries = Section.title_entries
    section_type = Section.section_type
    url = Section.url
    order = Section.order


class DeleteSection:
    __doc__ = """A mutation that allows an existing Section to be deleted."""
    section_id = Default.node_id % ("Section",)


class UpdateSection:
    __doc__ = """A mutation that allows for an existing Section to be updated."""
    id = Default.node_id % ("Section",)
    title_entries = Section.title_entries
    url = Section.url
    order = Section.order


class Resource:
    __doc__ = "A Resource to be added to the Resource Center."
    title = Default.string_entry % ("The title of the Resource.",)
    text = Default.string_entry % ("The text of the Resource.",)
    title_entries = Default.langstring_entries % ("The title of the Resource in various languages.",)
    text_entries = Default.langstring_entries % ("The text in the Resource in various languages.",)
    embed_code = """The URL for any i-frame based content that matches the Content-Security-Policy of the server.
    In effect, this is the \"src\" code inside of an iframe-based attachment to a Resource."""
    image = Default.document % ("An image attached to the Resource",)
    doc = Default.document % ("A file attached to the Resource",)
    order = Default.document % ("The order of the Resource on the Resources Center page.")


class CreateResource:
    __doc__ = """A mutation that enables a Resource to be created."""
    lang = "The language used for the response fields."
    title_entries = Resource.title_entries
    text_entries = Resource.text_entries
    embed_code = Resource.embed_code
    image = Resource.image
    doc = Resource.doc
    order = Resource.order


class DeleteResource:
    __doc__ = """A mutation that enables the deletion of a Resource. Once a resource is deleted, it cannot be resurected."""
    resource_id = Default.node_id % ("Resource") + " This is the Resource identifier that must be deleted."


class UpdateResource:
    __doc__ = """A mutation that enables existing Resources to be updated."""
    lang = CreateResource.lang
    id = Default.node_id % ("Resource") + " This is the Resource identifier that must be updated."
    title_entries = Resource.title_entries
    text_entries = Resource.text_entries
    embed_code = Resource.embed_code
    image = Resource.image
    doc = Resource.doc
    order = Resource.order


class ConfigurableFieldInterface:
    __doc__ = """A ConfigurableField is a front-end text field that can be dymaically generated based on a set of configurations."""
    identifier = """The unique identifier of the field."""
    order = """The position (order) of the Field compared to other Fields."""
    required = """A flag indicating if the Field requires an input or not."""
    hidden = """A flag indicating if the Field is hidden for the user or not."""
    title = Default.string_entry % ("Text Field Label")
    title_entries = Default.langstring_entries % ("The label in multiple languaes.")


class TextField:
    __doc__ = "A configurable HTML text field"
    field_type = """The type of the field. The possible options are:\n
    TEXT\n
    EMAIL\n
    PASSWORD"""


class SelectFieldOption:
    __doc__ = "Options for an HTML select field."
    order = "The position (order) of the field."
    label = ConfigurableFieldInterface.title
    label_entries = ConfigurableFieldInterface.title_entries


class SelectFieldOptionInput:
    id = Default.node_id % ("SelectFieldOption")
    label_entries = SelectFieldOption.label_entries
    order = SelectFieldOption.order


class SelectField:
    __doc__ = "The configurable HTML-based Select Field."
    multivalued = "A flag indicating whether this is a drop-down option."
    options = "The list of SelectFieldOptions."


class CreateTextField:
    __doc__ = "A mutation that allows for the creation of a TextField."
    # TODO: Check why lang is not used
    lang = "The language of the entity. WARNING: Currently not used!"
    title_entries = ConfigurableFieldInterface.title_entries
    order = ConfigurableFieldInterface.order
    required = ConfigurableFieldInterface.required
    hidden = ConfigurableFieldInterface.hidden
    options = "A list of SelectFieldOptions. If this is passed, the mutation will be creating a SelectField instead of a TextField."


class UpdateTextField:
    __doc__ = "A mutation that allows an existing TextField to be updated."
    id = Default.node_id % ("TextField")
    lang = "The language of the source. Warning: Currently not used!"
    title_entries = ConfigurableFieldInterface.title_entries
    order = ConfigurableFieldInterface.order
    required = ConfigurableFieldInterface.required
    hidden = ConfigurableFieldInterface.hidden
    options = "A list of SelectFieldOptions. If this is passed, the mutation will be updating a SelectField instead of a TextField."


class DeleteTextField:
    __doc__ = "A mutation that enables the removal of an existing TextField."
    id = Default.node_id % ("TextField")


class ConfigurableFieldUnion:
    __doc__ = "The Union type of both ConfigurableFields: TextField and SelectField."


class ProfileField:
    __doc__ = "A ConfigurableField connected to the profile of a User. This is often used in the Profile page."
    agent_profile = "The AgentProfile that the ConfigurableField is connected to."
    configurable_field = "The configuration options affecting this field."
    value_data = "The value of the field. It can be of various types."


class FieldData:
    __doc__ = "A generic Field Data description."
    configurable_field_id = Default.node_id % ("ConfigurableField")
    id = Default.node_id % ("FieldData")
    value_data = "The data of the field."


class UpdateProfileFields:
    __doc__ = "A mutation that enables an existing ProfileField to be updated."
    data = "The data to update the ProfileField with."
    lang = "The language of the data. Warning: `lang` is currently not used!"
