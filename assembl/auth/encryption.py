"""A few symmetric encryption routines"""

import base64
from os import urandom

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding, hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


class Encryptor(object):
    def encrypt(self, message):
        raise NotImplementedError()


class Decryptor(object):
    def decrypt(self, message):
        raise NotImplementedError()


class AESDecryptor(Decryptor):
    """A decryptor that uses AES symmetric keys"""

    IV_ENC_LENGTH = 24  # 4/3 of IV_LENGTH due to base64
    BLOCK_LENGTH = 128

    def __init__(self, password, backend=None):
        backend = backend or default_backend()
        self.backend = backend
        self.password = password

    def decrypt(self, message):
        iv = base64.b64decode(message[:self.IV_ENC_LENGTH])
        cipher = Cipher(
            algorithms.AES(self.password),
            modes.CBC(iv), backend=self.backend)
        message = base64.b64decode(message[self.IV_ENC_LENGTH:])
        decryptor = cipher.decryptor()
        padded = decryptor.update(message)
        padded += decryptor.finalize()
        unpadder = padding.PKCS7(self.BLOCK_LENGTH).unpadder()
        decrypted = unpadder.update(padded)
        decrypted += unpadder.finalize()
        return decrypted


class AESEncryptor(Encryptor):
    """An encryptor that uses AES symmetric keys"""

    IV_LENGTH = 16
    BLOCK_LENGTH = 128

    def __init__(self, password, backend=None):
        backend = backend or default_backend()
        self.backend = backend
        self.password = password

    def encrypt(self, message):
        iv = urandom(self.IV_LENGTH)
        cipher = Cipher(
            algorithms.AES(self.password),
            modes.CBC(iv), backend=self.backend)
        encryptor = cipher.encryptor()
        padder = padding.PKCS7(self.BLOCK_LENGTH).padder()
        padded = padder.update(message)
        padded += padder.finalize()
        encrypted = encryptor.update(padded)
        encrypted += encryptor.finalize()
        return base64.b64encode(iv) + base64.b64encode(encrypted)


class AESCryptor(AESDecryptor, AESEncryptor):
    pass


class MediactiveAESCryptor(AESCryptor):
    """Mediactive uses the SHA hash of the key as a key"""

    def __init__(self, password):
        backend = default_backend()
        digest = hashes.Hash(hashes.SHA256(), backend=backend)
        digest.update(password)
        password = digest.finalize()
        super(MediactiveAESCryptor, self).__init__(password, backend)
