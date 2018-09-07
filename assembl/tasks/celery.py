"""
This module fakes flower into believing there is a "celery" module in assembl
with all the tasks. You can monitor celery tasks with:

::

    celery -A assembl.tasks -b redis://localhost:6379/0 flower
"""

from . import celery
