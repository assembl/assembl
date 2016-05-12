from os import urandom
from binascii import hexlify, unhexlify
import hashlib
from datetime import datetime, timedelta
from base64 import urlsafe_b64encode, urlsafe_b64decode
from urllib import unquote

from enum import IntEnum
from assembl.lib import config
from ..models import AbstractAgentAccount, User

SALT_SIZE = 8


class HashEncoding(IntEnum):
    BINARY = 0
    HEX = 1
    BASE64 = 2


class Validity(IntEnum):
    VALID = 0
    EXPIRED = 1
    BAD_HASH = 2
    DATA_NOT_FOUND = 3
    INVALID_FORMAT = 4


PASSWORD_CHANGE_TOKEN_DURATION = timedelta(days=3)
VALIDATE_EMAIL_TOKEN_DURATION = timedelta(days=500)


def hash_password(password, encoding=HashEncoding.BINARY, salt_size=SALT_SIZE):
    """
    Returns a hashed password.
    """
    salt = urandom(salt_size)
    hasher = hashlib.new(config.get('security.hash_algorithm') or 'sha256')
    if not isinstance(password, unicode):
        password = password.decode('utf-8')
    hasher.update(password.encode('utf-8'))
    hasher.update(salt)
    if encoding == HashEncoding.BINARY:
        return salt + hasher.digest()
    elif encoding == HashEncoding.HEX:
        return hexlify(salt) + hasher.hexdigest()
    elif encoding == HashEncoding.BASE64:
        return urlsafe_b64encode(salt) + urlsafe_b64encode(hasher.digest())
    raise ValueError()


def verify_password(password, hash, encoding=HashEncoding.BINARY,
                    salt_size=SALT_SIZE):
    """
    Verifies a password against a salted hash
    """
    if encoding == HashEncoding.BINARY:
        salt, hash = hash[:salt_size], hash[salt_size:]
    elif encoding == HashEncoding.HEX:
        salt_len = 2 * salt_size
        salt, hash = unhexlify(hash[:salt_len]), unhexlify(hash[salt_len:])
    elif encoding == HashEncoding.BASE64:
        hash = str(unquote(hash))
        salt_len = 4 * int((salt_size+2)/3)
        salt, hash = (urlsafe_b64decode(hash[:salt_len]),
                      urlsafe_b64decode(hash[salt_len:]))
    else:
        raise ValueError()

    hasher = hashlib.new(config.get('security.hash_algorithm') or 'sha256')
    if not isinstance(password, unicode):
        password = password.decode('utf-8')
    hasher.update(password.encode('utf-8'))
    hasher.update(salt)
    return hasher.digest() == hash


def email_token(email):
    return data_token(
        str(email.id), VALIDATE_EMAIL_TOKEN_DURATION, email.email)


def email_token_legacy(email):
    return str(email.id)+'f'+hash_password(
        str(email.id) + email.email + config.get('security.email_token_salt'),
        HashEncoding.HEX)


def password_change_token(user):
    return data_token(
        str(user.id), PASSWORD_CHANGE_TOKEN_DURATION, user.name)


def password_change_token_legacy(user):
    now = datetime.utcnow()
    user.last_login = now
    resolution = 19
    token_str = str(user.id)+now.isoformat()[:resolution]
    print "hashing " + token_str
    return str(user.id)+'e'+hash_password(token_str, HashEncoding.HEX)


def data_token(data, duration=timedelta(hours=1), extra_hash_data=''):
    expiry = datetime.utcnow() + duration
    expiry_str = expiry.strftime('%Y%j%H%M%S')
    password = (data + extra_hash_data + expiry_str +
                config.get('security.email_token_salt'))
    hash = hash_password(password, HashEncoding.BASE64, 3)
    return "%02x%s%s%s" % (len(data), data, expiry_str, hash)


def verify_data_token(token, extra_hash_data=''):
    try:
        pos = 2
        pos += int(token[:pos], 16)
        data = token[2:pos]
        expiry_str = token[pos:pos + 13]
        pos += 13
        hash = token[pos:]
        expiry = datetime.strptime(expiry_str, '%Y%j%H%M%S')
        password = (data + extra_hash_data + expiry_str +
                    config.get('security.email_token_salt'))
        if not verify_password(password, hash, HashEncoding.BASE64, 3):
            return data, Validity.BAD_HASH
        if datetime.utcnow() > expiry:
            return data, Validity.EXPIRED
        return data, Validity.VALID
    except ValueError:
        return None, Validity.INVALID_FORMAT


def get_data_token_time(token, timedelta=None):
    try:
        pos = 2
        pos += int(token[:pos], 16)
        expiry = token[pos:pos + 13]
        expiry = datetime.strptime(expiry, '%Y%j%H%M%S')
        if timedelta:
            expiry -= timedelta
        return expiry
    except ValueError:
        return None


def verify_email_token(token):
    data, valid = verify_data_token(token)
    if valid == Validity.BAD_HASH:
        try:
            data = int(data)
        except:
            return None, Validity.INVALID_FORMAT
        email = AbstractAgentAccount.get(data)
        if not email:
            return None, Validity.DATA_NOT_FOUND
        data, valid = verify_data_token(token, email.email)
        return email, valid
    # Try decoding legacy
    try:
        id, hash = token.split('f', 1)
        email = AbstractAgentAccount.get(int(id))
        if not email:
            return None, Validity.DATA_NOT_FOUND
        if verify_password(
            str(email.id) + email.email + config.get(
                'security.email_token_salt'), hash, HashEncoding.HEX):
                return email, Validity.VALID
        return email, Validity.BAD_HASH
    except:
        return None, Validity.INVALID_FORMAT


def verify_password_change_token(token):
    data, valid = verify_data_token(token)
    if valid == Validity.BAD_HASH:
        try:
            data = int(data)
        except:
            return None, Validity.INVALID_FORMAT
        user = User.get(data)
        if not user:
            return None, Validity.DATA_NOT_FOUND
        data, valid = verify_data_token(token, user.name)
        return user, valid
    # Try decoding legacy
    try:
        id, hash = token.split('e', 1)
        id = int(id)
        user = User.get(id)
        if not user:
            return user, Validity.DATA_NOT_FOUND
        age = datetime.utcnow() - user.last_login
        if age > PASSWORD_CHANGE_TOKEN_DURATION:
            return user, Validity.EXPIRED
        check = str(id)+user.last_login.isoformat()[:19]
        valid = verify_password(
            check, hash, HashEncoding.HEX)
        if not valid:
            return user, Validity.BAD_HASH
        return user, Validity.VALID
    except:
        return None, Validity.INVALID_FORMAT
