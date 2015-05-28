# Using the Vote widget in Assembl: admin and user (and data) flow

## Creating a vote widget (instance) using Assembl

Log in as admin
Select an idea on which you want users to vote.

In the Idea panel, click on "Create a vote widget on this idea"
The link looks like
http://localhost:6543/static/widget/vote/?admin=1#/admin/create_from_idea?idea=local%3AIdea%2F120%3Fview%3Dcreativity_widget
and opens in a pop-in.
A confirmation page appears, click on "Yes, create it". This sends a application/x-www-form-urlencoded POST request to
http://localhost:6543/data/Discussion/4/widgets
with 2 parameters:
* settings	
{"votable_root_id":"local:Idea/120"}
* type	
MultiCriterionVotingWidget

The next page gives you 2 links:
* The configuration link
http://localhost:6543/static/widget/vote/?admin=1#/admin/configure_instance?widget_uri=local:Widget/4&target=local:Idea/120
You will then be able to access configuration of this vote widget instance via a link in the Idea panel.
* The URL for users to vote
http://localhost:6543/static/widget/vote/?config=local:Widget/4&target=local:Idea/120
The value of the "config" and "target" parameters are shortcuts. The extended version of the vote link is:
http://localhost:6543/static/widget/vote/?config=http://localhost:6543/data/Widget/4&target=http://localhost:6543/data/Idea/120#/


Click on "Configure this vote instance"

Click on "Set vote criteria"
The link is
http://localhost:6543/static/widget/vote/?admin=1#/admin/configure_instance_set_criteria?widget_uri=http:%2F%2Flocalhost:6543%2Fdata%2FWidget%2F4&target=local:Idea%2F120
Select ideas which will be used as criteria, and click "Submit". This sends a application/json PUT to
http://localhost:6543/data/Discussion/4/widgets/4/criteria
with a JSON parameter which is an array of Idea objects (which have an "@id" attribute).
Click "Back"

Click on "Configure appearance"
The link is
http://localhost:6543/static/widget/vote/?admin=1#/admin/configure_instance_set_settings?widget_uri=http://localhost:6543/data/Widget/4&target=local:Idea/120
Add items and their criteria, and set their parameters. When done, click "Save widget configuration". This sends a application/json PUT to
http://localhost:6543/data/Widget/4/settings
with a JSON parameter which has an "items" field (and optional fields for the optional parameters), which contains something like:
[{"criteria":[{"entity_id":"local:Idea/120","name":"Wonderful idea n°2"}],"type":"vertical_gauge"}]
Click "Back"

Click on "Select votable ideas"
The link is
http://localhost:6543/static/widget/vote/?admin=1#/admin/configure_instance_set_votable_ideas?widget_uri=http:%2F%2Flocalhost:6543%2Fdata%2FWidget%2F4&target=local:Idea%2F120
Select ideas which will be votable (a "Vote on this idea" link will be shown in the Idea panel when these ideas are open), and click "Submit". This sends a application/json PUT to
http://localhost:6543/data/Discussion/4/widgets/4/targets/
with a JSON parameter which is an array of Idea objects (which have an "@id" attribute).
Click "Back"

Click on "See vote results"
The link is
http://localhost:6543/static/widget/vote/?config=http://localhost:6543/data/Widget/4&target=local:Idea/120#/results
Click on "Number of voters"
The link is
http://localhost:6543/data/Discussion/4/widgets/4/targets/120/vote_counts
Click on "Average grade for each criterion"
The link is
http://localhost:6543/data/Discussion/4/widgets/4/targets/120/vote_results


## Deleting a vote widget instance

In the configuration panel of the widget, click on "Delete this widget instance". This sends a DELETE request on
http://localhost:6543/data/Widget/4


## Voting on a vote widget instance

As a user, open an idea which is a vote target, and click on "Vote on this idea"
The link is
http://localhost:6543/static/widget/vote/?config=local:Widget/4%3Ftarget%3Dlocal%3AIdea%2F120

This page makes a GET request to
http://localhost:6543/data/Widget/5?target=local:Idea/120
which returns a JSON with fields like "user", "user_votes_url" and "settings".
The content of this "settings" field is the JSON of configuration of the appearance, which has been set by the creator of the widget. The page parses this content and displays votable items and their criteria accordingly.
The content of the "user" field is optionnaly used by the page to display as which registered account the user is voting.

The page then makes a GET request to the URL given in this "user_votes_url" field, which is like
http://localhost:6543/data/Discussion/4/widgets/5/targets/120/votes
in order to know if and what the logged in user has already voted (on this widget instance, for this votable idea in this discussion).

Interact with the page to cast the vote, and then click "Submit your vote". This sends a application/x-www-form-urlencoded POST request to
http://localhost:6543/data/Discussion/4/widgets/5/criteria/120/vote_targets/120/votes
with as parameters:
type	
LickertIdeaVote
value	
0.4722222222222222
Such a POST request is sent for each criterion displayed on the page, so the POST URL and parameters differ (for example .../criteria/121/... instead of 120).

The response of this POST request is a JSON like
{"widget": "local:Widget/5", "voter": "local:AgentProfile/92", "idea": "local:Idea/120", "value": 0.4722222222222222
, "criterion": "local:Idea/120", "@id": "local:IdeaVote/70", "@type": "LickertIdeaVote", "@view": "default"
}
But if the response header status not a 201 code but rather an error code, the page shows a red error instead of a green confirmation.








