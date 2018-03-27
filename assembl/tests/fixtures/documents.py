# -*- coding: utf-8 -*-
"""File/document related fixtures."""
import os

import pytest


@pytest.fixture(scope="function")
def simple_file(request, discussion, test_session):
    from assembl.models import File
    f = File(
        discussion=discussion,
        mime_type='image/png',
        title='simple_image.png'
    )

    test_session.add(f)
    f.add_raw_data(os.urandom(256))
    test_session.flush()

    def fin():
        print "finalizer simple_file"
        f.delete_file()
        test_session.delete(f)
        test_session.flush()

    request.addfinalizer(fin)
    return f


@pytest.fixture(scope="function")
def simple_file2(request, discussion, test_session):
    from assembl.models import File
    f = File(
        discussion=discussion,
        mime_type='application/pdf',
        title='mydocument.pdf'
    )

    test_session.add(f)
    f.add_raw_data(os.urandom(256))
    test_session.flush()

    def fin():
        print "finalizer simple_file"
        f.delete_file()
        test_session.delete(f)
        test_session.flush()

    request.addfinalizer(fin)
    return f
