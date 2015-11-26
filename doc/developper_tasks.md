I want to:

Add a new model (frontend and backend)
Steps:
- Create frontend model
- Add the new Model type to utils/types.js
- Create backend model
- Write database migration for backend model.
- Add backend model in models/__init__.py
- Add backend model in viwedefs/default_reverse.json so you can post to it's endpoint
- Add backend model in viwedefs/default.json so you get a response after posting.  It will NOT fallback to default, nor error out if you don't.

Download a copy of a remote database to develop locally

  fab env_name_of_remote_env database_download
  fab env_dev database_restore
  # Make sure the database username and passwords in local.ini match the ones of the database you just downloaded
  fab env_dev app_compile #(To make sure the database schema is up to date and restore.  YOu can also use app_compile_noupdate if you are in a hurry)
  pshell local.ini
  from assembl.semantic import *
  reset_semantic_mapping()
  # Grab a coffee...
  exit
  supervisorctl restart dev: