# -*- coding:utf-8 -*-


class Default:
    required_language_input = """A locale input is required to specify in which language the content should be returned."""
    langstring_entries = """A list of possible languages of the entity as LangStringEntry objects. %s"""
    document = """%sA file metadata object, described by the Document object."""
    string_entry = """A %s in a given language."""
    float_entry = """A %s  as a float"""
    node_id = """The Relay.Node ID type of the %s object."""


class Schema:
    node = """A Relay node. Any entity that uses the Relay object structure, along with connections (edges), can be queried from Node."""
    root_idea = """An idea union between either an Idea type or a Thematic type."""
    ideas = """List of all ideas on the debate."""
    thematics = """List of all thematics on the debate. Thematics are a subset of Ideas."""
    syntheses = """List of all syntheses on the debate."""
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
    has_terms_and_conditions = """A boolean flag of whether a debate has set a terms and conditions page."""
    has_cookies_policy = """A boolean flag of whether a debate has set a cookie policy page."""
    has_privacy_policy = """A boolean flag of whether a debate has set a privacy policy page."""
    visits_analytics = """The object containing the summary data of analytics on the page, based on time-series analysis of analytics engine data."""
    discussion = """The discussion object metadata."""
    landing_page_module_types = """The metadata object for LandingPageModule object."""
    landing_page_modules = """A list of LandingPageModules."""
    text_fields = """A list of ConfigurableField union, where each text field represents a field on a bound entity."""
    profile_fields = """A list of ConfigurableField union, where each text field represents a field on a profile only."""
    timeline = """A list of DiscussionPhase objects, descriping the timeline objects on the debate."""


class Discussion:
    __docs__ = """The Discussion object. This object describes certain parts of the core state of the debate."""
    homepage_url = """A URL for the homepage (optional). Often placed on the logo."""
    title = """The title of the discussion, in the language specified by the input"""
    subtitle = """The subtitle of the discussion, in the language specified by the input"""
    button_label = """The value inside of the participation button in the landing page."""
    header_image = Default.document % ("The file representing the header of the landing page. ", )
    logo_image = Default.document % ("The file representing the logo of the debate. ", )


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


class UpdateResourcesCenter:
    __doc__ = """The mutation that allows to update existing Resource Center objects."""
    title_entries = Default.string_entry
    header_image = Default.document % ("""Update the main image associated with a ResourceCenter. """,)


class UpdateDiscussionPreferences:
    __doc__ = """A way to save Discussion Preferences on a debate."""
    languages = """The list of languages in ISO 639-1 locale code that the debate should support."""


class UpdateLegalContents:
    __doc__ = """A method to update the Legal Contents of a debate."""
    legal_notice_entries = Default.langstring_entries % ("This is the list of all Legal Notices in various languages.",)
    terms_and_conditions_entries = Default.langstring_entries % ("This is the list of all Terms and Conditions in various languages.",)
    cookies_policy_entries = Default.langstring_entries % ("This is the list of all Cookie Policies in various languages.",)
    privacy_policy_entries = Default.langstring_entries % ("This is the list of all Privay Policies in various languages.",)


class VisitsAnalytics:
    __doc__ = """This object describes the analytics data gathered on the debate throughout its total lifecycle. The analytics is carried out
    by Mamoto (formerly known as Piwik), an open-source anaytics engine."""
    sum_visits_length = """The total number of hours spent on the platform by all users."""
    nb_pageviews = """The total number of page views accumulated."""
    nb_uniq_pageviews = """The total number of unique page views."""


class Synthesis:
    __doc__ = """Class to model the synthesis of a discussion. A synthesis is one of the core features of Assembl that a debate administrator
    uses to synthesize the main ideas of a debate. It has an introduction and a conclusion"""
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
    text_fragment_identifiers = """A list of TextFragmentIdentifiers."""
    creation_date = """The date the Extract was created, in UTC timezone."""
    creator_id = """The id of the User who created the extract."""
    creator = """The AgentProfile object description of the creator."""


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


class Locale:
    __doc__ = """The Locale object describing the language model."""
    locale_code = """The ISO 639-1 locale code of the language of choice."""
    label = """The name of the locale, in a specifically given language."""


class Video:
    title = Default.string_entry % ("Title of the video.")
    description_top = Default.string_entry % ("Description on top of the video.")
    description_bottom = Default.string_entry % ("Description on bottom of the video.")
    description_side = Default.string_entry % ("Description on the side of the video.")
    html_code = Default.string_entry % ("")
    title_entries = Default.langstring_entries % ("Title of the video in various languages.")
    description_entries_top = Default.langstring_entries % ("Description on the top of the video in various languages.")
    description_entries_bottom = Default.langstring_entries % ("Description on the bottom of the video in various languages.")
    description_entries_side = Default.langstring_entries % ("Description on the side of the video in various languages.")


class IdeaInterface:
    num_posts = "Number of posts on that idea."
    num_total_posts = "Total number of posts on that idea and on all its children ideas "
    num_contributors = "Number of participants who contributed to that idea"
    num_children = "Number of children ideas (subideas) of this idea."
    img = Default.document % "Image associated with the idea. "
    order = "Order of this Idea in the idea tree."
    live = "???"  # graphene.Field(lambda: IdeaUnion)
    message_view_override = Default.string_entry % " ."
    total_sentiments = "Totla number of sentiments expressed by participants on posts related to that idea."
    vote_specifications = "???"  # graphene.List('assembl.graphql.vote_session.VoteSpecificationUnion', required=True)


class QuestionInput:
    id = """Id of the question input."""
    title_entries = Default.langstring_entries % ("Title of the question in various languages.")


class VideoInput:
    title_entries = Default.langstring_entries % ("Title of the video in various languages.")
    description_entries_top = Default.langstring_entries % ("Description on the top of the video in various languages.")
    description_entries_bottom = Default.langstring_entries % ("Description on the bottom of the video in various languages.")
    description_entries_side = Default.langstring_entries % ("Description on the side of the video in various languages.")
    html_code = Default.string_entry % ("???")


class CreateIdea:
    __doc__ = """Method to create an idea."""
    title_entries = Default.langstring_entries % ("Title of the idea in various languages.",)
    description_entries = Default.langstring_entries % ("List of the description of the idea in different languages.")
    image = Default.document % ("""Main image associated with this idea.""",)
    order = """Order of the thematic."""
    parent_id = """Id of the parent Idea of this idea."""


class CreateThematic:
    __doc__ = """Method to create a new thematic."""
    title_entries = Default.langstring_entries % ("""Title of the thematic in different languages.""")
    description_entries = Default.langstring_entries % ("""Description of the thematic in different languages.""")
    identifier = Default.string_entry % ("""Thematic to be created. """)
    video = """Video to be integrated with the thematic."""
    questions = """List of Questions for the thematic."""
    image = Default.string_entry % ("Image to be shown in the thematic. ")
    order = Default.float_entry % (" Order of the thematic.")


class Thematic:
    title = "Title of the thematic."
    title_entries = CreateThematic.title_entries
    description = "Description of the thematic."
    questions = CreateThematic.questions
    video = CreateThematic.video


class UpdateThematic:
    __doc__ = "Method to update a thematic."
    id = "ID of the thematic to be updated."
    title_entries = CreateThematic.title_entries
    description_entries = CreateThematic.description_entries
    identifier = CreateThematic.identifier
    video = CreateThematic.video
    questions = CreateThematic.questions
    image = CreateThematic.image
    order = CreateThematic.order


class DeleteThematic:
    __doc__ = """Method to delete a thematic."""
    thematic_id = """Id of the thematic to be deleted."""


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
    document = Default.document % ("A document to attach to a post. ")


class IdeaContentLink:
    __doc__ = "An abstract class representing a link between an Idea and a content (typically a post)."
    idea_id = "Id of the Idea to be linked to the post."
    post_id = "Id of the post to be linked to the idea."
    creator_id = "Id of the user(participant) who created the link."
    type = Default.string_entry % (" . ")
    idea = "A graphene field representing a relationship to the idea to be linked."
    post = "A graphene field representing a relationship to the post to be linked."
    creator = "A graphene field reprensenting a relationship to the creator of the link."
    creation_date = "Date on which this link was created."


class PostInterface:
    creator = "Participant who created the message"
    message_classifier = ""
    creation_date = "Date on which the post was created."
    modification_date = "Date of the modification of the post"
    subject = Default.string_entry % ("Subject of the post")
    body = Default.string_entry % ("Body of the post (the main content of the post).")
    subject_entries = Default.langstring_entries % ("The subject of the post in various languages.")
    body_entries = Default.langstring_entries % ("The body of the post in various languages.")
    sentiment_counts = "A graphene field which contains the number of of each sentiment expressed (dont_understand, disagree, like, more info)"
    my_sentiment = "A graphene field which contains a list of sentiment types."
    indirect_idea_content_links = "List of links to ideas."
    extracts = "List of extracts related to that post."
    parent_id = "Id of the parent post."
    db_id = " ???"
    body_mime_type = Default.string_entry % "???"
    publication_state = """A graphene Field containing the state of the publication of a certain post (DRAFT,SUBMITTED_IN_EDIT_GRACE_PERIOD,SUBMITTED_AWAITING_MODERATION,PUBLISHED,MODERATED_TEXT_ON_DEMAND,MODERATED_TEXT_NEVER_AVAILABLE,DELETED_BY_USER,DELETED_BY_ADMIN,WIDGET_SCOPED)"""

    attachments = "List of attachements to the post."
    original_locale = Default.string_entry % ("Locale in which the original message was written.")
    publishes_synthesis = "Graphene Field modeling a relationship to a published synthesis."


class Post:
    __doc__ = "Inherits fields from PostInterface."


class CreatePost:
    __doc__ = "A function called each time a post is created."
    subject = PostInterface.subject
    body = PostInterface.body
    idea_id = "Id of the idea to which the post is related."
    # A Post (except proposals in survey phase) can reply to another post.
    # See related code in views/api/post.py
    parent_id = "Id of the parent post in case of "
    attachments = PostInterface.attachments
    message_classifier = PostInterface.message_classifier


class UpdatePost:
    __doc__ = "A function called when a post is updated."
    post_id = "Id of the post to be updated."
    subject = "Updated subject of the post."
    body = Default.string_entry % ("Updated body of the post.")
    attachments = "Updated attachments of the post."


class DeletePost:
    __doc__ = "A function called when post is deleted."
    post_id = "Id of the post to be deleted."


class UndeletePost:
    __doc__ = "A function called to resurrect post after being deleted."
    post_id = "Id of the post to be undeleted."


class AddPostAttachement:
    __doc__ = "A method to add attachment to a post."
    post_id = "Id of the post to add an attachement to."
    file = Default.string_entry % ("The path of the file to be attached.")


class DeletePostAttachment:
    post_id = "Id from which to delete the attachement."
    attachement_id = "Id of the attachement to be deleted."


class AddPostExtract:
    __doc__ = "A method to harvest an extract from a post."
    post_id = "Id of the post from which to harvest an extract."
    body = "Body of the extract from the post."
    important = "Boolean to set the extract as a doughnut or not."
    xpath_start = TextFragmentIdentifier.xpath_start
    xpath_end = TextFragmentIdentifier.xpath_end
    offset_start = TextFragmentIdentifier.offset_start
    offset_end = TextFragmentIdentifier.offset_end


class Document:
    __doc__ = "An SQLalchemytype class to model a document. In most cases, A document is used as an attachement to a post or a picture of a thematic, synthesis, etc ..."
    external_url = Default.string_entry % ("A url to an image or a document to be attached.")
    av_checked = Default.string_entry % ("???")


class UploadDocument:
    file = Default.string_entry % ("File to be uploaded.")


class SentimentCounts:
    __doc__ = "A class containing the number of sentiments expressed on a specific post. There are four sentiments in Assembl: dont_understand, disagree, like, more_info."
    dont_understand = "Number of sentiments expressing dont_understand on a specific post."
    disagree = "Number of sentiments disagreeing with the post."
    like = "Number of positive sentiments expressed on the post."
    more_info = "Number of sentiments requesting more info on the post."


class AddSentiment:
    post_id = "Id of the post on which to express a sentiment. A user can only add one sentiment per post."
    type = "Type of the sentiment to be expressed on the post. There are four sentiments in Assembl: dont_understand, disagree, like, more_info."


class DeleteSentiment:
    __doc__ = "A method to delete a sentiment by the user. Since the user can only express one sentiment per post, it only takes a post_id as input."
    post_id = "Id of the post from which to remove an expressed sentiment. A user can only remove a sentiment that he expressed."


class DiscussionPhase:
    __doc__ = "Assembl has four possible phases: Survey, multicolumn, thread, voteSession."
    identifier = Default.string_entry % (
        "Identifier of the phase. Assembl has four possible phase identifiers: Survey, multicolumn, thread, voteSession.")
    is_thematics_table = " "
    title = Default.string_entry % ("Title of the Phase.")
    title_entries = Default.langstring_entries % ("Title of the phase in various languages.")
    description = Default.string_entry % ("Description of the Phase.")
    description_entries = Default.langstring_entries % ("Description of the phase in various languages.")
    start = "A DateTime variable as the starting date of the phase."
    end = "A DateTime variable as the end date of the phase."
    image = Default.document % ("The image displayed on the phase.")
    order = Default.float_entry % ("Order of the phase in the timeline.")


class CreateDiscussionPhase:
    __doc__ = DiscussionPhase.__doc__
    lang = Default.string_entry % (".")
    identifier = DiscussionPhase.identifier
    is_thematics_table = DiscussionPhase.is_thematics_table
    title_entries = DiscussionPhase.title_entries
    start = DiscussionPhase.start
    end = DiscussionPhase.end
    order = DiscussionPhase.order


class UpdateDiscussionPhase:
    __doc__ = DiscussionPhase.__doc__
    id = "Id of the phase to be updated."
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
    __doc__ = DiscussionPhase.__doc__
    id = "Id of the phase to be deleted."


class AgentProfile:
    __doc__ = "Abstract SQLalchemy class to model a user."
    user_id = "Id if the user."
    name = Default.string_entry % ("Name of the User. This Name will appear on all the activities done by the user on the debate.")
    username = Default.string_entry % ("Username of the user.")
    display_name = Default.string_entry % ("???")
    email = "A string of the email used by the user for identification."
    image = Default.document % ("Image appearing on the avatar of the user.")
    creation_date = "Datetime variable of the creation of the profile. It exists only on user not AgentProfile."
    has_password = "A boolean flag stating if the user has a password."
    is_deleted = "A boolean flag to state if the this user is deleted or not."


class UpdateUser:
    __doc__ = "A method with which a user can update his name, his username, his avatar image or his password."
    id = "Id of the user to be updated."
    name = AgentProfile.name
    username = AgentProfile.username
    # this is the identifier of the part in a multipart POST
    image = AgentProfile.image
    old_password = Default.string_entry % ("Old password to be submitted by the user in case he wants to change his password.")
    new_password = Default.string_entry % ("New password to be submitted by the user in case he wants to change his password.")
    new_password2 = Default.string_entry % ("Retype of new password to be submitted by the user in case he wants to change his password.")


class DeleteUserInformation:
    __doc__ = "A method allowing a user to delete all his information according to article 17 of GDPR. It replaces all his personnal information with random strings."
    id = "Id of the user to be deleted."


class VoteSession:
    __doc__ = "A vote session is one of the four phases available in Assembl (along with Survey, multicolumn and thread)."
    discussion_phase_id = " ??? "
    header_image = Default.document % ("Image appearing at the header of the vote session page.")
    vote_specifications = "A list of the vote specifications."  # graphene.List(lambda: VoteSpecificationUnion, required=True)
    proposals = "List of proposals on which the participants will be allowed to vote."
    see_current_votes = "A boolean flag according to which the users will be allowed to see the current votes."


class UpdateVoteSession:
    discussion_phase_id = VoteSession.discussion_phase_id
    header_image = VoteSession.header_image
    see_current_votes = VoteSession.see_current_votes


class VoteSpecificationInterface:
    title = Default.string_entry % ("Title of the vote.")
    title_entries = Default.langstring_entries % ("Title of the vote in various languages.")
    instructions = Default.string_entry % ("Instructions of the vote.")
    instructions_entries = Default.langstring_entries % ("Instructions of the vote in various languages.")
    is_custom = "A boolean flag specifying if the module has been customized for a specific proposal."
    vote_session_id = "Id of the vote session to which this vote is associated."
    vote_spec_template_id = "???"  # graphene.ID()
    vote_type = "Type of the vote: Tokens or gauge."
    my_votes = "List of votes by a specific user."
    num_votes = "Total number of voters for this vote."


class TokenCategorySpecification:
    __doc__ = "An SQLalchemy class to model the token in a token vote session."
    color = "A string corresponding to the color of the coin?"
    typename = "Name of the coin."
    total_number = "Total number of coins allocated by user."
    title = Default.string_entry % ("Title of the token category.")
    title_entries = Default.langstring_entries % ("Title of the token category in various languages.")


class VotesByCategory:
    __doc__ = ""
    token_category_id = "ID of the token category."
    num_token = "Number of tokens on that category."


class TokenVoteSpecification:
    __doc__ = "An SQLalchemy class to model the specifications of a token vote."
    exlusive_categories = "A boolean flag "
    token_categories = "List of token category specification(TokenCategorySpecification)."
    token_votes = "List of token votes (VotesByCategory)."


class GaugeChoiceSpecification:
    __doc__ = "An SQLalchemy class to model the specifications of a gauge vote."
    value = "???"
    label = Default.string_entry % ("Label of the Gauge.")
    label_entries = Default.langstring_entries % ("Label of the gauge in various languages.")


class GaugeVoteSpecification:
    choices = "List of choices available on a Gauge."
    average_label = Default.string_entry % ("Average vote on a textual vote. ")
    average_result = Default.float_entry % ("Average vote on a numeric gauge. ")


class NumberGaugeVoteSpecification:
    minimum = "Minimum value on the gauge."
    maximum = "Maximum value on the gauge."
    nb_ticks = "Integer number of intervals between the minimum value and the maximum value."
    unit = "Unit used on the gauge (could be USD, months, years, persons, etc ...)."
    average_result = "Average value of the votes submitted by users."


class TokenCategorySpecificationInput:
    title_entries = TokenCategorySpecification.title_entries
    total_number = TokenCategorySpecification.total_number
    typename = TokenCategorySpecification.typename
    color = TokenCategorySpecification.color


class GaugeChoiceSpecificationInput:
    label_entries = GaugeChoiceSpecification.label_entries
    value = GaugeChoiceSpecification.value


class CreateTokenVoteSpecification:
    vote_session_id = VoteSpecificationInterface.vote_session_id
    proposal_id = "Id of the proposal on the users will vote."
    title_entries = VoteSpecificationInterface.title_entries
    instructions_entries = VoteSpecificationInterface.instructions_entries
    is_custom = VoteSpecificationInterface.is_custom
    exclusive_categories = "A boolean flag to ???"
    token_categories = TokenVoteSpecification.token_categories
    vote_spec_template_id = "???"


class UpdateTokenVoteSpecification:
    id = "Id of the token vote to be updated."
    title_entries = VoteSpecificationInterface.title_entries
    instructions_entries = VoteSpecificationInterface.instructions_entries
    is_custom = VoteSpecificationInterface.is_custom
    exclusive_categories = CreateTokenVoteSpecification.exclusive_categories
    token_categories = TokenVoteSpecification.token_categories


class DeleteVoteSpecification:
    id = "Id of the token vote to be deleted."


class CreateGaugeVoteSpecification:
    vote_session_id = VoteSpecificationInterface.vote_session_id
    proposal_id = "Id of the proposal on the users will vote."
    title_entries = VoteSpecificationInterface.title_entries
    instructions_entries = VoteSpecificationInterface.instructions_entries
    is_custom = VoteSpecificationInterface.is_custom
    choices = GaugeVoteSpecification.choices
    vote_spec_template_id = "???"  # graphene.ID()


class UpdateGaugeVoteSpecification:
    id = "ID of the gauge to be updated."
    title_entries = VoteSpecificationInterface.title_entries
    instructions_entries = VoteSpecificationInterface.instructions_entries
    is_custom = VoteSpecificationInterface.is_custom
    choices = GaugeVoteSpecification.choices


class CreateNumberGaugeVoteSpecification:
    __doc__ = "Create a numerical Gauge. "
    vote_session_id = "ID of the vote session in which the numeric Gauge will be created."
    proposal_id = CreateGaugeVoteSpecification.proposal_id
    title_entries = VoteSpecificationInterface.title_entries
    instructions_entries = VoteSpecificationInterface.instructions_entries
    is_custom = VoteSpecificationInterface.is_custom
    minimum = NumberGaugeVoteSpecification.minimum
    maximum = NumberGaugeVoteSpecification.maximum
    nb_ticks = NumberGaugeVoteSpecification.nb_ticks
    unit = NumberGaugeVoteSpecification.unit
    vote_spec_template_id = CreateGaugeVoteSpecification.vote_spec_template_id


class UpdateNumberGaugeVoteSpecification:
    id = "Id of the numerical Gauge Vote to be updated."
    title_entries = VoteSpecificationInterface.title_entries
    instructions_entries = VoteSpecificationInterface.instructions_entries
    is_custom = VoteSpecificationInterface.is_custom
    minimum = NumberGaugeVoteSpecification.minimum
    maximum = NumberGaugeVoteSpecification.maximum
    nb_ticks = NumberGaugeVoteSpecification.nb_ticks
    unit = NumberGaugeVoteSpecification.unit


class CreateProposal:
    vote_session_id = "Id of the vote session containing the proposal."
    title_entries = Default.langstring_entries % "Proposal title in various languages."
    description_entries = Default.langstring_entries % "Proposal description in various languages."
    order = "Order of the proposal in the voting session."


class UpdateProposal:
    id = "Id of the proposal to be updated."
    title_entries = CreateProposal.title_entries
    description_entries = CreateProposal.description_entries
    order = CreateProposal.order


class DeleteProposal:
    id = "Id of the proposal to be deleted."


class VoteInterface:
    vote_date = "Date on which the participant submitted his vote."
    voter_id = "Id of the voter."
    vote_spec_id = ""  # graphene.ID(required=True)
    proposal_id = "Id of the proposal on which the user has submitted his vote."
