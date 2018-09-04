from collections import defaultdict

from assembl.lib import config
from assembl.lib.locale import strip_country
from assembl.lib.clean_input import unescape
from elasticsearch.client import Elasticsearch

from assembl.indexing.settings import index_languages, get_index_settings, MAPPINGS


_es = None


def connect():
    global _es
    if _es is None:
        port = config.get('elasticsearch_port', '9200')
        server = config.get('elasticsearch_host', 'localhost') + ':' + port
        auth = config.get('elastic_search_basic_auth', None)
        _es = Elasticsearch(server, **{'http_auth': a for a in (auth,) if a})
    return _es


def create_index(index_name):
    """Create the index and return connection.
    """
    es = connect()
    settings = get_index_settings(config)['index_settings']
    exists = es.indices.exists(index_name)
    if not exists:
        es.indices.create(index=index_name, body={'settings': settings})

    return es


def create_index_and_mapping(index_name):
    """Create the index, put mapping for each doc types.
    """
    es = create_index(index_name)
    for doc_type, mapping in MAPPINGS.items():
        es.indices.put_mapping(
                index=index_name,
                doc_type=doc_type,
                body=mapping
            )


def delete_index(index_name):
    es = connect()
    return es.indices.delete(index_name, ignore=[400, 404])


def populate_from_langstring(ls, data, dataPropName):
    langs = index_languages()
    if ls:
        others = []
        for entry in ls.entries:
            if not entry.value:
                continue
            locale_code = strip_country(entry.base_locale)
            if locale_code == 'zh_Hans':
                locale_code = 'zh_CN'
            if locale_code in langs:
                dataPropNameL = "_".join((dataPropName, locale_code))
                # Japanese for example is stored in db with a html entity for
                # each character.
                # unescape to transform html entities back to characters
                data[dataPropNameL] = unescape(entry.value)
            else:
                others.append(unescape(entry.value))
        if others:
            dataPropNameL = dataPropName + "_other"
            data[dataPropNameL] = ' '.join(others)


def populate_from_langstring_prop(content, data, propName, dataPropName=None):
    ls = getattr(content, propName, None)
    if ls:
        populate_from_langstring(ls, data, dataPropName or propName)


def get_idea_id_for_post(post):
    from assembl.models.idea import MessageView
    ideas = post.get_ideas()

    def index_idea(idea):
        # If the post is a fiction for Bright Mirror, don't index it.
        if idea.message_view_override == MessageView.brightMirror.value:
            return False

        # If the idea is now in multi columns mode and the post was created before that, don't index it.
        if idea.message_columns and post.message_classifier is None:
            return False

        return True

    return [idea.id for idea in ideas if index_idea(idea)]


def get_data(content):
    """Return uid, dict of fields we want to index,
    return None if we don't index."""
    from assembl.models import Idea, Post, SynthesisPost, AgentProfile, LangString, Extract
    if type(content) == Idea:  # only index Idea, not Thematic or Question
        data = {}
        for attr in ('creation_date', 'id', 'discussion_id'):
            data[attr] = getattr(content, attr)
        populate_from_langstring_prop(content, data, 'title')
        populate_from_langstring_prop(content, data, 'synthesis_title')
        populate_from_langstring_prop(content, data, 'description')

        announcement = content.get_applicable_announcement()
        if announcement:
            populate_from_langstring_prop(announcement, data, 'title', 'announcement_title')
            populate_from_langstring_prop(announcement, data, 'body', 'announcement_body')

        phase = content.get_associated_phase()
        if phase:
            data['phase_id'] = phase.id
            data['phase_identifier'] = phase.identifier

        return get_uid(content), data

    elif isinstance(content, AgentProfile):
        data = {}
        for attr in ('creation_date', 'id', 'name'):
            data[attr] = getattr(content, attr, None)
            # AgentProfile doesn't have creation_date, User does.

        # get all discussions that the user is in via AgentStatusInDiscussion
        data['discussion_id'] = set([s.discussion_id
                                 for s in content.agent_status_in_discussion])
        # get discussion_id for all posts of this agent
        data['discussion_id'] = list(
            data['discussion_id'].union(
                [post.discussion_id for post in content.posts_created]
            )
        )
        return get_uid(content), data

    elif isinstance(content, Post):
        data = {}
        data['_parent'] = 'user:{}'.format(content.creator_id)
        if content.parent_id is not None:
            data['parent_creator_id'] = content.parent.creator_id

        for attr in ('discussion_id', 'creation_date', 'id', 'parent_id',
                     'creator_id', 'sentiment_counts'):
            data[attr] = getattr(content, attr)

        data['creator_display_name'] = AgentProfile.get(content.creator_id).display_name()
        data['sentiment_tags'] = [key for key in data['sentiment_counts']
                                  if data['sentiment_counts'][key] > 0]
        like = data['sentiment_counts']['like']
        disagree = data['sentiment_counts']['disagree']
        dont_understand = data['sentiment_counts']['dont_understand']
        more_info = data['sentiment_counts']['more_info']
        all_sentiments = [like, disagree, dont_understand, more_info]
        data['sentiment_counts']['total'] = sum(all_sentiments)
        data['sentiment_counts']['popularity'] = like - disagree
        data['sentiment_counts']['consensus'] = max(all_sentiments) / ((sum(all_sentiments) / len(all_sentiments)) or 1)
        data['sentiment_counts']['controversy'] = max(like, disagree, 1) / min(like or 1, disagree or 1)
        data['type'] = content.type  # this is the subtype (assembl_post, email...)
#        data['publishes_synthesis_id'] = getattr(
#            content, 'publishes_synthesis_id', None)
        phase = content.get_created_phase()
        if phase:
            data['phase_id'] = phase.id
            data['phase_identifier'] = phase.identifier

        if isinstance(content, SynthesisPost):
            populate_from_langstring_prop(content.publishes_synthesis,
                                          data, 'subject')
            populate_from_langstring_prop(content.publishes_synthesis,
                                          data, 'introduction')
            populate_from_langstring_prop(content.publishes_synthesis,
                                          data, 'conclusion')
            long_titles = [idea.synthesis_title for idea in content.publishes_synthesis.ideas
                           if idea.synthesis_title]
            long_titles_c = defaultdict(list)
            for ls in long_titles:
                for e in ls.entries:
                    if e.value:
                        long_titles_c[strip_country(e.base_locale)].append(e.value)
            ls = LangString()
            for locale, values in long_titles_c.iteritems():
                ls.add_value(' '.join(values), locale)
            populate_from_langstring(ls, data, 'ideas')
        else:
            idea_id = get_idea_id_for_post(content)
            if not idea_id:
                return None, None

            data['idea_id'] = idea_id
            populate_from_langstring_prop(content, data, 'body')
            populate_from_langstring_prop(content, data, 'subject')

        return get_uid(content), data

    elif isinstance(content, Extract):
        data = {}
        for attr in ('discussion_id', 'body', 'creation_date', 'id', 'creator_id'):
            data[attr] = getattr(content, attr)

        data['post_id'] = content.content_id
        post = Post.get(content.content_id)
        populate_from_langstring_prop(post, data, 'subject')
        phase = post.get_created_phase()
        if phase:
            data['phase_id'] = phase.id
            data['phase_identifier'] = phase.identifier

        idea_id = get_idea_id_for_post(post)
        if not idea_id:
            return None, None

        data['idea_id'] = idea_id
        data['extract_state'] = 'taxonomy_state.' + content.extract_state
        if content.extract_nature:
            data['extract_nature'] = 'taxonomy_nature.' + content.extract_nature.name

        if content.extract_action:
            data['extract_action'] = 'taxonomy_action.' + content.extract_action.name

        data['creator_display_name'] = AgentProfile.get(content.creator_id).display_name()

        return get_uid(content), data

    return None, None


def get_uid(content):
    """Return a global unique identifier"""
    from assembl.models import Extract, Idea, Post, SynthesisPost, AgentProfile
    if isinstance(content, Extract):
        doc_type = 'extract'
    elif isinstance(content, Idea):
        doc_type = 'idea'
    elif isinstance(content, AgentProfile):
        doc_type = 'user'
    elif isinstance(content, Post):
        if isinstance(content, SynthesisPost):
            doc_type = 'synthesis'
        else:
            doc_type = 'post'

    return '{}:{}'.format(doc_type, content.id)


def get_doc_type_from_uid(uid):
    """Return doc_type from the uid."""
    return uid.split(':')[0]
