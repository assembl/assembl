How to set the themes on production instances:
==============================================

You must add this line to your local RC file:
`theme2_repositories__git-urls=git@github.com:bluenove/assembl2-client-themes.git`

then you must add your public ssh key to the github repo

then do your app_compile locally

By now you should have access to `assembl/static2/css/themes/vendor/assembl2_client_themes`

Each debate has his themes documented in a separate folder. Be careful, the folder name should be exactly the name of the debate.

Add your themes and then commit them and push them

fab -c {RC_FILE} update_vendor_themes_2
