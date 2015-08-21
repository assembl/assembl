
General information
===================

Consider "." the directory which contains this Readme file.

The ./.bowerrc file which contains an empty JSON is necessary: it overrides the general bower configuration of the Assembl project, so that the files which bower will install will go in a ./bower_components folder, instead of ./assembl/static/js/bower/ .

Axes = criteria.


How to use the vote widget
==========================

1) Create an instance of the vote widget, and give it a configuration (the criteria the user will vote on, etc)

You have to POST to http://localhost:6543/data/Discussion/1/widgets using the following variables:
- variable name: "type", variable value: "MultiCriterionVotingWidget"
- variable name: "settings", variable example value:
{
    "items":[
        {
            "type":"2_axes",
            "criteria":[
                {
                    "id":"rentabilite",
                    "name":"Rentabilite (%)",
                    "description":"Description de l'axe rentabilite",
                    "valueMin":0,
                    "valueMax":100,
                    "valueDefault":10,
                    "descriptionMin":"faible",
                    "descriptionMax":"forte",
                    "ticks":6
                },
                {
                    "id":"risque",
                    "name":"Risque (%)",
                    "description":"Description de l'axe risque",
                    "valueMin":0,
                    "valueMax":100,
                    "valueDefault":0,
                    "descriptionMin":"faible",
                    "descriptionMax":"fort",
                    "ticks":6
                }
            ],
            "width": 300,
            "height": 300
        },
        {
            "type": "vertical_gauge",
            "criteria": [
                {
                    "id":"investissement",
                    "name":"Investissement (Euros)",
                    "description":"Description de l'axe investissement",
                    "valueMin":0,
                    "valueMax":50000,
                    "valueDefault":22222,
                    "ticks":5
                }
            ],
            "width": 300,
            "height": 300
        },
        {
            "type": "vertical_gauge",
            "criteria": [
                {
                    "id":"difficulte_mise_en_oeuvre",
                    "name":"Difficulte de mise en oeuvre (note)",
                    "description":"Description de l'axe difficulte de mise en oeuvre",
                    "valueMin":0,
                    "valueMax":100,
                    "valueDefault":50,
                    "ticks":12,
                    "descriptionMin":"Tres facile",
                    "descriptionMax":"Tres difficile",
                    "colorMin":"#00ff00",
                    "colorMax":"#ff0000",
                    "colorAverage":"#ffff00",
                    "colorCursor":"#000000"
                }
            ],
            "width": 300,
            "height": 300
        }
    ],
    "displayStyle":"standard",
    "presentationText":"Installer des panneaux solaires sur le toit du batiment",
    "padding":60
}

2) Use the response to build the URL which users will access

The response contains a "location" field, which gives the id of this new instance, for example "local:Widget/22".
Then you can translate "local:" to "http://localhost:6543/data/" and obtain http://localhost:6543/data/Widget/22
This URL is the configuration parameter which you can now give when you access the vote widget with your browser.
So an example of widget URL is http://localhost:6543/widget/vote/?config=http://localhost:6543/data/Widget/22#/


Displaying the form for a user to vote on all or some vote targets
==================================================================

* http://localhost:6543/static/widget/vote/?config=local:Widget/16&targets=local:Idea/228,local:Idea/166#/ displays the 2 given targets. The "targets" parameter takes a list of targets URIs, separated by the "," character. So http://localhost:6543/static/widget/vote/?config=local:Widget/16&targets=local:Idea/228#/ displays a single target
* http://localhost:6543/static/widget/vote/?config=local:Widget/16&target=local:Idea/228#/ also displays a single target
* http://localhost:6543/static/widget/vote/?config=local:Widget/16#/ displays all targets (when no "target" or "targets" parameter is given)



Tools to make REST calls
========================

To POST the information above, you can use one of these tools:
* curl
    For example you can type the following command:
    curl -D test -d type=CreativityWidget -d settings='{...}' http://localhost:6544/data/Discussion/1/widgets
    And then you can read the content of the "test" file (thanks to the -D option), and read the value of "location"
* a browser plugin, such as "REST Easy" (https://addons.mozilla.org/en-US/firefox/addon/rest-easy/)




