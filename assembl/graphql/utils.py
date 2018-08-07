from datetime import datetime
import os.path
import pytz

from graphene.types.scalars import Scalar
from graphql.language import ast
from graphql.utils.ast_to_dict import ast_to_dict

from .langstring import langstring_from_input_entries
from assembl import models
from assembl.utils import get_ideas
from assembl.models.timeline import Phases, PHASES_WITH_POSTS


class DateTime(Scalar):
    '''DateTime in ISO 8601 format'''

    @staticmethod
    def serialize(dt):
        return dt.replace(tzinfo=pytz.UTC).isoformat()

    @staticmethod
    def parse_literal(node):
        if isinstance(node, ast.StringValue):
            return datetime.strptime(
                node.value, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=pytz.UTC)

    @staticmethod
    def parse_value(value):
        return datetime.strptime(
            value, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=pytz.UTC)


def abort_transaction_on_exception(fn):
    """Decorator that abort the transaction when an exception is raised in
    a graphql mutation.
    """
    def decorator(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception:
            import transaction
            transaction.abort()
            raise

    return decorator


# copied from
# https://github.com/graphql-python/graphene/issues/462#issuecomment-298218524
def collect_fields(node, fragments, variables):
    field = {}
    selection_set = node.get('selection_set') if node else None
    selections = selection_set.get(
        'selections', None) if selection_set else None

    if selections is not None:
        for leaf in selections:
            leaf_kind = leaf.get('kind')
            leaf_name = leaf.get('name', {}).get('value')
            leaf_directives = leaf.get('directives')

            # Check if leaf should be skipped
            # - If name is '__typename'
            # - if @skip directive is used and evaluates to True
            # - if @include directive is used and evaluates to False (not yet implemented!)  # noqa: E501
            should_skip = False
            for directive in leaf_directives:
                if directive.get('name', {}).get('value') == 'skip':
                    for arg in directive.get('arguments', []):
                        arg_value = arg.get('value', {})
                        if arg.get('name', {}).get('value') == 'if':
                            if arg_value.get('kind') == 'Variable':
                                var_name = arg_value.get(
                                    'name', {}).get('value')
                                should_skip = variables.get(
                                    var_name, should_skip)
                            elif arg_value.get('kind') == 'BooleanValue':
                                should_skip = arg_value.get('value')

            if leaf_name != '__typename' and not should_skip:
                if leaf_kind == 'Field':
                    field.update({
                        leaf_name: collect_fields(leaf, fragments, variables)
                    })
                elif leaf_kind == 'FragmentSpread':
                    field.update(collect_fields(
                        fragments[leaf_name], fragments, variables))
                elif leaf_kind == 'InlineFragment':
                    field.update(collect_fields(leaf, fragments, variables))
    return field


def get_fields(info):
    """Return a nested dict of the fields requested by a graphene resolver."""
    fragments = {}
    node = ast_to_dict(info.field_asts[0])

    for name, value in info.fragments.items():
        fragments[name] = ast_to_dict(value)

    fields = collect_fields(node, fragments, info.variable_values)
    return fields


def get_root_thematic_for_phase(discussion, identifier):
    """Return root thematic for the given phase `identifier` on `discussion`.
    """
    root_thematic = [idea
                     for idea in discussion.root_idea.get_children()
                     if getattr(idea, 'identifier', '') == identifier]
    return root_thematic[0] if root_thematic else None


def create_root_thematic(discussion, identifier):
    """Create the root thematic (hidden) for the given phase `identifier`
    on `discussion`.
    """
    short_title = u'Phase {}'.format(identifier)
    root_thematic = models.Thematic(
        discussion_id=discussion.id,
        title=langstring_from_input_entries(
            [{'locale_code': 'en', 'value': short_title}]),
        identifier=identifier,
        hidden=True)
    discussion.root_idea.children.append(root_thematic)
    return root_thematic


def get_attachment_with_purpose(attachments, purpose):
    for att in attachments:
        if att.attachmentPurpose == purpose:
            return att

    return None


def create_attachment(discussion, attachment_model, new_value, attachment_purpose, context):
    filename = os.path.basename(context.POST[new_value].filename)
    mime_type = context.POST[new_value].type
    document = models.File(
        discussion=discussion,
        mime_type=mime_type,
        title=filename)
    document.add_file_data(context.POST[new_value].file)
    new_attachment = attachment_model(
        document=document,
        discussion=discussion,
        creator_id=context.authenticated_userid,
        title=filename,
        attachmentPurpose=attachment_purpose
    )

    return new_attachment


def update_attachment(discussion, attachment_model, new_value, attachments, attachment_purpose, db, context):
    """Update or delete attachment."""
    current_attachment = None
    if attachments:
        purposes_attachments = [
            att for att in attachments if att.attachmentPurpose == attachment_purpose]
        if purposes_attachments:
            current_attachment = purposes_attachments[0]

    if new_value == 'TO_DELETE' and current_attachment:
        # delete the new_value
        current_attachment.document.delete_file()
        db.delete(current_attachment.document)
        db.delete(current_attachment)
        attachments.remove(current_attachment)
    else:
        filename = os.path.basename(context.POST[new_value].filename)
        mime_type = context.POST[new_value].type
        document = models.File(
            discussion=discussion,
            mime_type=mime_type,
            title=filename)
        document.add_file_data(context.POST[new_value].file)
        # if there is already an attachment, remove it with the
        # associated document (image)
        if current_attachment:
            current_attachment.document.delete_file()
            db.delete(current_attachment.document)
            attachments.remove(current_attachment)

        attachment = attachment_model(
            document=document,
            discussion=discussion,
            creator_id=context.authenticated_userid,
            title=filename,
            attachmentPurpose=attachment_purpose
        )
        attachments.append(attachment)


def get_posts_for_phases(discussion, identifiers, include_deleted=False):
    """Return related posts for the given phases `identifiers` on `discussion`.
    """
    # Retrieve the phases with posts
    identifiers_with_posts = [i for i in identifiers if i in PHASES_WITH_POSTS]
    if not discussion or not identifiers_with_posts:
        return None

    ideas = []
    # If survey phase, we need the root thematic
    if Phases.survey.value in identifiers_with_posts:
        root_thematic = get_root_thematic_for_phase(discussion, Phases.survey.value)
        if root_thematic:
            ideas.append(root_thematic)

        identifiers_with_posts.remove(Phases.survey.value)

    if identifiers_with_posts:
        # If we have both 'thread' and 'multiColumns' in identifiers_with_posts
        # use get_ideas without filter (second param None) to get all ideas.
        # If only 'multiColumns' in identifiers_with_posts, add the filter.
        # Ideas from 'multiColumns' phase are a subset of the ideas
        # from 'thread' phase
        is_multi_columns = Phases.multiColumns.value in identifiers_with_posts and \
            len(identifiers_with_posts) == 1
        ideas.extend(
            get_ideas(
                discussion.id,
                Phases.multiColumns.value if is_multi_columns else None
            ).all()
        )

    if not ideas:
        return None

    model = models.AssemblPost
    query = discussion.db.query(model)
    queries = []
    for idea in ideas:
        related = idea.get_related_posts_query(True)
        related_query = query.join(
            related, model.id == related.c.post_id
        )
        queries.append(related_query)

    query = queries[0].union_all(*queries[1:])
    if not include_deleted:
        return query.filter(
            model.publication_state == models.PublicationStates.PUBLISHED)

    return query


def create_idea_announcement(user_id, discussion, idea, title_langstring, description_langstring):
    """Create an announcement with title and body for an idea.
    """
    idea_announcement = models.IdeaAnnouncement(
        discussion=discussion,
        idea=idea,
        title=title_langstring,
        body=description_langstring,
        creator_id=user_id,
        last_updated_by_id=user_id)
    return idea_announcement
