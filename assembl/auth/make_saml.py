import datetime

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
try:
    from cryptography.x509 import random_serial_number
except ImportError:
    # Old cryptography version
    from cryptography import utils
    import os

    def random_serial_number():
        return utils.int_from_bytes(os.urandom(20), "big") >> 1


def cleanup_x509_text(txt):
    kts = txt.split('\n')
    kt = ['  ' + x for x in kts if len(x) and
          not (x.startswith('----') and x.endswith('----'))]
    return '  ' + '\n  '.join(kt) + '\n'


def make_saml_key(
        country='', state='', locality='', org='', cn='', email='',
        alt_names=None, days=365):
    if alt_names and isinstance(alt_names(str, unicode)):
        alt_names = alt_names.split()
    key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    key_text = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption())
    subject = x509.Name([
        # Provide various details about who we are.
        x509.NameAttribute(NameOID.COUNTRY_NAME, unicode(country)),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, unicode(state)),
        x509.NameAttribute(NameOID.LOCALITY_NAME, unicode(locality)),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, unicode(org)),
        x509.NameAttribute(NameOID.COMMON_NAME, unicode(cn)),
        x509.NameAttribute(NameOID.EMAIL_ADDRESS, unicode(email)),
    ])
    pkey = key.public_key()
    skid = x509.SubjectKeyIdentifier.from_public_key(pkey)
    # Create self-signed
    serial_number = random_serial_number()
    crt = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        subject
    ).public_key(
        pkey
    ).serial_number(
        serial_number
    ).not_valid_before(
        datetime.datetime.utcnow()
    ).not_valid_after(
        # Our certificate will be valid for 10 days
        datetime.datetime.utcnow() + datetime.timedelta(days=days)
    ).add_extension(
        x509.BasicConstraints(True, 0), False
    ).add_extension(
        skid, False
    )
    crt = crt.add_extension(
        x509.AuthorityKeyIdentifier(
            skid.digest, [x509.DirectoryName(subject)], serial_number), False
    )
    if alt_names:
        # Describe what sites we want this certificate for.
        crt = crt.add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName(n) for n in altnames]),
            critical=False)
    crt = crt.sign(key, hashes.SHA256(), default_backend())
    crt_text = crt.public_bytes(serialization.Encoding.PEM)
    return cleanup_x509_text(key_text), cleanup_x509_text(crt_text)


if __name__ == '__main__':
    saml_info = {"country": "FR", "state": "Hauts-de-Seine",
                 "locality": "Levallois-Perret", "org": "Bluenove",
                 "cn": "assembl-enterprise.bluenove.com",
                 "email": "assembl@bluenove.com"}
    (key, crt) = make_saml_key(**saml_info)
    print key, crt
