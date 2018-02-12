"""
Patch SAML classes from social-auth until
https://github.com/python-social-auth/social-core/pull/193 is merged
"""
from social_core.backends.saml import (
    OID_USERID, SAMLAuth as _SAMLAuth,
    SAMLIdentityProvider as _SAMLIdentityProvider)


class SAMLIdentityProvider(_SAMLIdentityProvider):
    def get_user_permanent_id(self, attributes):
        uid = attributes[self.conf.get('attr_user_permanent_id', OID_USERID)]
        if isinstance(uid, list):
            uid = uid[0]
        return uid


class SAMLAuth(_SAMLAuth):
    def get_idp(self, idp_name):
        """Given the name of an IdP, get a SAMLIdentityProvider instance"""
        idp_config = self.setting('ENABLED_IDPS')[idp_name]
        return SAMLIdentityProvider(idp_name, **idp_config)
