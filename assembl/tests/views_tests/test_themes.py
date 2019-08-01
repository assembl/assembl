import uuid

from assembl.views import find_theme, populate_theme_information, extract_resources_hash
from assembl.tests.fixtures.base import get_resources_html
from assembl.tests.utils import update_configuration


def test_find_themes():
    # At least the default theme should be present.  Enough for a canary test
    theme_name = 'default'
    expected_relative_path = 'default'
    retval = find_theme(theme_name)
    assert retval == expected_relative_path, "find_themes returned %s but we expected %s" % (retval, expected_relative_path)


class TestResources(object):

    def test_get_resources_hash(self):
        theme_name = "my_theme"
        Uuid = uuid.uuid4().hex
        resources_hash = extract_resources_hash(get_resources_html(Uuid, theme_name), theme_name, Uuid)
        expected = {
            'bundle_hash': '5aae461a0604ace7cd31',
            'theme_js_file': '/build/themes/{uuid}/my_theme/theme_my_theme_web.ed5786109ac04600f1d5.js'.format(uuid=Uuid),
            'bundle_css_hash': '5f3e474ec0d2193c8af5'
        }
        assert expected['bundle_hash'] == resources_hash['bundle_hash']
        assert expected['bundle_css_hash'] == resources_hash['bundle_css_hash']

    def test_get_null_resources_hash(self):
        theme_name = "my_theme"
        resources_hash = extract_resources_hash("", theme_name)
        expected = {
            'bundle_hash': None,
            'theme_js_file': None,
            'bundle_css_hash': None
        }
        assert expected['bundle_hash'] == resources_hash['bundle_hash']
        assert expected['theme_js_file'] == resources_hash['theme_js_file']
        assert expected['bundle_css_hash'] == resources_hash['bundle_css_hash']


def test_populate_theme_v1():
    expected = 'default'
    result = populate_theme_information(1)
    assertion = True
    for v in result.values():
        if v != expected:
            assertion = False
    assert assertion


def test_populate_theme_v2_production_mode(base_registry, static_build):
    with update_configuration(base_registry.settings, under_test=False, use_webpack_server=False):
        data = populate_theme_information()
        css_filename = data.get('css_style', "")
        bundle_filename = data.get('js_bundle', "")

    assert css_filename == 'style.12345abc.css'
    assert bundle_filename == 'bundle.12345abc.js'
