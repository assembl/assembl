from assembl.views.api2.discussion import thread_csv_export
from assembl.views.traversal import InstanceContext
from freezegun import freeze_time


@freeze_time("2018-3-8")
def test_thread_csv_export(request, discussion, thread_phase_root_idea, top_post_in_thread_phase, second_post_in_thread_phase, third_post_in_thread_phase):
    request.GET = {}
    assert thread_phase_root_idea.message_view_override in ('thread', None)
    import pdb; pdb.set_trace()
    request.context = InstanceContext(None, discussion)
    results = thread_csv_export(request)
    import pdb; pdb.set_trace()
