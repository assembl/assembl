# -*- coding: utf-8 -*-
from graphql_relay import from_global_id

from assembl import models
from assembl.views.api2.discussion import thread_csv_export
from assembl.views.traversal import InstanceContext
from freezegun import freeze_time


@freeze_time("2018-3-8")
def test_thread_csv_export(discussion, request, thread_phase_root_idea, user_language_preference_en_cookie,
                           top_post_in_thread_phase, second_post_in_thread_phase, third_post_in_thread_phase):
    request.GET = {}
    assert thread_phase_root_idea.message_view_override == 'thread'
    request.context = InstanceContext(None, discussion)
    header, results = thread_csv_export(request)
    assert len(results) == 3
    assert results[0]['Th\xc3\xa9matique niveau 1'] == 'Understanding the dynamics and issues'


@freeze_time("2018-3-8")
def test_thread_csv_export_moderated(discussion, request, thread_phase_root_idea,
                                     user_language_preference_en_cookie,
                                     top_post_in_thread_phase, second_post_in_thread_phase, third_post_in_thread_phase):
    request.GET = {'publicationStates': models.PublicationStates.DELETED_BY_ADMIN.value}
    top_post_instance_id = int(from_global_id(top_post_in_thread_phase)[1])
    top_post_instance = models.Post.get(top_post_instance_id)
    top_post_instance.delete_post(models.PublicationStates.DELETED_BY_ADMIN)
    request.context = InstanceContext(None, discussion)
    header, results = thread_csv_export(request)
    assert len(results) == 1
    assert results[0]['Thématique niveau 1'] == 'Understanding the dynamics and issues'
