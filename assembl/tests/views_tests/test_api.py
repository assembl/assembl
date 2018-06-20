# -*- coding: utf-8 -*-

import json
import re
import quopri
import mock
import pytest
from urlparse import urlparse
from urllib import unquote
from urllib import urlencode, quote_plus

from assembl.models import (
    Idea, Post, Email, User, LangString
)


def get_url(discussion, suffix):
    return '/api/v1/discussion/%d/%s' % (
        discussion.id,
        suffix,
    )


def test_extracts(discussion, participant1_user, reply_post_2, test_app,
                  subidea_1_1, extract_post_1_to_subidea_1_1):
    from assembl.models import Extract
    user = participant1_user
    extract_user = {
        "@id": user.uri(),
        "name": user.name,
        "@type": User.external_typename()}
    extract_data = {
        "idIdea": None,
        "creator": extract_user,
        "owner": extract_user,
        "text": "Let's lower taxes to fav",
        "creationDate": 1376573216160,
        "target": {
            "@type": Email.external_typename(),
            "@id": reply_post_2.uri()
        }
    }

    base_url = get_url(discussion, 'extracts')
    #Load collection
    res = test_app.get(base_url)
    assert res.status_code == 200
    extracts = json.loads(res.body)
    assert len(extracts) == 1

    #Load extract directly
    res = test_app.get(base_url + "/" + quote_plus(extract_post_1_to_subidea_1_1.uri()))
    assert res.status_code == 200
    extract_json = json.loads(res.body)
    assert extract_json['@id'] == extract_post_1_to_subidea_1_1.uri()

    #Check the API returns a 404 for extracts that never existed
    res = test_app.get(base_url + "/" + quote_plus("id_that_does_not_exist"), expect_errors=True)
    assert res.status_code == 404

    #Create (Post)
    res = test_app.post(base_url, json.dumps(extract_data))
    assert res.status_code == 200
    res_data = json.loads(res.body)
    extract_id = res_data['@id']
    assert extract_id != None

    #Check collection
    res = test_app.get(base_url, json.dumps(extract_data))
    assert res.status_code == 200
    extracts = json.loads(res.body)
    assert len(extracts) == 2
    assert extract_id in [e['@id'] for e in extracts]

    #Update (PUT)
    #TODO:  We should test this field by field
    url = base_url + "/" + quote_plus(extract_id)
    modified_extract_data = extract_data.copy()
    modified_extract_data["idIdea"] = subidea_1_1.uri()
    res = test_app.put(url, json.dumps(modified_extract_data))
    assert res.status_code == 200
    discussion.db.flush()
    res = test_app.get(url)
    assert res.status_code == 200
    extract_json = json.loads(res.body)
    assert extract_json['idIdea'] == subidea_1_1.uri()

    # Delete
    res = test_app.delete(base_url + "/" + quote_plus(extract_id))
    assert res.status_code == 204
    # Check collection after delete
    res = test_app.get(base_url, json.dumps(extract_data))
    assert res.status_code == 200
    extracts = json.loads(res.body)
    assert len(extracts) == 1
    assert extract_id not in [e['@id'] for e in extracts]

    # FIXME:  This should actually return 410 gone now
    res = test_app.get(base_url + "/" + quote_plus(extract_id),
                       expect_errors=True)
    assert res.status_code == 404


def test_homepage_returns_200(test_app):
    res = test_app.get('/')
    assert res.status_code == 200


def test_get_ideas_single(discussion, test_app, test_session, subidea_1):
    url = get_url(discussion, 'ideas')
    res = test_app.get(url + "/" + str(subidea_1.id))
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['@id'] == subidea_1.uri(), "Idea API returned %s but we expected %s" % (res_data['@id'], subidea_1.uri())


def test_get_ideas(discussion, test_app, test_session, test_webrequest):
    url = get_url(discussion, 'ideas')
    res = test_app.get(url)
    assert res.status_code == 200

    ideas = json.loads(res.body)
    num_ideas = len(ideas)

    idea = Idea(
        synthesis_title=LangString.create('This is a long test', 'en'),
        title=LangString.create('This is a test', 'en'),
        discussion=discussion
    )
    test_session.add(idea)
    test_session.flush()
    test_session.commit()
    url = get_url(discussion, 'ideas')
    res = test_app.get(url)
    assert res.status_code == 200

    ideas = json.loads(res.body)
    assert len(ideas) == num_ideas + 1


def test_edit_idea_title(test_app, test_session, discussion, discussion_admin_user, subidea_1):
    """As a discussion admin, I can edit the title of an idea (I don't get an Unauthorized error for editing langstring properties of an idea)"""

    # Step 1: Send a PUT API call to modify idea's title, and check that response is 200 and not Unauthorized or 404

    # Here we re-create the same input LangString format that the frontend sends to our API.
    # We don't have a LangString method that outputs this data structure yet (the ones we have need a owner_object)
    modified_idea_title = "Couvrir la lune de miroirs"
    modified_idea_title_langstring = {
        "@type": "LangString",
        "entries": [
            {
                "@type": "LangStringEntry",
                "@language": "fr",
                "value": modified_idea_title
            }
        ]
    }

    payload = { 'shortTitle': modified_idea_title_langstring }
    base_idea_url = get_url(discussion, 'ideas')
    idea_url = base_idea_url + '/' + str(subidea_1.id)
    response = test_app.put_json(idea_url, payload)
    response_data = json.loads(response.body)
    assert response.status_code == 200
    assert response_data['ok'] == True

    # Step 2: Send a GET API call to check that idea's title has really been updated

    response2 = test_app.get(idea_url)
    assert response2.status_code == 200
    response2_data = json.loads(response2.body)
    assert modified_idea_title in json.dumps(response2_data)


def disabledtest_next_synthesis_idea_management(
        discussion, test_app, test_session,
        root_idea, subidea_1, subidea_1_1, subidea_1_1_1):
    # This needs to be rewritten to use the new mechanisms
    base_idea_url = get_url(discussion, 'ideas')
    next_synthesis_url = get_url(discussion,
                                 'explicit_subgraphs/synthesis/next_synthesis')
    res = test_app.get(next_synthesis_url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert len(res_data['ideas']) == 0

    subidea_url = base_idea_url + "/" + str(subidea_1.id)
    res = test_app.get(subidea_url)
    assert res.status_code == 200
    subidea_data = json.loads(res.body)
    assert subidea_data['@id'] == subidea_1.uri()
    assert subidea_data['inNextSynthesis'] == False

    subidea_data['inNextSynthesis'] = True

    res = test_app.put(subidea_url, json.dumps(subidea_data))
    assert res.status_code == 200

    res = test_app.get(subidea_url)
    assert res.status_code == 200
    subidea_1_data = json.loads(res.body)
    assert subidea_1_data['inNextSynthesis'] == True

    res = test_app.get(next_synthesis_url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert len(res_data['ideas']) == 1, 'Idea wasn\'t added to the synthesis'

    # Add a idea to synthesis that isn't a direct child of it's parent
    subidea_url = base_idea_url + "/" + str(subidea_1_1_1.id)
    res = test_app.get(subidea_url)
    assert res.status_code == 200
    subidea_data = json.loads(res.body)
    assert subidea_data['@id'] == subidea_1_1_1.uri()
    assert subidea_data['inNextSynthesis'] == False

    subidea_data['inNextSynthesis'] = True

    res = test_app.put(subidea_url, json.dumps(subidea_data))
    assert res.status_code == 200

    res = test_app.get(subidea_url)
    assert res.status_code == 200
    subidea_1_data = json.loads(res.body)
    assert subidea_1_data['inNextSynthesis'] == True

    res = test_app.get(next_synthesis_url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert len(res_data['ideas']) == 2, 'Idea wasn\'t added to the synthesis'


def test_api_register(discussion, test_app_no_perm,
                      test_webrequest):
    from assembl.models import AbstractAgentAccount
    test_app_no_perm.app.registry.\
        settings['assembl.validate_registration_emails'] = 'true'
    with mock.patch('repoze.sendmail.mailer.SMTPMailer.smtp') as mock_mail:
        mailer = mock_mail.return_value
        mailer.set_debuglevel.return_value = None
        mailer.has_extn.return_value = False
        mailer.connect.return_value = (220, 'Service ready')
        mailer.ehlo.return_value = (250, 'Completed')
        mailer.does_esmtp.return_value = False
        mailer.sendmail.return_value = {}
        mailer.quit.return_value = (221,
                                    'Service closing transmission channel')

        # Register
        email = "jsmith@example.com"
        password = '12345'
        path = test_webrequest.route_path('register')
        r = test_app_no_perm.post(path, {
            'name': "John Smith",
            'email': email,
            'password': password,
            'password2': password,
        })
        assert r.status_code == 302
        discussion.subscribe_to_notifications_on_signup = True
        discussion.db.flush()
        # How is the user looking?
        account = discussion.db.query(
            AbstractAgentAccount).filter_by(email=email).first()
        assert not account.profile.verified
        assert len(account.profile.notification_subscriptions) == 0
        # Register step 2
        r = test_app_no_perm.get(r.location)
        # Sent
        assert r.status_code == 200
        assert mailer.sendmail.call_count == 1
        # Get token
        mail_text = mailer.sendmail.call_args[0][2]
        mail_text = quopri.decodestring(mail_text)
        token = re.search(r'email_confirm/([^>]+)>', mail_text)
        assert token
        token = token.group(1)
        assert token
        # Confirm token
        path = test_webrequest.route_path('user_confirm_email', token=token)
        r = test_app_no_perm.get(path)
        assert r.status_code == 302 and urlparse(r.location).path == '/'
        assert account.verified
        assert account.profile.verified
        discussion.db.flush()
        path = test_webrequest.route_path(
            'contextual_login', discussion_slug=discussion.slug)
        r = test_app_no_perm.post(path, dict(
            identifier=email, password=password, ))
        assert r.status_code == 302
        discussion.db.flush()
        discussion.db.expire(account.profile, ["notification_subscriptions"])
        assert len(account.profile.notification_subscriptions) > 0


@pytest.mark.xfail
def test_csv_subscribe(discussion, test_app_no_perm,
                       test_app, test_webrequest):
    from assembl.models import User, AbstractAgentAccount
    test_app_no_perm.app.registry.\
        settings['assembl.validate_registration_emails'] = 'true'
    with mock.patch('repoze.sendmail.mailer.SMTPMailer.smtp') as mock_mail:
        mailer = mock_mail.return_value
        mailer.set_debuglevel.return_value = None
        mailer.has_extn.return_value = False
        mailer.connect.return_value = (220, 'Service ready')
        mailer.ehlo.return_value = (250, 'Completed')
        mailer.does_esmtp.return_value = False
        mailer.sendmail.return_value = {}
        mailer.quit.return_value = (221,
                                    'Service closing transmission channel')

        discussion.subscribe_to_notifications_on_signup = True
        discussion.db.flush()
        # Register
        email = "bsmith@example.com"
        csv_text = "Bob Smith,%s\n" % (email,)
        data = dict(
            add_with_role="r:participant",
            send_invite="checked",
            sender_name="",
            email_subject="test",
            submit_user_file="select",
            text_email_message="",
            html_email_message="")
        r = test_app.post(
            "/admin/permissions/discussion/%d" % (discussion.id,), params=data,
            upload_files=[("user_csvfile", "bob.csv", csv_text)])
        assert r.status_code == 200
        discussion.subscribe_to_notifications_on_signup = True
        discussion.db.flush()
        # How is the user looking?
        account = discussion.db.query(AbstractAgentAccount).\
            filter_by(email="bsmith@example.com").first()
        assert account.profile.verified
        assert len(account.profile.agent_status_in_discussion) == 0
        assert len(account.profile.notification_subscriptions) == 0
        # Register step 2
        assert mailer.sendmail.call_count == 1
        # Get token
        mail_text = mailer.sendmail.call_args[0][2]
        mail_text = quopri.decodestring(mail_text)
        link = re.search(r'href="(http:[^"]+)"', mail_text)
        assert link
        link = link.group(1)
        assert link
        # Logged in with link
        r = test_app_no_perm.get(link)
        discussion.db.flush()
        assert r.status_code == 302
        r = test_app_no_perm.get(r.location)
        assert r.status_code == 200
        form = r.lxml.xpath('//form')[0]
        r = test_app_no_perm.post(form.attrib['action'], params=dict(
            token=unquote(link.split('/')[-1]),
            password1="abcd",
            password2="abcd",
            email=email,
            change_password="select"))
        assert r.status_code == 302 and urlparse(
            r.location).path == test_webrequest.route_path(
            'home', discussion_slug=discussion.slug)
        discussion.db.expire(account.profile, [
            "agent_status_in_discussion", "notification_subscriptions"])
        assert len(account.profile.notification_subscriptions) > 0
        assert len(account.profile.agent_status_in_discussion) > 0


def test_api_get_posts_queries(
        discussion, test_app, test_session, participant1_user,
        root_post_1, reply_post_1, reply_post_2):
    base_post_url = get_url(discussion, 'posts')

    # Check initial conditions from post api
    url = base_post_url
    res = test_app.get(url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['total'] == 3

    # Test date queries
    url = base_post_url + \
        "?posted_before_date=2000-01-02T00%3A00%3A00.000Z&view=id_only"
    res = test_app.get(url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['total'] == 1
    assert res_data['posts'][0]['@id'] == root_post_1.uri()

    url = base_post_url + \
        "?posted_after_date=2000-01-02T00%3A00%3A00.000Z&view=id_only"
    res = test_app.get(url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['total'] == 2

    # TODO: Other query types, and sorting


def test_api_weird_failure_on_joinedload(
        discussion, test_app, test_session, participant1_user,
        root_post_1, reply_post_1, reply_post_2):
    base_post_url = get_url(discussion, 'posts')

    url = base_post_url + "?posted_before_date=2000-01-02T00%3A00%3A00.000Z"
    res = test_app.get(url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['total'] == 1
    assert res_data['posts'][0]['@id'] == root_post_1.uri()


def test_api_get_posts_from_idea(
        discussion, test_app, test_session, participant1_user,
        root_idea, subidea_1, subidea_1_1, subidea_1_1_1,
        root_post_1, reply_post_1, reply_post_2):
    base_post_url = get_url(discussion, 'posts')
    base_idea_url = get_url(discussion, 'ideas')
    base_extract_url = get_url(discussion, 'extracts')

    # Check initial conditions from post api
    url = base_post_url
    res = test_app.get(url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['total'] == 3

    # Check initial conditions from idea api
    res = test_app.get(base_idea_url + "/" + str(root_idea.id))
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['num_total_and_read_posts'][0] == 3
    assert res_data['num_orphan_posts'] == 3

    def check_number_of_posts(idea, expected_num, fail_msg):
        # Check from idea API
        discussion.db.flush()
        res = test_app.get(base_idea_url + "/" + str(idea.id))
        assert res.status_code == 200
        res_data = json.loads(res.body)
        assert res_data['num_total_and_read_posts'][0] == expected_num, "idea API returned %d but %s" % (res_data['num_total_and_read_posts'][0], fail_msg)

        url = base_post_url + "?" + urlencode({"root_idea_id": idea.uri()})
        res = test_app.get(url)
        assert res.status_code == 200
        res_data = json.loads(res.body)
        # print(repr(res_data))
        # TODO: BENOITG:  THERE IS A SESSION PROBLEM HERE
        assert res_data['total'] == expected_num, "post API returned %d but %s" % (res_data['total'],fail_msg)

    def check_total_and_orphans(expected_total, expected_orphans):
        # Check orphans from idea api
        res = test_app.get(base_idea_url + "/" + str(root_idea.id))
        assert res.status_code == 200
        res_data = json.loads(res.body)
        assert res_data['num_total_and_read_posts'][0] == expected_total
        # Known to fail. I get 0 on v6, ? on v7.
        assert res_data['num_orphan_posts'] == expected_orphans

    check_number_of_posts(subidea_1, 0, "Initially no posts are linked")
    check_number_of_posts(subidea_1_1, 0, "Initially no posts are linked")
    check_number_of_posts(subidea_1_1_1, 0, "Initially no posts are linked")

    user = participant1_user
    extract_user = {
        "@id": user.uri(),
        "name": user.name,
        "@type": User.external_typename()}
    base_extract_data = {
        "idIdea": None,
        "creator": extract_user,
        "owner": extract_user,
        "text": "Let's lower taxes to fav",
        "creationDate": 1376573216160,
        "target": {
            "@type": Email.external_typename(),
            "@id": None
        },
        "ranges": [{
            "start": "//div1",
            "end": "//div2",
            "startOffset": "1",
            "endOffset": "2"
        }]
    }
    # Create extract
    extract_data = base_extract_data.copy()
    extract_data["idIdea"] = subidea_1_1.uri()
    extract_data["target"]['@id'] = reply_post_1.uri()
    res = test_app.post(base_extract_url, json.dumps(extract_data))
    assert res.status_code == 200
    res_data = json.loads(res.body)
    extract_post_1_to_subidea_1_1_id = res_data['@id']
    # test_session.flush()

    check_number_of_posts(
        subidea_1_1, 2,
        "Num posts on idea (directly) should recurse to the two posts")
    # import transaction
    # transaction.commit()
    check_number_of_posts(
        subidea_1, 2,
        "Num posts on parent idea should be the same as the child")
    check_number_of_posts(
        subidea_1_1_1, 0,
        "Num posts on child of idea should still be zero")
    check_total_and_orphans(3, 1)

    # Create second extract to same post and idea
    extract_data = base_extract_data.copy()
    extract_data["idIdea"] = subidea_1_1.uri()
    extract_data["target"]['@id'] = reply_post_1.uri()
    extract_data["text"] = "Let's lower taxes to fav 2",
    extract_data["ranges"] = [{
            "start": "//div1/div2",
            "end": "//div2/div3",
            "startOffset": "3",
            "endOffset": "4"
        }]
    res = test_app.post(base_extract_url, json.dumps(extract_data))
    assert res.status_code == 200
    res_data = json.loads(res.body)
    extract_post_1_to_subidea_1_1_bis_id = res_data['@id']

    check_number_of_posts(
        subidea_1_1, 2,
        "Num posts should not have changed with second identical extract")
    check_number_of_posts(
        subidea_1, 2,
        "Num posts on parent idea should not have changed " +
        "with second identical extract")
    check_total_and_orphans(3, 1)

    # Create extract from parent idea to leaf message
    extract_data = base_extract_data.copy()
    extract_data["idIdea"] = subidea_1.uri()
    extract_data["target"]['@id'] = reply_post_2.uri()
    extract_data["text"] = "Let's lower taxes to fav 3",
    res = test_app.post(base_extract_url, json.dumps(extract_data))
    assert res.status_code == 200
    res_data = json.loads(res.body)
    extract_post_2_to_subidea_1_id = res_data['@id']

    check_number_of_posts(subidea_1_1, 2,
                          "Child idea should still have two posts")
    check_number_of_posts(subidea_1, 2,
                          "Idea should still have two posts")
    check_number_of_posts(subidea_1_1_1, 0,
                          "Num posts on leaf idea should still be zero")
    check_total_and_orphans(3, 1)

    # Delete original extract and duplicate
    # (check that toombstones have no effect)
    res = test_app.delete(base_extract_url + "/" +
                          quote_plus(extract_post_1_to_subidea_1_1_id))
    assert res.status_code == 204
    res = test_app.delete(base_extract_url + "/" +
                          quote_plus(extract_post_1_to_subidea_1_1_bis_id))
    assert res.status_code == 204

    check_number_of_posts(subidea_1_1, 0,
                          "Child idea should no longer have any post")
    check_number_of_posts(subidea_1, 1,
                          "Parent idea should only have one post left")
    check_number_of_posts(subidea_1_1_1, 0,
                          "Num posts on leaf idea should still be zero")
    check_total_and_orphans(3, 2)
    test_session.flush()


def test_mailbox_import_jacklayton(discussion, test_app, jack_layton_mailbox):
    base_url = get_url(discussion, 'posts')
    url = base_url
    res = test_app.get(url)
    assert res.status_code == 200
    res_data = json.loads(res.body)
    assert res_data['total'] == 20

    # Verify duplicates
    jack_layton_mailbox.do_import_content(jack_layton_mailbox, True)
    assert res_data['total'] == 20, "No duplicate messages should have been imported, but there are now %d messages" % res_data['total']

    # Verify they are all imported.
    # one() will throw an exception if any of them didn't import
    db = discussion.db
    posts = db.query(Post).order_by(Post.creation_date).all()
    assert [p.message_id for p in posts] == [
        "1606949.IA7dUeR8YG@benoitg-t510",
        "1649857.fOz6x3G98J@benoitg-t510",
        "3844624.NgDPPPZZnZ@benoitg-t510",
        "1930166.Wt7Goto29c@benoitg-t510",
        "2249242.d9RG67mvG7@benoitg-t510",
        "5376192.Toza0VnpdF@benoitg-t510",
        "2046194.jVzdDay1Sb@benoitg-t510",
        "2338275.cGRvA7U2KY@benoitg-t510",
        "1963559.rNfOy2bq8q@benoitg-t510",
        "1908535.hooWnbd4Oz@benoitg-t510",
        "2252973.BLQDMMaPU7@benoitg-t510",
        "2198317.hep6mv1tM8@benoitg-t510",
        "1802537.GgBR6HT3SE@benoitg-t510",
        "CAKqvEwBXC5+hHJ7Vqe2uOxhvq0tjiPBFGTgrKgBJWg-8OJvK4g@mail.gmail.com",
        "2408793.IU72A2SQDE@benoitg-t510",
        "7106333.QhO54ZOExH@benoitg-t510",
        "2879230.SgxIZcuISG@benoitg-t510",
        "1790712.Gl4igCGcWl@benoitg-t510",
        "1720706.VGpvc9NSuf@benoitg-t510",
        "2400278.6mpFWar2xg@benoitg-t510"]
    posts.insert(0, None)  # We are using 1-offset indices below.

    # Verify threading is correct
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

    assert posts[1].parent == None
    assert len(posts[1].children) == 3
    assert posts[2].parent == posts[1]
    assert posts[3].parent == posts[1]
    assert len(posts[3].children) == 1
    assert posts[4].parent == posts[1]
    assert len(posts[4].children) == 1
    assert posts[5].parent == posts[3]
    assert len(posts[5].children) == 1
    assert posts[6].parent == posts[5]
    assert len(posts[6].children) == 1
    assert posts[7].parent == posts[6]
    assert len(posts[7].children) == 1
    assert posts[8].parent == posts[4]
    assert len(posts[8].children) == 2
    assert posts[9].parent == posts[8]
    assert len(posts[9].children) == 2
    assert posts[10].parent == posts[9]
    assert len(posts[10].children) == 0
    assert posts[11].parent == posts[7]
    assert len(posts[11].children) == 1
    assert posts[12].parent == posts[11]
    assert len(posts[12].children) == 1
    assert posts[13].parent == posts[12]
    assert len(posts[13].children) == 1
    assert posts[14].parent == posts[13], \
        "Forwarded messages did not go to original thread"
    assert len(posts[14].children) == 0
    assert posts[15].parent == posts[9]
    assert len(posts[15].children) == 1
    assert posts[16].parent == posts[15]
    assert len(posts[16].children) == 0
    assert posts[17].parent == posts[2]
    assert len(posts[17].children) == 1
    assert posts[18].parent == posts[17]
    assert len(posts[18].children) == 0
    assert posts[19].parent == posts[8]
    assert len(posts[19].children) == 1
    assert posts[20].parent == posts[19]
    assert len(posts[20].children) == 0
