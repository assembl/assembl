from social_core.backends.saml import SAMLAuth

from assembl.lib.logging import getLogger

log = getLogger('assembl')


class SNCFSAMLAuth(SAMLAuth):

    def extra_data(self, user, uid, response, details=None, *args, **kwargs):
        data = super(SNCFSAMLAuth, self).extra_data(
            user, uid, response, details=details, *args, **kwargs)
        # Force the display name on assembl
        name = self.display_name(response)
        if name:
            data['forced_display_name'] = name
        return data

    def display_name(self, data):
        return SNCFSAMLAuth.get_display_name(data)

    @classmethod
    def get_display_name(cls, data):
        """
        Business logic of the forced display name of the user in Assembl
        """
        try:
            attrs = data.get('attributes', None)
            if not attrs:
                raise Exception
            first_name = attrs.get('givenName', None)
            if first_name:
                first_name = first_name[0].capitalize()
            last_name = attrs.get('sn', None)
            if last_name:
                last_name = last_name[0].capitalize()[0]
            if not (first_name and last_name):
                raise Exception
            return "%s.%s" % (first_name, last_name)
        except Exception:
            log.error("[SAML Backend] Failed to populate extra data for social user with data %s" % data)
            return None
