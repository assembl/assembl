import pytest
import uuid

from assembl.views import find_theme, populate_theme_information, extract_resources_hash, extract_v1_resources_hash


def test_find_themes():
    # At least the default theme should be present.  Enough for a canary test
    theme_name = 'default'
    expected_relative_path = 'default'
    retval = find_theme(theme_name)
    assert retval == expected_relative_path, "find_themes returned %s but we expected %s" % (retval, expected_relative_path)


def get_resources_html(uuid, theme_name="default"):
    return """
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Caching</title>
        <link href="/build/themes/default/theme_default_web.8bbb970b0346866e3dac.css" rel="stylesheet">
        <link href="/build/themes/{uuid}/{theme_name}/theme_{theme_name}_web.8bbb970b0346866e3dac.css" rel="stylesheet">
        <link href="/build/bundle.5f3e474ec0d2193c8af5.css" rel="stylesheet">
        <link href="/build/searchv1.04e4e4b2fab45a2ab04e.css" rel="stylesheet">
      </head>
      <body>
        <script type="text/javascript" src="/build/themes/default//theme_default_web.ed5786109ac04600f1d5.js"></script>
        <script type="text/javascript" src="/build/themes/{uuid}/{theme_name}/theme_{theme_name}_web.ed5786109ac04600f1d5.js"></script>
        <script type="text/javascript" src="/build/bundle.5aae461a0604ace7cd31.js"></script>
        <script type="text/javascript" src="/build/searchv1.b8939cd89ebdedfd2901.js"></script>
      </body>
    </html>
    """.format(theme_name=theme_name, uuid=uuid)


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
        assert expected['theme_js_file'] == resources_hash['theme_js_file']
        assert expected['bundle_css_hash'] == resources_hash['bundle_css_hash']

    def test_get_v1_resources_hash(self):
        resources_hash = extract_v1_resources_hash(get_resources_html("_"))
        expected = {
            'search_hash': 'b8939cd89ebdedfd2901',
            'search_css_hash': '04e4e4b2fab45a2ab04e'
        }
        assert expected['search_hash'] == resources_hash['search_hash']
        assert expected['search_css_hash'] == resources_hash['search_css_hash']

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
    result = populate_theme_information('some-theme', 1)
    assertion = True
    for v in result.values():
        if v != expected:
            assertion = False
    assert assertion


def test_populate_theme_v2():
    import os
    import shutil
    build_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        'static2/build'
    )
    resources_html = os.path.join(build_path, 'resources.html')
    resources_html_tmp = os.path.join(build_path, 'resources.html.tmp')
    if os.path.exists(build_path) and os.path.exists(resources_html):
        shutil.move(resources_html, resources_html_tmp)
        with pytest.raises(Exception) as exc:
            populate_theme_information('some-theme', 2)
        shutil.move(resources_html_tmp, resources_html)
    else:
        with pytest.raises(Exception) as exc:
            populate_theme_information('some-theme', 2)
    assert 'more information regarding the bundle and themes' in str(exc.value)


def test_populate_theme_v2_resource_exists_no_config():
    import os
    build_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        'static2/build'
    )
    resources_html = os.path.join(build_path, 'resources.html')
    if not os.path.exists(resources_html):
        Uuid = uuid.uuid4().hex
        resources_html = get_resources_html(Uuid)
        with open(resources_html, 'w') as f:
            f.seek(0)
            f.write(resources_html)
    data = populate_theme_information()
    non_build_css_path = data.get('theme_css_file', "").replace("/build", "")
    assert non_build_css_path in data.get('full_theme_url')
