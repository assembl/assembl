# -*- coding: utf-8 -*-

import pytest


def test_delete_widget(
        test_session, creativity_session_widget,
        creativity_session_widget_new_idea):
    test_session.flush()
    test_session.delete(creativity_session_widget)
    test_session.flush()
