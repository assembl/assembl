from os import urandom
from binascii import hexlify, unhexlify
import hashlib
from datetime import datetime, timedelta

from assembl.lib import config
from ..models import EmailAccount, User
from ..lib import config

SALT_SIZE = 8


def hash_password(password, hex=False):
    """
    Returns a hashed password.
    """
    salt = urandom(SALT_SIZE)
    hasher = hashlib.new(config.get('security.hash_algorithm') or 'sha256')
    hasher.update(password)
    hasher.update(salt)
    if hex:
        return hexlify(salt) + hasher.hexdigest()
    else:
        return salt + hasher.digest()


def verify_password(password, hash, hex=False):
    """
    Verifies a password against a salted hash
    """
    if hex:
        salt, hash = unhexlify(hash[:(2*SALT_SIZE)]), hash[(2*SALT_SIZE):]
    else:
        salt, hash = hash[:SALT_SIZE], hash[SALT_SIZE:]
    hasher = hashlib.new(config.get('security.hash_algorithm') or 'sha256')
    hasher.update(password)
    hasher.update(salt)
    if hex:
        return hasher.hexdigest() == hash
    else:
        return hasher.digest() == hash


def email_token(email):
    return str(email.id)+'f'+hash_password(
        str(email.id) + email.email + config.get('security.email_token_salt'), True)


def format_token(user):
    ## TODO: everything in this function.
    'Format user information into a cookie'
    code = 'x' + str(user.id)  # WRONG! It needs to be stable but random.
    return [code]

def password_token(user):
    now = datetime.now()
    user.last_login = now
    resolution=19
    token_str = str(user.id)+now.isoformat()[:resolution]
    print "hashing "+token_str
    return str(user.id)+'e'+hash_password(token_str, True)


def verify_email_token(token):
    id, hash = token.split('f', 1)
    email = EmailAccount.get(int(id))
    if email and verify_password(
        str(email.id) + email.email + config.get(
            'security.email_token_salt'), hash, True):
            return email


def verify_password_change_token(token, duration):
    id, hash = token.split('e', 1)
    id = int(id)
    user = User.get(id)
    if not user:
        return False, None
    age = datetime.now() - user.last_login
    if age > timedelta(duration/24.0):
        return False, id
    check = str(id)+user.last_login.isoformat()[:19]
    valid = verify_password(
        check, hash, True)
    if not valid:
        return False, id
    return True, id
