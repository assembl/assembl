from os import urandom

from assembl.auth.encryption import AESCryptor, MediactiveAESCryptor


payload = "This is a message of a certain length, hopefully longer than the RSA key."


def test_aes_cryptor():
    password = urandom(16)
    cryptor = AESCryptor(password)
    assert payload == cryptor.decrypt(cryptor.encrypt(payload))


def test_mediactive_cryptor():
    password = urandom(16)
    cryptor = MediactiveAESCryptor(password)
    assert payload == cryptor.decrypt(cryptor.encrypt(payload))
