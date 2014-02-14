from fixture import DataSet

from . import get_fixture


class DiscussionData(DataSet):
    class jacklayton:
        topic = u"Jack Layton"
        slug = "jacklayton2"


class UserData(DataSet):
    class admin:
        name = u"Mr. Adminstrator"
        type = "user"

    class participant1:
        name = u"A. Barking Loon"
        type = "user"

    class participant2:
        name = u"James T. Expert"
        type = "user"


class UserRoleData(DataSet):
    class admin_role:
        user = UserData.admin
        role_id = 7  # need to do better...

    class p1_role:
        user = UserData.participant1
        role_id = 3

    class p2_role:
        user = UserData.participant2
        role_id = 3


class MailboxData(DataSet):
    class jlmailbox:
        discussion = DiscussionData.jacklayton


class RootIdeaData(DataSet):
    class root_idea:
        #A root idea is created by the discussion, so this is not truly the
        #root idea...
        id = 2
        discussion = DiscussionData.jacklayton


class IdeaData(DataSet):
    class idea1:
        id = 3
        discussion = DiscussionData.jacklayton
        short_title = u"idea 1"

    class idea11:
        id = 4
        discussion = DiscussionData.jacklayton
        short_title = u"idea 1.1"

    class idea2:
        id = 5
        discussion = DiscussionData.jacklayton
        short_title = u"idea 2"

    class idea21:
        id = 6
        discussion = DiscussionData.jacklayton
        short_title = u"idea 2.1"

    class idea211:
        id = 7
        discussion = DiscussionData.jacklayton
        short_title = u"idea 2.1.1"


class IdeaLinkData(DataSet):
    class link_r_1:
        source = RootIdeaData.root_idea
        target = IdeaData.idea1

    class link_1_11:
        source = IdeaData.idea1
        target = IdeaData.idea11

    class link_r_2:
        source = RootIdeaData.root_idea
        target = IdeaData.idea2

    class link_2_21:
        source = IdeaData.idea2
        target = IdeaData.idea21

    class link_21_211:
        source = IdeaData.idea21
        target = IdeaData.idea211


class PostSourceData(DataSet):
    class a_source:
        name = 'a source'
        type = 'post_source'
        discussion = DiscussionData.jacklayton


class PostData(DataSet):
    class root_post_1:
        id = 1
        creator = UserData.participant1
        subject = u"a root post"
        body = u"post body"
        type = "post"
        message_id = "msg1"
        discussion = DiscussionData.jacklayton

    class reply_post_1:
        id = 2
        creator = UserData.participant2
        subject = u"re1: root post"
        body = u"post body"
        type = "post"
        message_id = "msg2"
        discussion = DiscussionData.jacklayton

    class reply_post_2:
        id = 3
        creator = UserData.participant2
        subject = u"re2: root post"
        body = u"post body"
        type = "post"
        message_id = "msg3"
        discussion = DiscussionData.jacklayton

    class reply_post_3:
        id = 4
        creator = UserData.participant2
        subject = u"re3: root post"
        body = u"post body"
        type = "post"
        message_id = "msg4"
        discussion = DiscussionData.jacklayton


class ExtractData(DataSet):
    class an_extract:
        body = u"body"
        creator = UserData.participant2
        owner = UserData.participant2
        content_id = PostData.reply_post_2.id
        idea_id = IdeaData.idea21.id
        discussion = DiscussionData.jacklayton


def setup_data(fixture):
    data = fixture.data(
        DiscussionData, UserData, UserRoleData, RootIdeaData,
        IdeaData, IdeaLinkData, PostData, ExtractData)
    data.setup()
    data.PostData.reply_post_1._stored_object().parent = \
        data.PostData.root_post_1._stored_object()
    data.PostData.reply_post_2._stored_object().parent = \
        data.PostData.reply_post_1._stored_object()
    data.PostData.reply_post_3._stored_object().parent = \
        data.PostData.root_post_1._stored_object()
    return data
