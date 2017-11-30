import base64

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding, hashes, serialization
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from .make_saml import private_key_from_cleaned_text


class Encrypter(object):
    def encrypt(self, message):
        raise NotImplementedError()


class Decrypter(object):
    def decrypt(self, message):
        raise NotImplementedError()


class AESDecrypter(Decrypter):
    def __init__(self, password, backend=None):
        backend = backend or default_backend()
        self.backend = backend
        self.password = password

    def decrypt(self, message):
        iv = base64.b64decode(message[:24])
        cipher = Cipher(
            algorithms.AES(self.password),
            modes.CBC(iv), backend=self.backend)
        message = base64.b64decode(message[24:])
        decryptor = cipher.decryptor()
        padded = decryptor.update(message)
        padded += decryptor.finalize()
        unpadder = padding.PKCS7(128).unpadder()
        decrypted = unpadder.update(padded)
        decrypted += unpadder.finalize()
        return decrypted


class MediactiveAESDecrypter(AESDecrypter):
    def __init__(self, password):
        backend = default_backend()
        digest = hashes.Hash(hashes.SHA256(), backend=backend)
        digest.update(password)
        password = digest.finalize()
        super(MediactiveAESDecrypter, self).__init__(password, backend)


class RSAEncrypter(Encrypter):
    def __init__(self, rsa_public_key):
        self.public_key = serialization.load_ssh_public_key(rsa_public_key)

    def encrypt(self, message):
        return self.public_key.encrypt(
            message,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA1()),
                algorithm=hashes.SHA1(),
                label=None
            )
        )


class RSADecrypter(Decrypter):
    def __init__(self, rsa_private_key):
        self.private_key = private_key_from_cleaned_text(rsa_private_key)
        self.public_key = self.private_key.public_key()

    def decrypt(self, ciphertext):
        return self.private_key.decrypt(
            ciphertext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA1()),
                algorithm=hashes.SHA1(),
                label=None
            )
        )
