from os import urandom
from binascii import hexlify, unhexlify
import hashlib

from ..lib import config
from ..db import DBSession

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
