# -*- coding: utf-8 -*-

import json
from urllib import urlencode

from assembl.models import (
    Idea, Post
)


def get_url(discussion, suffix):
    return '/api/v1/discussion/%d/%s' % (
        discussion.id,
        suffix,
    )


def test_extracts(
        discussion, participant1_user, reply_post_2, test_app, extract):
    user = participant1_user
    extract_user = {
        "@id": 'local:AgentProfile/'+str(user.id),
        "name": user.name,
        "@type": "User"}
    extract_data = {
        "idIdea": None,
        "creator": extract_user,
        "owner": extract_user,
        "text": "Let's lower taxes to fav",
        "creationDate": 1376573216160,
        "target": {
            "@type": "email",
            "@id": 'local:Post/'+str(reply_post_2.id)
        }
    }

    url = get_url(discussion, 'extracts')
    res = test_app.get(url)
    assert res.status_code == 200
    extracts = json.loads(res.body)
    assert len(extracts) == 1

    url = get_url(discussion, 'extracts')
    res = test_app.post(url, json.dumps(extract_data))
    assert res.status_code == 200
    res_data = json.loads(res.body)
    extract_id = res_data['id']

    url = get_url(discussion, 'extracts')
    res = test_app.get(url, json.dumps(extract_data))
    assert res.status_code == 200
    extracts = json.loads(res.body)
    assert len(extracts) == 2

    assert extract_id in [e['@id'] for e in extracts]


def test_homepage_returns_200(test_app):
    res = test_app.get('/')
    assert res.status_code == 200


def test_get_ideas(discussion, test_app, test_session):
    url = get_url(discussion, 'ideas')
    res = test_app.get(url)
    assert res.status_code == 200

    ideas = json.loads(res.body)
    num_ideas = len(ideas)

    idea = Idea(
        long_title='This is a long test',
        short_title='This is a test',
        discussion=discussion
    )
    test_session.add(idea)
    url = get_url(discussion, 'ideas')
    res = test_app.get(url)
    assert res.status_code == 200

    ideas = json.loads(res.body)
    assert len(ideas) == num_ideas+1


def test_get_posts_from_idea(
        discussion, test_app, test_session, subidea_1,
        subidea_1_1, subidea_1_1_1, extract, reply_post_2):
    base_url = get_url(discussion, 'posts')
    url = base_url + "?" + urlencode({"root_idea_id": subidea_1.uri()})
    res = test_app.get(url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['total'] == 0
    url = base_url + "?" + urlencode({"root_idea_id": subidea_1_1.uri()})
    res = test_app.get(url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['total'] == 2

def test_mailbox_import_jacklayton(discussion, test_app, jack_layton_mailbox):
    base_url = get_url(discussion, 'posts')
    url = base_url
    res = test_app.get(url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['total'] == 20
    
    #Verify duplicates
    jack_layton_mailbox.do_import_content(jack_layton_mailbox, True)
    assert res_data['total'] == 20, "No duplicate messages should have been imported, but there are now %d messages" % res_data['total']
    
        # Verify they are all imported.  one() will throw an exception if any of them didn't import
    db = discussion.db
    post1 = db.query(Post).filter(
            Post.message_id == "<1606949.IA7dUeR8YG@benoitg-t510>"
        ).one()
    post2 = db.query(Post).filter(
            Post.message_id == "<1649857.fOz6x3G98J@benoitg-t510>"
        ).one()
    post3 = db.query(Post).filter(
            Post.message_id == "<3844624.NgDPPPZZnZ@benoitg-t510>"
        ).one()
    post4 = db.query(Post).filter(
            Post.message_id == "<1930166.Wt7Goto29c@benoitg-t510>"
        ).one()
    post5 = db.query(Post).filter(
            Post.message_id == "<2249242.d9RG67mvG7@benoitg-t510>"
        ).one()
    post6 = db.query(Post).filter(
            Post.message_id == "<5376192.Toza0VnpdF@benoitg-t510>"
        ).one()
    post7 = db.query(Post).filter(
            Post.message_id == "<2046194.jVzdDay1Sb@benoitg-t510>"
        ).one()
    post8 = db.query(Post).filter(
            Post.message_id == "<2338275.cGRvA7U2KY@benoitg-t510>"
        ).one()
    post9 = db.query(Post).filter(
            Post.message_id == "<1963559.rNfOy2bq8q@benoitg-t510>"
        ).one()
    post10 = db.query(Post).filter(
            Post.message_id == "<1908535.hooWnbd4Oz@benoitg-t510>"
        ).one()
    post11 = db.query(Post).filter(
            Post.message_id == "<2252973.BLQDMMaPU7@benoitg-t510>"
        ).one()
    post12 = db.query(Post).filter(
            Post.message_id == "<2198317.hep6mv1tM8@benoitg-t510>"
        ).one()
    post13 = db.query(Post).filter(
            Post.message_id == "<1802537.GgBR6HT3SE@benoitg-t510>"
        ).one()
    post14 = db.query(Post).filter(
            Post.message_id == "<CAKqvEwBXC5+hHJ7Vqe2uOxhvq0tjiPBFGTgrKgBJWg-8OJvK4g@mail.gmail.com>"
        ).one()
    post15 = db.query(Post).filter(
            Post.message_id == "<2408793.IU72A2SQDE@benoitg-t510>"
        ).one()
    post16 = db.query(Post).filter(
            Post.message_id == "<7106333.QhO54ZOExH@benoitg-t510>"
        ).one()
    post17 = db.query(Post).filter(
            Post.message_id == "<2879230.SgxIZcuISG@benoitg-t510>"
        ).one()
    post18 = db.query(Post).filter(
            Post.message_id == "<1790712.Gl4igCGcWl@benoitg-t510>"
        ).one()
    post19 = db.query(Post).filter(
            Post.message_id == "<1720706.VGpvc9NSuf@benoitg-t510>"
        ).one()
    post20 = db.query(Post).filter(
            Post.message_id == "<2400278.6mpFWar2xg@benoitg-t510>"
        ).one()

    #Verify threading is correct
    """
    1-  Harper says: Let's [A:lower taxes] to [B:favor economic growth]. <1606949.IA7dUeR8YG@benoitg-t510>
        |
    2-  |-Khadir says: [E:You will put everyone out of a job]! <1649857.fOz6x3G98J@benoitg-t510>
        | |
    17- | |-Late participant says:  That makes no sense, why would that make anyone lose his job? <2879230.SgxIZcuISG@benoitg-t510>
        |   |
    18- |   |-Syndicalist says:  With [H: lower government revenue], the [I: government will be forced to cut jobs]. <1790712.Gl4igCGcWl@benoitg-t510>
        |
    3-  |-Mulcair says: Lowering taxes is a terrible idea! <3844624.NgDPPPZZnZ@benoitg-t510>
        | |
    5-  | |-Typical Quebecker: Jack Layton was a nice guy, he's dead. <2249242.d9RG67mvG7@benoitg-t510>
        | | |
    6-  | | |-Animator: And what did he think of of lowering taxes? <5376192.Toza0VnpdF@benoitg-t510>
        | |   |
    7-  | |   |-Typical Quebecker: He was against it. <2046194.jVzdDay1Sb@benoitg-t510>
        | |     |
    11- | |     |-Animator: Why? <2252973.BLQDMMaPU7@benoitg-t510>
        | |       |
    12- | |       |-Typical Quebecker: I don't know... <2198317.hep6mv1tM8@benoitg-t510>
        | |         |
    13- | |         |-Animator: But you agree with him on that? <1802537.GgBR6HT3SE@benoitg-t510>
        | |           |
    14- | |           |-Typical Quebecker: Yes! <CAKqvEwBXC5+hHJ7Vqe2uOxhvq0tjiPBFGTgrKgBJWg-8OJvK4g@mail.gmail.com>
        |
    4-  |-Suzuki says: [B:Economic growth] will mean [C:more resource consumption], and that's [D:bad for the environment]. <1930166.Wt7Goto29c@benoitg-t510>
          |
    8-    |-Krugman says: [In a recession], [F:austerity] is actually [G:contractionary]. <2338275.cGRvA7U2KY@benoitg-t510>
            |
    9-      |-Animator: Huh? Not sure I follow you... <1963559.rNfOy2bq8q@benoitg-t510>
            | |
    10-     | |-Krugman: Lowering taxes causes austerity, which reduces economic activity. <1908535.hooWnbd4Oz@benoitg-t510>
            | |
    15-     | |-Syndicalist says:  [J:People loose their job]! <2408793.IU72A2SQDE@benoitg-t510>
            |   |
    16-     |   |-Québec city talk radio says:  Union workers are all lazy bums, good ridance! <7106333.QhO54ZOExH@benoitg-t510>
            |
    19-     |-Suzuki says: Maybe, but with the most severe cuts in environmental programs, it's still [K:no good for the environment]. <1720706.VGpvc9NSuf@benoitg-t510>
              |
    20-       |-Harper says:  [L:Federal environmental programs are ineffective] and a waste of money. <2400278.6mpFWar2xg@benoitg-t510>
    """
    assert post1.parent == None
    assert len(post1.children) == 3
    assert post2.parent == post1
    assert post3.parent == post1
    assert len(post3.children) == 1
    assert post4.parent == post1
    assert len(post4.children) == 1
    assert post5.parent == post3
    assert len(post5.children) == 1
    assert post6.parent == post5
    assert len(post6.children) == 1
    assert post7.parent == post6
    assert len(post7.children) == 1
    assert post8.parent == post4
    assert len(post8.children) == 2
    assert post9.parent == post8
    assert len(post9.children) == 2
    assert post10.parent == post9
    assert len(post10.children) == 0
    assert post11.parent == post7
    assert len(post11.children) == 1
    assert post12.parent == post11
    assert len(post12.children) == 1
    assert post13.parent == post12
    assert len(post13.children) == 1
    assert post14.parent == post13, "Forwarded messages did not go to original thread"
    assert len(post14.children) == 0
    assert post15.parent == post9
    assert len(post15.children) == 1
    assert post16.parent == post15
    assert len(post16.children) == 0
    assert post17.parent == post2
    assert len(post17.children) == 1
    assert post18.parent == post17
    assert len(post18.children) == 0
    assert post19.parent == post8
    assert len(post19.children) == 1
    assert post20.parent == post19
    assert len(post20.children) == 0
    