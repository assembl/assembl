Contributing to Assembl translations
====================================

Transifex
---------

Translation are crowdsourced on transifex (see tranlators.rst). As a
developper, you need to interface with transifex's servers using
transifex-client (apt-get install transifex-client on Ubuntu). You'll
have to create a transifex configuration file:

::

  cd ~
  vim .transifexrc

Add the following to the .transifexrc file:

::

  [https://www.transifex.com]
  hostname = https://www.transifex.com
  username = <your_username>
  password = <your_password>
  token = <should be empty>

Note that the branch that is translated on git is ALWAYS the "develop"
branch. Just like database schemas, translations cannot be merged in
practice.

Contributing translation
------------------------

Go to https://www.transifex.com/assembl/assembl/dashboard/ and start 
translating.

Updating translation files
--------------------------

Two fabric tasks are available to do all the updating and file
generation for you.

The first makes sure your .pot files reflect the latest code changes,
and updates all po files accordingly (sets fuzzy strings that need
updating, etc.). It needs to be run before any translation work:

::

    fab -c assembl/configs/develop.rc make_messages

The second generates the runtime files and needs to be run before you
can see the actual translations in the application:

::

    fab -c assembl/configs/develop.rc compile_messages

The translation workflow
------------------------

1. Mandatory: Pull translations from transifex:

   ::

       tx pull --force --all

   WARNING, this will overwrite all your .po files! The --force flag is
   necessary because the file modification dates of your local git
   checkout may well be more recent than the file on transifex's server,
   even if transifex's version is the most up to date. The --all flag
   will pull new languages you may not have locally.

2. Mandatory: Regenerate pot and update po files:

   ::

       fab -c assembl/configs/develop.rc make_messages

3. Mandatory: Push the pot file back to transifex:

   ::

       tx push --source

4. Optional: You may want to do some local translation work at this
   stage (in a local po editor)

   Once you've completed your changes, you need to push the po in the
   language you translated locally back to transifex. For example, in
   french:

   ::

    tx push --translations -l fr

5. Mandatory: Commit all your changes to git.

   Specifically, commit the following files:

   ::

    git add assembl/locale/assembl.pot
    git add assembl/locale/*/LC_MESSAGES/assembl.po
    git commit -m"update i18n"
