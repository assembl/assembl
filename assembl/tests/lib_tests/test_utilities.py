import pytest
import unittest
#from pyramid import testing
from assembl.lib.locale import to_posix_string
from assembl.lib.locale import use_underscore
from assembl.lib.locale import get_country
from assembl.lib.locale import strip_country
from assembl.lib.locale import ensure_locale_has_country
from assembl.lib.locale import get_language
from assembl.tests.fixtures.base import test_webrequest


class TestUnderscore(object):

    def test_use_underscore_case1(self):
        locale = "fr-ca"
        assert use_underscore(locale) == "fr_ca"

    def test_use_underscore_case2(self):
        locale = "fr_ca"
        assert use_underscore(locale) == "fr_ca"

    def test_use_underscore_case3(self):
        locale = "frca"
        assert use_underscore(locale) == "frca"

    def test_use_underscore_case4(self):
        locale = ""
        assert use_underscore(locale) == ""


class TestToPosixString(object):

    def test_to_posix_string_case1(self):
        locale_code = ""
        assert to_posix_string(locale_code) == None

    def test_to_posix_string_case2(self):
        locale_code = "FR-CA"
        assert to_posix_string(locale_code) == "FR_CA"

    def test_to_posix_string_case3(self):
        locale_code = "fra-ca"
        assert to_posix_string(locale_code) == "fr_CA"


class TestGetLanguage(object):

    def test_get_language_case1(self):
        locale = "fr_CA"
        assert get_language(locale) == "fr"

    def test_get_language_case2(self):
        locale = "fr_ca"
        assert get_language(locale) == "fr"

    def test_get_language_case3(self):
        locale = "fr-ca"
        assert get_language(locale) == "fr"


class TestGetCountry(object):

    def test_get_country_case1(self):
        locale = "fr_CA"
        assert get_country(locale) == "CA"

    def test_get_country_case2(self):
        locale = "fr_ca"
        assert get_country(locale) == "CA"

    def test_get_country_case3(self):
        locale = ""
        assert get_country(locale) == None

    def test_get_country_case4(self):
        locale = "fr-ca"
        assert get_country(locale) == "CA"

    def test_get_country_case5(self):
        locale = "frCA"
        assert get_country(locale) == None


class TestStripCountry(object):

    def test_strip_country_case1(self):
        # There is only one case for this function since it assumes a posix
        # locale
        locale = "fr_FR"
        assert strip_country(locale) == "fr"


@pytest.mark.xfail
def test_ensure_locale_has_country(test_webrequest):
    localizer = test_webrequest.localizer
