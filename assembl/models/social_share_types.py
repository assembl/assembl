from enum import Enum


class SocialShareTypes(Enum):
    FACEBOOK = 'FACEBOOK'
    TWITTER = 'TWITTER'
    LINKEDIN = "LINKEDIN"
    MAIL = "MAIL"

    @classmethod
    def values(cls):
        return cls._member_names_
