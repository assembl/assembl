from fixture import DataSet

from . import get_fixture


class DiscussionData(DataSet):
    class jacklayton:
        topic = "Jack Layton"
        slug = "jacklayton2"


class SynthesisData(DataSet):
    class next_synthesis:
        discussion = DiscussionData.jacklayton


# class AgentProfileData(DataSet):
#     class admin:
#         name = "Mr. Adminstrator"
#         type = "agent_profile"

#     class participant1:
#         name = "A. Barking Loon"
#         type = "agent_profile"

#     class participant2:
#         name = "James T. Expert"
#         type = "agent_profile"


class UserData(DataSet):
    class admin:
        #id = AgentProfileData.admin.ref('id')
        name = "Mr. Adminstrator"
        type = "user"

    class participant1:
        #id = AgentProfileData.participant1.ref('id')
        name = "A. Barking Loon"
        type = "user"

    class participant2:
        #id = AgentProfileData.participant2.ref('id')
        name = "James T. Expert"
        type = "user"


AgentProfileData = UserData


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
        short_title = "idea 1"

    class idea11:
        discussion = DiscussionData.jacklayton
        short_title = "idea 1.1"

    class idea2:
        discussion = DiscussionData.jacklayton
        short_title = "idea 2"

    class idea21:
        discussion = DiscussionData.jacklayton
        short_title = "idea 2.1"

    class idea211:
        discussion = DiscussionData.jacklayton
        short_title = "idea 2.1.1"


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
        creator = AgentProfileData.participant1
        subject = "a root post"
        body = "post body"
        type = "post"
        message_id = "msg1"
        discussion = DiscussionData.jacklayton

    class reply_post_1:
        creator = AgentProfileData.participant2
        subject = "re1: root post"
        body = "post body"
        type = "post"
        message_id = "msg2"
        discussion = DiscussionData.jacklayton

    class reply_post_2:
        creator = AgentProfileData.participant2
        subject = "re2: root post"
        body = "post body"
        type = "post"
        message_id = "msg3"
        discussion = DiscussionData.jacklayton

    class reply_post_3:
        creator = AgentProfileData.participant2
        subject = "re3: root post"
        body = "post body"
        type = "post"
        message_id = "msg4"
        discussion = DiscussionData.jacklayton


class ExtractData(DataSet):
    class an_extract:
        body = "body"
        creator = AgentProfileData.participant2
        owner = AgentProfileData.participant2
        content = PostData.reply_post_2
        idea = IdeaData.idea21
        discussion = DiscussionData.jacklayton


def setup_data(fixture):
    data = fixture.data(
        DiscussionData, UserData, UserRoleData, RootIdeaData,
        IdeaData, IdeaLinkData, PostData, ExtractData, SynthesisData)
    data.setup()
    data.PostData.reply_post_1.parent = data.PostData.root_post_1
    data.PostData.reply_post_2.parent = data.PostData.reply_post_1
    data.PostData.reply_post_3.parent = data.PostData.root_post_1
    return data
