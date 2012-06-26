from __future__ import absolute_import

from email import header
import unittest

from pyramid import testing

from ...lib.email import patch_stdlib

ENCODED_WORDS = 'martin at v.loewis.de (=?UTF-8?B?Ik1hcnRpbiB2LiBMw7Z3aXMi?=)'
DECODED_WORDS = [('martin at v.loewis.de (', None),
                 ('"Martin v. L\xc3\xb6wis"', 'utf-8'),
                 (')', None)]


class TestEmail(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def tearDown(self):
        testing.tearDown()

    def test_encoded_words(self):
        patch_stdlib(silent=True)
        self.assertEqual(header.decode_header(ENCODED_WORDS), DECODED_WORDS)
