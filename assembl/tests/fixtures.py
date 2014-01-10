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
        discussion = DiscussionData.jacklayton


class IdeaData(DataSet):
    class idea1:
        discussion = DiscussionData.jacklayton
        short_title = u"idea 1"

    class idea11:
        discussion = DiscussionData.jacklayton
        short_title = u"idea 1.1"

    class idea2:
        discussion = DiscussionData.jacklayton
        short_title = u"idea 2"

    class idea21:
        discussion = DiscussionData.jacklayton
        short_title = u"idea 2.1"

    class idea211:
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
        creator = UserData.participant1
        subject = u"a root post"
        body = u"post body"
        type = "post"
        message_id = "msg1"
        discussion = DiscussionData.jacklayton

    class reply_post_1:
        creator = UserData.participant2
        subject = u"re1: root post"
        body = u"post body"
        type = "post"
        message_id = "msg2"
        discussion = DiscussionData.jacklayton

    class reply_post_2:
        creator = UserData.participant2
        subject = u"re2: root post"
        body = u"post body"
        type = "post"
        message_id = "msg3"
        discussion = DiscussionData.jacklayton

    class reply_post_3:
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
        content = PostData.reply_post_2
        idea = IdeaData.idea21
        discussion = DiscussionData.jacklayton


def setup_data(fixture):
    data = fixture.data(
        DiscussionData, UserData, UserRoleData, RootIdeaData,
        IdeaData, IdeaLinkData, PostData, ExtractData)
    data.setup()
    data.PostData.reply_post_1.parent = data.PostData.root_post_1
    data.PostData.reply_post_2.parent = data.PostData.reply_post_1
    data.PostData.reply_post_3.parent = data.PostData.root_post_1
    return data
