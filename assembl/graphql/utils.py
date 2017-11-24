from datetime import datetime

import pytz
from graphene.types.scalars import Scalar
from graphql.language import ast
from graphql.utils.ast_to_dict import ast_to_dict
from .langstring import langstring_from_input_entries
from assembl import models


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
