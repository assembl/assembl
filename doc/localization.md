============
Localization
============

Transifex
=========

Translation are crowdsourced on transifex (see tranlators.rst).  As a developper,
you need to interace with transifex's servers using transifex-client (apt-get install transifex-client).  
You'll have to create a transifex configuration file:

   cd ~
   vim .transifexrc
   Add the following to the .transifexrc file:
   [https://www.transifex.net]
   hostname = https://www.transifex.net
   username = <your_username>
   password = <your_password>
   token = <should be empty>

Note that the branch that is translated on git is the "develop" branch (at least untill further notice).

First, pull translations from transifex::

   tx pull --force --all

WARNING, this will overwrite all your .po files!  The --force flag is necessary because the file modification dates of your local 
git checkout may well be more recent than the file on transifex's server, even
if transifex's version is the most up to date.  The --all flag will pull new languages you may not have locally.

Then, run::

   fab devenv make_messages

To make sure your .pot files reflect the latest code changes.

Push your changes back to transifex:

   tx push --source
   
You may want to do some local translation work at this stage (in a local po editor), 
in which case you then need to commit them to transifex.  In which case, you need to
 push the translation in your language to transifex.  For example, in french:

   tx push --translations -l fr
   
Don't forget to commit all your changes to git.

Updating translation files
==========================

Fabric tasks are available to do this on all translated apps for you::

    fab devenv make_messages

Do your translation work, and then run::

    fab devenv compile_messages
