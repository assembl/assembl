"""index foreign keys

Revision ID: 55cac5610448
Revises: 1e01b5f0e5f9
Create Date: 2016-04-21 09:20:43.755068

"""

# revision identifiers, used by Alembic.
revision = '55cac5610448'
down_revision = '1e01b5f0e5f9'

from alembic import context, op
import sqlalchemy as sa
import transaction

from assembl.lib import config


foreign_keys = [
    "username.user_id",
    "abstract_agent_account.profile_id",
    "action.actor_id",
    "action_on_idea.idea_id",
    "action_on_post.post_id",
    "agent_status_in_discussion.discussion_id",
    "agent_status_in_discussion.profile_id",
    "announce.discussion_id",
    "attachment.discussion_id",
    "content.body_id",
    "content.discussion_id",
    "content.subject_id",
    "content_source.discussion_id",
    "content_source_ids.message_id_in_source",
    "content_source_ids.post_id",
    "content_source_ids.source_id",
    "discussion_permission.discussion_id",
    "discussion_permission.permission_id",
    "discussion_permission.role_id",
    "discussion_peruser_namespaced_key_value.discussion_id",
    "discussion_peruser_namespaced_key_value.user_id",
    "document.discussion_id",
    "facebook_access_token.fb_account_id",
    "idea_graph_view.discussion_id",
    "idea_vote.criterion_id",
    "idea_vote.idea_id",
    "idea_vote.vote_spec_id",
    "idea_vote.voter_id",
    "idea_vote.widget_id",
    "langstring_entry.locale_id",
    "local_user_role.discussion_id",
    "local_user_role.role_id",
    "local_user_role.user_id",
    "locale_label.locale_id_of_label",
    "locale_label.named_locale_id",
    "notification_on_post.post_id",
    "notification_subscription_on_extract.extract_id",
    "notification_subscription_on_idea.idea_id",
    "notification_subscription_on_post.post_id",
    "notification_subscription_on_useraccount.on_user_id",
    "partner_organization.discussion_id",
    "post.creator_id",
    "post.parent_id",
    "post_with_metadata.widget_id",
    "synthesis_post.publishes_synthesis_id",
    "timeline_event.discussion_id",
    "token_category_specification.name_ls_id",
    "token_category_specification.token_vote_specification_id",
    "token_idea_vote.token_category_id",
    "user_language_preference.user_id",
    "user_role.role_id",
    "user_template.discussion_id",
    "user_template.role_id",
    "vote_specification.criterion_idea_id",
    "vote_specification.widget_id",
    "widget.discussion_id",
    "widget_user_config.user_id",
    "widget_user_config.widget_id"
]


# Not indexed:
#
# announce.creator_id
# announce.last_updated_by_id
# anonymous_user.source_id
# attachment.creator_id
# attachment.document_id
# discussion.preferences_id
# extract.owner_id
# facebook_source.creator_id
# idea.base_id
# idea_content_link.creator_id
# idea_idea_link.base_id
# idea_proposal_post.idea_id
# idea_vote.base_id
# imported_post.source_id
# notification.first_matching_subscription_id
# notification_subscription.parent_subscription_id
# post.moderator_id
# preferences.cascade_id
# social_auth_account.provider_id
# source_specific_account.source_id
# timeline_event.previous_event_id
# user_language_preference.locale_id
# user_language_preference.translate_to


unique_foreign_keys = {
    "username.user_id"
}


def index_name(schema, table, column):
    name = "ix_%s_%s_%s" % (schema, table, column)
    return name[:63]


def upgrade(pyramid_env):
    schema = config.get("db_schema")
    with context.begin_transaction():
        for index in foreign_keys:
            table, column = index.split(".")
            op.create_index(
                index_name(schema, table, column),
                table, [column], unique=(index in unique_foreign_keys))



def downgrade(pyramid_env):
    schema = config.get("db_schema")
    with context.begin_transaction():
        for index in foreign_keys:
            table, column = index.split(".")
            op.drop_index(
                index_name(schema, table, column), table)
