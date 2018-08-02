from enum import Enum
# from assembl.lib.decl_enums import DeclEnum


class CookieTypes(Enum):
    ACCEPT_CGU = 'ACCEPT_CGU'
    ACCEPT_SESSION_ON_DISCUSSION = 'ACCEPT_SESSION_ON_DISCUSSION'
    ACCEPT_TRACKING_ON_DISCUSSION = 'ACCEPT_TRACKING_ON_DISCUSSION'
    ACCEPT_PRIVACY_POLICY_ON_DISCUSSION = 'ACCEPT_PRIVACY_POLICY_ON_DISCUSSION'
    LOCALE = 'LOCALE'

    @classmethod
    def values(cls):
        return cls._member_names_
