I want to:

Add a new model (frontend and backend)
Steps:
- Create frontend model
- Add the new Model type to utils/types.js
- Create backend model
- Write database migration for backend model.
- Add backend model in models/__init__.py
- Add backend model in viwedefs/default_reverse.json so you can post to it's endpoint
- Add backend model in viwedefs/default.json so you get a response after posting.  It will NOT fallback to default, not error out if you don't.

