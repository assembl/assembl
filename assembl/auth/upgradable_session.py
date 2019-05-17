from abc import ABCMeta, abstractmethod

from beaker.session import Session


# Note: pull request soon to propose this in Beaker.
class UpgradableSession(Session):
    "A Session with different expiry parameters for elevated privileges"
    __metaclass__ = ABCMeta

    def __init__(self, request, elevated=False,
                 cookie_expires=True, elevated_expires=False, **kwargs):
        self.elevated_expires = elevated_expires
        self.basic_expires = cookie_expires
        self.elevated = False
        super(UpgradableSession, self).__init__(
            request, cookie_expires=cookie_expires, **kwargs)
        self.elevated = self.get_is_elevated()
        self._set_cookie_expires(None)

    @abstractmethod
    def get_is_elevated(self):
        """Returns whether the session is considered elevated.

        Define in subclass so initial value is set properly."""
        return False

    def _set_cookie_expires(self, expires):
        if self.elevated:
            self.cookie_expires = self.elevated_expires
        else:
            self.cookie_expires = self.basic_expires
        super(UpgradableSession, self)._set_cookie_expires(expires)

    def elevate_privilege(self, elevated=True):
        """Set whether a session has elevated privileges.

        Maybe this should be added to Session protocol?"""
        if self.elevated != elevated:
            self.elevated = elevated
            self.regenerate_id()


class AssemblUpgradableSession(UpgradableSession):
    def get_is_elevated(self):
        return bool(self.get("auth.userid", False))
