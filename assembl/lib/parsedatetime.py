import isodate


def parse_datetime(value, raise_error=None):
    """Parse a datetime from a ISO 8601 string"""
    try:
        if 'T' not in value:
            value += "T00:00:00"
        value = isodate.parse_datetime(value)
        # we store naive UTC in the database.
        if value.tzinfo is not None:
            value -= value.utcoffset()
            value = value.replace(tzinfo=None)
        return value
    except isodate.ISO8601Error as e:
        if raise_error:
            raise e
        return None
