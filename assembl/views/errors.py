from enum import Enum

# Only specify and NOT_FOUND if it adds information that the FE might
# care about, over and beyond the HTTP code. Furthermore, be very
# specific about what was not found. Eg. USER_NOT_FOUND vs NOT_FOUND


class ErrorTypes(Enum):
    """These are agreed-upon error names between frontend and backend.
    Always keep in sync with ..."""
    SHORT_NAME = 1
    INVALID_EMAIL = 2
    EXISTING_EMAIL = 3
    EXISTING_USERNAME = 4
    PASSWORD = 5
    INVALID_USERNAME = 6
