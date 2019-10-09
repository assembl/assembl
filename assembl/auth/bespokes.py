from social_core.backends.saml import SAMLAuth

from assembl.lib.logging import getLogger

log = getLogger('assembl')

_email_whitelist = set()


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

    def auth_allowed(self, response, details):
        """Return True if the user should be allowed to authenticate, by
        default check if email is whitelisted (if there's a whitelist)"""
        global _email_whitelist
        if not _email_whitelist:
            import csv
            whitelist_file = self.setting('WHITELISTED_EMAILS', None)
            if whitelist_file:
                with open(whitelist_file) as f:
                    reader = csv.reader(f)
                    # Assume single column of emails
                    for row in reader:
                        _email = row[0]
                        if _email and isinstance(_email, basestring):
                            _email_whitelist.add(_email.lower())

        email = details.get('email')
        allowed = True
        if email and _email_whitelist:
            allowed = email.lower() in _email_whitelist
        return allowed
