
Notification architecture
=========================

A notification is a message that is sent to a user when a given event happens in the application.
For now, a notification message is an email sent to the user.

There are currently 3 types of events that a user can be subscribed to:
* A synthesis is published
* A user directly replies to a message of this user
* Any message is posted in the debate

A debate administrator can edit the debate settings to set which of these 3 notification subscriptions are active by default for all users. (Before the debate administrator customizes these settings, they are assigned to the Assembl instance's default configuration)

When a user joins a debate, they get subscribed to these selected notifications. They can then edit their notification subscriptions in their Notifications page.

Data model
----------

A `Discussion` has `UserTemplate` instances associated to it. A `UserTemplate` defines settings for a given permission role in a given discussion. For now, we use only one user template in a discussion, which is for the `R_PARTICIPANT` role.

A `UserTemplate` (and a `User`) can have notification subscriptions, which are instances of `NotificationSubscription` associated to it.

When a `Discussion` is created, a `UserTemplate` is automatically created and bound to it, as well as its notification subscriptions. This is the way discussion's default notification subscriptions are stored. (When a debate administrator edits Discussion's default notification subscriptions, this actually means that they edit discussion user template's notification subscriptions.)

For example, we can have a `NotificationSubscription` of subtype `NotificationSubscriptionFollowSyntheses`, with a `creation_origin` field that is valued "DISCUSSION_DEFAULT" or "USER_REQUESTED", and a `status` field that is valued "ACTIVE" or "UNSUBSCRIBED" or "INACTIVE_DFT".


Example: What happens when a synthesis is published
---------------------------------------------------

When as a discussion initiator I want to edit the draft for next synthesis, in Assembl v1 UI, I click on my name at the top right of the screen, then "Add a new panel group", then "Create a synthesis". This opens a panel where I can edit the synthesis draft (and checkboxes appear in the table of ideas so I can check which ideas will appear in the synthesis). When I'm done writing the synthesis, I click on the "Publish" button (at the bottom of the synthesis draft panel).

Clicking on this "Publish" button makes the frontend trigger a POST call to route http://localhost:6543/api/v1/discussion/3/posts with as payload an object that contains notably a `publishes_synthesis_id` field, with value "local:IdeaGraphView/5".

This API call is handled by the `create_post()` function of `assembl/views/api/post.py`. This function creates a `SynthesisPost` and calls its `finalize_publish()` method, and adds it to the database.

The inheritence path of `SynthesisPost` is `BaseOps` > `Base` > `DiscussionBoundBase` (and `TombstonableMixin`) > `Content` > `Post` > `AssemblPost` > `SynthesisPost`, and `lib/sqla.py` contains the following instruction:
`event.listen(BaseOps, 'after_insert', orm_insert_listener, propagate=True)`
This means that when any instance of a class that derives from BaseOps is inserted into the database, the `orm_insert_listener()` function is called. This in turn calls the `send_to_changes()` method of the instance.

The `models/generic.py:Content::send_to_changes()` method creates a `watcher` with `get_model_watcher()` and calls its `processPostCreated()` method. The `lib/sqla.py:get_model_watcher()` function returns an instance of a class whose name is defined in an `.ini` configuration file, under the key `{task_name}.imodeleventwatcher` ("assembl" being the default key). (The definitive value that `get_model_watcher()` will return is defined in `scripts/__init__.py` and `tasks/__init__.py`.)

Possible values of these variables are:
* `assembl.models.notification.ModelEventWatcherNotificationSubscriptionDispatcher`
* `assembl.lib.model_watcher.ModelEventWatcherPrinter`
* `assembl.tasks.notification_dispatch.ModelEventWatcherCelerySender`

See also documentation at the top of the `lib/model_watcher.py` file for more information about theses classes.

[To be continued]

