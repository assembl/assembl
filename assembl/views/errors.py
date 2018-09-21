from enum import Enum

# These optional errors subtypes allow to refine the meaning of an
# HTTP error code, so the frontend can better direct the user to
# correct their action.
# In particular, it can specify affected form elements.
# which element is affected.
# Not mandatory unless it adds information that the frontend will use.


class ErrorTypes(Enum):
    """These are agreed-upon error names between frontend and backend.
    Always keep in sync with ..."""
    SHORT_NAME = 1
    INVALID_EMAIL = 2
    EXISTING_EMAIL = 3
    EXISTING_USERNAME = 4
    PASSWORD = 5
    INVALID_USERNAME = 6
    USERNAME_TOO_LONG = 7
    GENERIC = 8
