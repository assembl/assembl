
General information
===================

Consider "." the directory which contains this Readme file.

The ./.bowerrc file which contains an empty JSON is necessary: it overrides the general bower configuration of the Assembl project, so that the files which bower will install will go in a ./bower_components folder, instead of ./assembl/static/js/bower/ .



How to use the creativity widget
==========================

1) Create an instance of the creativity widget, and give it a configuration (the linked idea, etc)

You have to POST to http://localhost:6543/data/Discussion/1/widgets using the following variables:
- variable name: "type", variable value: "CreativityWidget"
- variable name: "settings", variable example value:
{
    "idea": "local:Idea/3"
}

2) Use the response to build the URL which users will access

The response contains a "location" field, which gives the id of this new instance, for example "local:Widget/22".
Then you can translate "local:" to "http://localhost:6543/data/" and obtain http://localhost:6543/data/Widget/22
This URL is the configuration parameter which you can now give when you access the creativity widget with your browser.
So an example of widget URL is http://localhost:6543/widget/creativity/?config=http://localhost:6543/data/Widget/22#/







