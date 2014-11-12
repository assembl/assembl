Notifications

Uses the generic api

Get user notifications:

All notifications, for this user, this discussion: 
http://localhost:6543/data/Discussion/6/all_users/2/

A specific notification:
http://localhost:6543/data/Discussion/6/all_users/2/

Specific formats:
/mail:  Raw email
/mail_html_preview: Preview the html part of the notification mail (if any)
/mail_text_preview: Preview the plain text part of the notification mail (if any)

Actions (not strictly REST, but usefull for debugging):
/process_now:  Notify the celery_notify celery task to try processing the notification immediately
A global equivalent exists for all notifications:
http://localhost:6543/data/Notification/process_now