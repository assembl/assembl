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


def make_saml_key():
    key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    key_text = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption())
    return (key_text, key)


def private_key_from_cleaned_text(key_text):
    key_text = '\n'.join([l.strip() for l in
                          str(key_text).strip('\n').split('\n')])
    key_text = "-----BEGIN RSA PRIVATE KEY-----\n\n%s\n-----END RSA PRIVATE KEY-----\n" % key_text
    return serialization.load_pem_private_key(
        key_text, password=None, backend=default_backend())


def make_saml_cert(key, country=None, state=None, locality=None, org=None,
                   domain=None, email=None, alt_names=None, days=365,
                   self_sign=True):
    if isinstance(key, basestring):
        key = private_key_from_cleaned_text(key)
    if alt_names and isinstance(alt_names, basestring):
        alt_names = alt_names.decode('utf-8').split()
    name_components = []
    if country:
        name_components.append(x509.NameAttribute(
            NameOID.COUNTRY_NAME, country.decode('utf-8')))
    if state:
        name_components.append(x509.NameAttribute(
            NameOID.STATE_OR_PROVINCE_NAME, state.decode('utf-8')))
    if locality:
        name_components.append(x509.NameAttribute(
            NameOID.LOCALITY_NAME, locality.decode('utf-8')))
    if org:
        name_components.append(x509.NameAttribute(
            NameOID.ORGANIZATION_NAME, org.decode('utf-8')))
    if domain:
        name_components.append(x509.NameAttribute(
            NameOID.COMMON_NAME, domain.decode('utf-8')))
    if email:
        name_components.append(x509.NameAttribute(
            NameOID.EMAIL_ADDRESS, email.decode('utf-8')))
    subject = x509.Name(name_components)
    pkey = key.public_key()
    skid = x509.SubjectKeyIdentifier.from_public_key(pkey)
    if self_sign:
        # Create self-signed
        serial_number = random_serial_number()
        builder = x509.CertificateBuilder()
    else:
        builder = x509.CertificateSigningRequestBuilder()
    builder = builder.subject_name(
        subject
    ).add_extension(
        x509.KeyUsage(True, False, False, False, True, False, False, False, False), False
    )
    if alt_names:
        # Describe what sites we want this certificate for.
        builder = builder.add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName(n) for n in alt_names]),
            critical=False)
    if self_sign:
        builder = builder.public_key(
            pkey
        ).issuer_name(
            subject
        ).serial_number(
            serial_number
        ).not_valid_before(
            datetime.datetime.utcnow()
        ).not_valid_after(
            datetime.datetime.utcnow() + datetime.timedelta(days=days)
        ).add_extension(
            skid, False
        ).add_extension(
            x509.AuthorityKeyIdentifier(
                skid.digest, [x509.DirectoryName(subject)], serial_number), False
        )
    else:
        builder = builder.add_extension(
            x509.BasicConstraints(True, 0), False)

    builder = builder.sign(key, hashes.SHA256(), default_backend())
    builder_text = builder.public_bytes(serialization.Encoding.PEM)
    return (builder_text, builder)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Process some integers.')
    parser.add_argument(
        '-s' '--sign', dest='self_sign', action='store_true',
        help='Do we self-sign the certificate or create a CSR')
    parser.add_argument(
        '-d' '--domain', dest='domain',
        default="assembl-enterprise.bluenove.com",
        help='The domain name that will be used as CN')
    parser.add_argument(
        '-c' '--country', dest='country', default="FR",
        help='The country (two-letter code)')
    parser.add_argument(
        '-e' '--email', dest='email', default="assembl@bluenove.com",
        help='The email')
    parser.add_argument(
        '-l' '--locality', dest='locality', default="Levallois-Perret",
        help='The locality')
    parser.add_argument(
        '--state', dest='state', default="Hauts-de-Seine",
        help='The state')
    parser.add_argument(
        '-o', '--org', dest='org', default="Bluenove",
        help='The organization')
    parser.add_argument(
        '-t', '--days', dest='days', default=1000, type=int,
        help='Time to live (days)')
    args = parser.parse_args()
    key_text, key = make_saml_key()
    crt_text, crt = make_saml_cert(key, **vars(args))
    print key_text
    print
    print crt_text
