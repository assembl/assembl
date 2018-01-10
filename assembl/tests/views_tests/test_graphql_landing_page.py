from assembl.graphql.schema import Schema as schema


def test_query_landing_page_module_types(graphql_request):
    query = u"""query LandingPageModuleTypes($lang: String!) {
        landingPageModuleTypes {
            titleEntries {
                localeCode
                value
            }
            title(lang: $lang)
            defaultOrder
            editableOrder
            helperImgUrl
            identifier
            required
        }
    }
    """
    res = schema.execute(
        query,
        context_value=graphql_request,
        variable_values={"lang": u"en"})
    assert res.errors is None
    assert len(res.data['landingPageModuleTypes']) == 11
    for module_type in res.data['landingPageModuleTypes']:
        if module_type['identifier'] == 'INTRODUCTION':
            assert module_type['title'] == u'Introduction'
            assert module_type['defaultOrder'] == 2.0
            assert module_type['editableOrder'] is True
            assert module_type['helperImgUrl'] == u''
            assert module_type['required'] is False
