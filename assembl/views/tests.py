# -*- coding: utf-8 -*-
import smtplib
import re
import quopri

import json
import pytest
from urllib import urlencode, quote_plus
import mock

from assembl.views import find_theme


def test_find_themes():
    # At least the default theme should be present.  Enough for a canari test
    theme_name = 'default'
    expected_relative_path = 'default'
    retval = find_theme(theme_name)
    assert retval == expected_relative_path, "find_themes returned %s but we expected %s" % (retval, expected_relative_path)


