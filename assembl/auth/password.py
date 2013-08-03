def hash_password(password):
    """
    Returns a hashed password.
    """
    ## TODO: everything in this function.
    return 'PASSWORD!'


def format_token(user):
    ## TODO: everything in this function.
    'Format user information into a cookie'
    code = 'x' + str(user.id)  # WRONG! It needs to be stable but random.
    return [code]
