Assembl has 2 APIs.
- The "classic" API. Routes begin with http://localhost:6543/api/v1/ and correspond to folder assembl/views/api/ . Each of these routes and the code they contain are designed manually and have been written with performance in mind, as they are the most critical ones (they are the first ones called by the front-end side of the application, or are called often, or require heavy database work).
- The "traversal" or "magical" or "generic" API. Routes begin with http://localhost:6543/data/ and correspond to folder assembl/views/api2. These routes are automatically generated from the classes which are defined, and their properties can be traversed. The first element after /data/ is the name of a Python class for which we want to list the instances, or to access a specific instance. It can be followed by the id of an instance of this class (for example: http://localhost:6543/data/Discussion/6 ).

## View defs
An API call can contain a parameter "view" (for example: /data/Discussion/?view=partial ). Its value is the name of a view def. View defs are JSON files which are defined in folder assembl/view_def/ . A view def defines for each class the properties which the server is allowed to send back to the client, or which are allowed to be modified by a POST/PUT API call.

## Collections
The API URL of an object instance can be followed by /@@collections . This will list all collections available from this instance. A collection of this list can be one of:
- a relation (in the ORM sense: OneToMany or ManyToOne)
- the backref of a relation (this is an inverse relation, which has been defined in the other class of the relation, not in this one)
- a collection which has been defined via "extra_collections". In this case, the JOIN operation has been coded manually. (methods decorate_query, decorate_instance, contains).




## Notifications

Uses the generic API.

### Get user notifications

All notifications, for this user, this discussion: 
http://localhost:6543/data/Discussion/6/all_users/2/notification

A specific notification:
http://localhost:6543/data/Discussion/6/all_users/2/notification/1

Specific formats, append:
/mail:  Raw email
/mail_html_preview: Preview the html part of the notification mail (if any)
/mail_text_preview: Preview the plain text part of the notification mail (if any)

### Actions (not strictly REST, but usefull for debugging)
/process_now:  Notify the celery_notify celery task to try processing the notification immediately
A global equivalent exists for all notifications:
http://localhost:6543/data/Notification/process_now

## Examples
Get all posts for a discussion:
http://localhost:6543/api/v1/discussion/1/posts
You can append a view, such as ?view=id_only

Delete a message (Superadmin):
DELETE http://localhost:6543/data/Content/3244

Permission lookups:
GET localhost:6543/api/v1/discussion/2/permissions/add_extract/u/

Frontend notes:
Specific messages are adressed with urls such as
http://localhost:6543/jacklayton/posts/local%3AContent%2F16

Metrics and statistics (work in progress, api under flux):
Ex:
http://localhost:6543/data/Discussion/11/time_series_analytics?interval=P1M&start=2014-01-01

Discussion preferences:
Raw data: (does not include permission cascade, use it to edit)
/data/Discussion/1/preferences

Cooked data (includes permission cascade)
/data/Discussion/1/settings(/{key})
(In frontend: models/discussionPreference.js)

User Namespaced KV store:
/data/Discussion/1/user_ns_kv/{namespace}(/{key})
in particular
/data/Discussion/1/user_ns_kv/preferences(/{key}) which contains the overrides found in user-corrected preference data:
/data/Discussion/1/all_users/current/preferences(/{key})
(In frontend: Ctx.getPreferences, which is taken from a tag.)
