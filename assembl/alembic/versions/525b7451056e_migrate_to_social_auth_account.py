"""migrate to social_auth_account from idprovider_agent_account

Revision ID: 525b7451056e
Revises: 5c1bfc79039
Create Date: 2016-03-23 16:05:53.638027

"""

# revision identifiers, used by Alembic.
revision = '525b7451056e'
down_revision = '5c1bfc79039'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config
from assembl.lib.sqla import mark_changed


def upgrade(pyramid_env):
    with context.begin_transaction():
        op.execute("""INSERT INTO social_auth_account
                (id, provider_id, username, uid, extra_data, picture_url,
                 provider_domain)
        SELECT idprovider_agent_account.id, provider_id, username,
                userid AS uid, profile_info AS extra_data, picture_url,
                facebook_account.app_id AS provider_domain
        FROM idprovider_agent_account
        LEFT JOIN facebook_account
        ON facebook_account.id=idprovider_agent_account.id""")
        op.execute(
            """UPDATE identity_provider
            SET provider_type = 'google-oauth2'
            WHERE provider_type = 'google_oauth2'""")
        op.execute("""UPDATE abstract_agent_account
            SET type='social_auth_account'
            WHERE type IN ('idprovider_agent_account','facebook_account')""")
    with context.begin_transaction():
        op.drop_constraint(
            "facebook_access_token_facebook_account_fb_account_id_id",
            "facebook_access_token")
        op.drop_constraint(
            "facebook_source_facebook_account_creator_id_id",
            "facebook_source")
        op.create_foreign_key(
            "facebook_access_token_social_auth_account_fb_account_id_id",
            "facebook_access_token", "social_auth_account",
            ["fb_account_id"], ["id"])
        op.create_foreign_key(
            "facebook_source_social_auth_account_creator_id_id",
            "facebook_source", "social_auth_account",
            ["creator_id"], ["id"])
        op.drop_table("facebook_account")
        op.drop_table("idprovider_agent_account")


def downgrade(pyramid_env):
    with context.begin_transaction():
        op.create_table(
            "idprovider_agent_account",
            sa.Column("id", sa.Integer, sa.ForeignKey(
                    'abstract_agent_account.id',
                    ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True),
            sa.Column("provider_id", sa.Integer, sa.ForeignKey(
                    'identity_provider.id', ondelete='CASCADE',
                    onupdate='CASCADE'),
                nullable=False),
            sa.Column("username", sa.String(200)),
            sa.Column("domain", sa.String(200)),
            sa.Column("userid", sa.String(200), nullable=False),
            sa.Column("profile_info", sa.Text),
            sa.Column("picture_url", sa.String))
        op.create_table(
            "facebook_account",
            sa.Column("id", sa.Integer, sa.ForeignKey(
                    'idprovider_agent_account.id',
                    ondelete='CASCADE', onupdate='CASCADE'),
                primary_key=True),
            sa.Column("app_id", sa.String(512)))
        op.drop_constraint(
            "facebook_access_token_social_auth_account_fb_account_id_id",
            "facebook_access_token")
        op.drop_constraint(
            "facebook_source_social_auth_account_creator_id_id",
            "facebook_source")

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()

    with transaction.manager:
        db.execute(
            """UPDATE identity_provider
            SET provider_type = 'google_oauth2'
            WHERE provider_type = 'google-oauth2'""")

        providers = dict(list(db.execute(
            "SELECT id, provider_type from identity_provider")))
        old_domains = {
            'google_oauth2': 'accounts.google.com',
            'twitter': 'twitter.com',
            'facebook': 'facebook.com'}
        providers = {k: v for (k, v) in providers.iteritems()
                     if v in old_domains}
        prov_to_dom = {
            id: old_domains[prov]
            for (id, prov) in providers.iteritems()}
        case_clause = "CASE provider_id %s END" % "\n ".join([
            "WHEN %d THEN '%s'" % (id, dom)
            for (id, dom) in prov_to_dom.iteritems()])
        db.execute("""INSERT INTO idprovider_agent_account
            (id, provider_id, username, userid, profile_info, picture_url,
                domain)
            SELECT id, provider_id, username, uid AS userid,
                extra_data AS profile_info, picture_url, %s AS domain
        FROM social_auth_account
        WHERE provider_id IN (%s)""" % (
            case_clause, ",".join((str(s) for s in providers))))
        providers_inv = {v: k for (k, v) in providers.iteritems()}
        facebook_id = providers_inv['facebook']
        db.execute("""INSERT INTO facebook_account
            (id, app_id)
            SELECT id, provider_domain AS app_id FROM social_auth_account
            WHERE provider_id = %d""" % (facebook_id,))
        mark_changed()
        op.execute("""UPDATE abstract_agent_account
            SET type = 'idprovider_agent_account'
            WHERE type = 'social_auth_account'""")
        op.execute("""UPDATE abstract_agent_account
            SET type = 'facebook_account'
            WHERE id IN
                (SELECT id FROM social_auth_account WHERE provider_id = %d)""" % (
            facebook_id,))

    with context.begin_transaction():
        op.create_foreign_key(
            "facebook_access_token_facebook_account_fb_account_id_id",
            "facebook_access_token", "facebook_account",
            ["fb_account_id"], ["id"])
        op.create_foreign_key(
            "facebook_source_facebook_account_creator_id_id",
            "facebook_source", "facebook_account",
            ["creator_id"], ["id"])
