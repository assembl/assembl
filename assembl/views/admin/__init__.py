"""The administration views"""
from assembl.lib.frontend_urls import FrontendUrls


def frontend_include(config):
    FrontendUrls.register_frontend_admin_routes(config)


def includeme(config):
    config.add_route('base_admin', '/admin')
    config.add_route('discussion_admin', '/admin/discussions/')
    config.add_route('general_permissions', '/admin/permissions')
    config.add_route('discussion_permissions',
                     '/admin/permissions/discussion/{discussion_id:\d+}')
    config.add_route('discussion_edit',
                     '/admin/discussion/edit/{discussion_id:\d+}')
    config.add_route('test_simultaneous_ajax_calls', '/admin/test_simultaneous_ajax_calls/')
    config.include(frontend_include, route_prefix='/admin')
