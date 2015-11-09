from os import urandom
from binascii import hexlify, unhexlify
import hashlib
from datetime import datetime, timedelta
from base64 import urlsafe_b64encode, urlsafe_b64decode

from enum import Enum
from assembl.lib import config
from ..models import EmailAccount, User

SALT_SIZE = 8


class HashEncoding(Enum):
    BINARY = 0
    HEX = 1
    BASE64 = 2


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
    return str(email.id)+'f'+hash_password(
        str(email.id) + email.email + config.get('security.email_token_salt'),
        HashEncoding.HEX)


def password_token(user):
    now = datetime.utcnow()
    user.last_login = now
    resolution=19
    token_str = str(user.id)+now.isoformat()[:resolution]
    print "hashing "+token_str
    return str(user.id)+'e'+hash_password(token_str, HashEncoding.HEX)


def data_token(data, duration=timedelta(hours=1)):
    expiry = datetime.utcnow() + duration
    expiry_str = expiry.strftime('%Y%j%H%M%S')
    password = data + expiry_str + config.get('security.email_token_salt')
    hash = hash_password(password, HashEncoding.BASE64, 3)
    return "%02x%s%s%s" % (len(data), data, expiry_str, hash)


def verify_data_token(token):
    try:
        pos = 2
        pos += int(token[:pos], 16)
        data = token[2:pos]
        expiry_str = token[pos:pos+13]
        pos += 13
        hash = token[pos:]
        expiry = datetime.strptime(expiry_str, '%Y%j%H%M%S')
        if datetime.utcnow() > expiry:
            return None
        password = data + expiry_str + config.get('security.email_token_salt')
        if not verify_password(password, hash, HashEncoding.BASE64, 3):
            return None
        return data
    except ValueError:
        return None


def verify_email_token(token):
    id, hash = token.split('f', 1)
    email = EmailAccount.get(int(id))
    if email and verify_password(
        str(email.id) + email.email + config.get(
            'security.email_token_salt'), hash, HashEncoding.HEX):
            return email


def verify_password_change_token(token, duration):
    id, hash = token.split('e', 1)
    id = int(id)
    user = User.get(id)
    if not user:
        return False, None
    age = datetime.utcnow() - user.last_login
    if age > timedelta(duration/24.0):
        return False, id
    check = str(id)+user.last_login.isoformat()[:19]
    valid = verify_password(
        check, hash, HashEncoding.HEX)
    if not valid:
        return False, id
    return True, id
