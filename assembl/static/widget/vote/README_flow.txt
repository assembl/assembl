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
URL parameters which start with "local:" are shortcuts, the front-end code of the vote widget replaces this part by "[hostname]/data/". So, the extended version of the vote link is:
http://localhost:6543/static/widget/vote/?config=http://localhost:6543/data/Widget/4&target=http://localhost:6543/data/Idea/120#/

Click on "Configure this vote instance"


## Configuring a vote widget instance

The configuration panel of a widget instance can be accessed by different ways:
* If you know the root URL of this vote widget frontend, the URI of a widget instance that you have created, and the URI of a vote target (e.g. a votable idea), you can craft the URL of its configuration page by replacing the hostname, and the value of widget_uri and target parameters in: http://localhost:6543/static/widget/vote/?admin=1#/admin/configure_instance?widget_uri=local:Widget/4&target=local:Idea/120
* As an admin, a "Configure this vote widget" link appears in the Idea panel of every idea which has been set votable in a vote widget
* This same link appears on the page which confirms the creation of the vote widget instance

This configuration page shows a menu with several options.


### Set vote criteria

The URL of this page looks like
http://localhost:6543/static/widget/vote/?admin=1#/admin/configure_instance_set_criteria?widget_uri=http:%2F%2Flocalhost:6543%2Fdata%2FWidget%2F4&target=local:Idea%2F120

This page makes a GET request to the value of the widget_uri parameter, which looks like
http://localhost:6543/data/Widget/4
The response is a JSON with fields like "discussion", "criteria_url", "criteria", which are needed by the page.

The page then makes a GET request to AssemblToolsService.resourceToUrl($scope.discussion_uri) + '/ideas?view=default', which looks like
http://localhost:6543/data/Discussion/4/ideas?view=default
The response is a JSON array of ideas, which is used to show the user selectable vote criteria (a criterion has to be an idea). Those which are already present in the previously mentioned "criteria" array will appear already selected.

Select ideas which will be used as criteria, and click "Submit". This sends a application/json PUT to
http://localhost:6543/data/Discussion/4/widgets/4/criteria
with a JSON parameter which is an array of Idea objects (which have an "@id" attribute).


### Configure appearance

The URL of this page looks like
http://localhost:6543/static/widget/vote/?admin=1#/admin/configure_instance_set_settings?widget_uri=http://localhost:6543/data/Widget/4&target=local:Idea/120

This page also makes a GET request to the value of the widget_uri parameter, in order to use widget's data (it uses its "settings" and "criteria" fields).

Add items and their criteria, and set their parameters. When done, click "Save widget configuration". This sends a application/json PUT to
http://localhost:6543/data/Widget/4/settings
with a JSON parameter which has an "items" field (and optional fields for the optional parameters), which contains something like:
[{"criteria":[{"entity_id":"local:Idea/120","name":"Wonderful idea n°2"}],"type":"vertical_gauge"}]


### Select votable ideas

The URL of this page looks like
http://localhost:6543/static/widget/vote/?admin=1#/admin/configure_instance_set_votable_ideas?widget_uri=http:%2F%2Flocalhost:6543%2Fdata%2FWidget%2F4&target=local:Idea%2F120

This page also makes a GET request to the value of the widget_uri parameter, in order to use widget's data. It uses these response fields: "discussion" (to compute the URL which lists the ideas), "votables_url" (to know where to PUT data), and "votable_ideas" (to know which ideas are already set as votables and show them selected).

The page then makes a GET request to AssemblToolsService.resourceToUrl($scope.discussion_uri) + '/ideas?view=default', which looks like
http://localhost:6543/data/Discussion/4/ideas?view=default
The response is a JSON array of ideas, which is used to show the user selectable vote targets (votable ideas). Those which are already present in the previously mentioned "votable_ideas" array will appear already selected.

Select ideas which will be votable (a "Vote on this idea" link will be shown in the Idea panel when these ideas are open), and click "Submit". This sends a application/json PUT to
http://localhost:6543/data/Discussion/4/widgets/4/targets/
with a JSON parameter which is an array of Idea objects (which have an "@id" attribute).


### See vote results

The URL of this page looks like
http://localhost:6543/static/widget/vote/?config=http://localhost:6543/data/Widget/4&target=local:Idea/120#/results
Click on "Number of voters"
The link is
http://localhost:6543/data/Discussion/4/widgets/4/targets/120/vote_counts
Click on "Average grade for each criterion"
The link is
http://localhost:6543/data/Discussion/4/widgets/4/targets/120/vote_results


### Delete this widget instance

This button asks for confirmation and sends a DELETE request on
http://localhost:6543/data/Widget/4


## Voting on a vote widget instance

As a user, open an idea which is a vote target, and click on "Vote on this idea"
The link looks like
http://localhost:6543/static/widget/vote/?config=local:Widget/4%3Ftarget%3Dlocal%3AIdea%2F120

This page makes a GET request to
http://localhost:6543/data/Widget/5?target=local:Idea/120
which returns a JSON with fields. Response fields which are used by this page are "user", "user_votes_url", "settings", and "voting_urls".
The content of the "voting_urls" field looks like
{"local:Idea/120":"local:Discussion/4/widgets/5/criteria/120/vote_targets/120/votes","local:Idea/184":"local:Discussion/4/widgets/5/criteria/184/vote_targets/120/votes"}
It is a JSON Object used as an associative array: the key is the id of a criterion, and the value is the URI where the voter can POST his vote to (for this criterion). So these voting URLs are built by the server depending on the value given in the "target" GET parameter.
The content of the "settings" field is the JSON of configuration of the appearance, which has been set by the creator of the widget. The page parses this content and displays votable items and their criteria accordingly.
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








