"""provider_domain

Revision ID: 5c1bfc79039
Revises: 56eda83b3116
Create Date: 2016-03-22 10:03:51.658027

"""

# revision identifiers, used by Alembic.
revision = '5c1bfc79039'
down_revision = '56eda83b3116'

from alembic import context, op
import sqlalchemy as sa
import transaction
from collections import defaultdict

from assembl.lib import config
from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_column("social_auth_account", "domain")
        op.add_column(
            "social_auth_account",
            sa.Column("provider_domain", sa.String(255)))

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        account_data = list(db.execute(
            """SELECT social_auth_account.id, identity_provider.name, discussion.preferences_id
                FROM social_auth_account
                JOIN abstract_agent_account ON social_auth_account.id = abstract_agent_account.id
                JOIN agent_profile ON agent_profile.id = abstract_agent_account.profile_id
                JOIN identity_provider ON identity_provider.id = social_auth_account.provider_id
                JOIN agent_status_in_discussion ON agent_status_in_discussion.profile_id=agent_profile.id
                JOIN discussion ON agent_status_in_discussion.discussion_id = discussion.id"""))
        preference_ids = {
            pref_id for (account_id, provider, pref_id) in account_data}
        preferences = {id: db.query(m.Preferences).get(id)
                       for id in preference_ids}
        pref_data = {
            id: (p["authorization_server_backend"], p["authorization_server"])
            for (id, p) in preferences.iteritems()
        }
        servers_for_account = defaultdict(set)
        for (account_id, provider, pref_id) in account_data:
            d_provider, server = pref_data[pref_id]
            if d_provider == provider:
                servers_for_account[account_id].add(server)
        # choose a server arbitrarily for each account
        for servers in servers_for_account.itervalues():
            while len(servers) > 1:
                servers.pop()
        accounts_for_server = defaultdict(list)
        for account, servers in servers_for_account.iteritems():
            server = next(iter(servers))
            accounts_for_server[server].append(str(account))
        for server, accounts in accounts_for_server.iteritems():
            db.execute(
                """UPDATE social_auth_account SET provider_domain='%s'
                    WHERE id IN (%s)""" % (server, ','.join(accounts)))
        facebook_id = db.execute(
            "SELECT id FROM identity_provider WHERE name='facebook'"
            ).first()
        if facebook_id:
            db.execute(
                """UPDATE social_auth_account SET provider_domain='%s'
                WHERE provider_id = %d""" % (
                    config.get("SOCIAL_AUTH_FACEBOOK_KEY"), facebook_id[0]))
        mark_changed()

    with context.begin_transaction():
        op.drop_constraint(
            "%s_%s_social_auth_account_UNQC_provider_id_uid" % (
                config.get('db_schema'), config.get('db_user')),
            "social_auth_account")
        op.create_unique_constraint(
            "%s_%s_social_auth_account_UNQC_provider_id_provider_domain_uid" % (
                config.get('db_schema'), config.get('db_user')),
            "social_auth_account", ["provider_id", "provider_domain", "uid"])


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.drop_constraint(
            "%s_%s_social_auth_account_UNQC_provider_id_provider_domain_uid" % (
                config.get('db_schema'), config.get('db_user')),
            "social_auth_account")
        op.drop_column("social_auth_account", "provider_domain")
        op.add_column(
            "social_auth_account",
            sa.Column("domain", sa.String(200)))
        op.create_unique_constraint(
            "%s_%s_social_auth_account_UNQC_provider_id_uid" % (
                config.get('db_schema'), config.get('db_user')),
            "social_auth_account", ["provider_id", "uid"])
