"""The administration views"""

def includeme(config):
    config.add_route('discussion_admin', '/admin/discussions/')
    config.add_route('general_permissions', '/admin/permissions')
    config.add_route('discussion_permissions',
                     '/admin/permissions/discussion/{discussion_id:\d+}')
    config.add_route('discussion_edit',
                     '/admin/discussion/edit/{discussion_id:\d+}')
    config.add_route('test_simultaneous_ajax_calls', '/admin/test_simultaneous_ajax_calls/')
