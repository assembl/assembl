import pytest
from assembl.views.discussion.views import get_assembl_version
import pkg_resources

def test_get_assembl_version_as_admin(test_app, test_adminuser_webrequest, test_app_no_perm, admin_user, discussion):
    assert get_assembl_version(discussion) == pkg_resources.get_distribution("assembl").version
    
def test_get_assembl_version_as_participant(test_app, test_participant1_webrequest, test_app_no_perm, participant1_user, discussion):
    assert get_assembl_version(discussion) == ""
