from enum import Enum


class ErrorTypes(Enum):
    """These are agreed-upon error names between frontend and backend.
    Always keep in sync with ..."""
    SHORT_NAME = 1
    INVALID_EMAIL = 2
    EXISTING_EMAIL = 3
    EXISTING_USERNAME = 4
    PASSWORD = 5
    INVALID_USERNAME = 6
    NOT_FOUND = 7
