Notifications

Uses the generic api

Get user notifications:

All notifications, for this user, this discussion: 
http://localhost:6543/data/Discussion/6/all_users/2/notification

A specific notification:
http://localhost:6543/data/Discussion/6/all_users/2/notification/1

Specific formats, append:
/mail:  Raw email
/mail_html_preview: Preview the html part of the notification mail (if any)
/mail_text_preview: Preview the plain text part of the notification mail (if any)

Actions (not strictly REST, but usefull for debugging):
/process_now:  Notify the celery_notify celery task to try processing the notification immediately
A global equivalent exists for all notifications:
http://localhost:6543/data/Notification/process_now

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
