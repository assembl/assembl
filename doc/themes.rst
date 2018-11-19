How to set the themes on production instances:
==============================================

First time:
~~~~~~~~~~~

You must add this line to your local RC file:

.. code:: sh

    theme2_repositories__git-urls=git@github.com:bluenove/assembl2-client-themes.git


Then you must add your public ssh key to the github repo

Then run app_compile locally:

.. code:: sh

    fab -c local.rc app_compile

By now you should have access to ``assembl/static2/css/themes/vendor/assembl2_client_themes``

Create theme for a debate:
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: sh

    cd assembl/static2/css/themes/vendor/assembl2_client_themes
    git checkout develop

Each debate has his themes documented in a separate folder. Be careful, the folder name should be exactly the name of the debate (slug).

Add your themes, commit them, push them and merge to master

.. code:: sh

    git checkout master
    git merge develop

Finally update your theme on the debate server and compile compile javascript:

.. code:: sh

    fab -c {RC_FILE} update_vendor_themes_2
    fab -c {RC_FILE} compile_javascript
