from assembl.views import populate_theme_information
from assembl.tests.utils import update_configuration


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


def test_populate_theme_v2_development_mode(base_registry):
    with update_configuration(base_registry.settings, under_test=True, use_webpack_server=True):
        data = populate_theme_information()
        css_filename = data.get('css_style', "")
        bundle_filename = data.get('js_bundle', "")

    assert css_filename == 'style.css'
    assert bundle_filename == 'bundle.js'
