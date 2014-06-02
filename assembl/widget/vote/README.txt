
General information
===================

Consider "." the directory which contains this Readme file.

The ./.bowerrc file which contains an empty JSON is necessary: it overrides the general bower configuration of the Assembl project, so that the files which bower will install will go in a ./bower_components folder, instead of ./assembl/static/js/bower/ .

Axes = criteria.


How to use the vote widget
==========================

1) Create an instance of the vote widget, and give it a configuration (the criteria the user will vote on, etc)

You have to POST to http://localhost:6543/data/Discussion/1/widgets using the following variables:
- variable name: "widget_type", variable value: "vote"
- variable name: "settings", variable example value:
{
    "postVoteUrl":"http://localhost:6543/data/Discussion/1/widgets",
    "items":[
        {
            "type":"2_axes",
            "criteria":[
                {
                    "id":"rentabilite","name":"Rentabilite (%)","description":"Description de l'axe rentabilite","valueMin":0,"valueMax":100,"valueDefault":10,"ticks":6
                },
                {
                    "id":"risque","name":"Risque (%)","description":"Description de l'axe risque","valueMin":0,"valueMax":100,"valueDefault":0,"ticks":6
                }
            ],
            "width": 300,
            "height": 300
        },
        {
            "type": "vertical_gauge",
            "criteria": [
                {
                    "id":"investissement","name":"Investissement (Euros)","description":"Description de l'axe investissement","valueMin":0,"valueMax":50000,"valueDefault":22222,"ticks":5
                }
            ],
            "width": 300,
            "height": 300
        },
        {
            "type": "vertical_gauge",
            "criteria": [
                {
                    "id":"difficulte_mise_en_oeuvre","name":"Difficulte de mise en oeuvre (note)","description":"Description de l'axe difficulte de mise en oeuvre","valueMin":0,"valueMax":100,"valueDefault":50,"ticks":12,"descriptionMin":"Tres facile","descriptionMax":"Tres difficile","colorMin":"#00ff00","colorMax":"#ff0000","colorAverage":"#ffff00","colorCursor":"#000000"
                }
            ],
            "width": 300,
            "height": 300
        }
    ],
    "padding":60,
    "axisWidthDefault":100
}

2) Use the response to build the URL which users will access

The response contains a "location" field, which gives the id of this new instance, for example "local:Widget/22".
Then you can translate "local:" to "http://localhost:6543/data/" and obtain http://localhost:6543/data/Widget/22
This URL is the configuration parameter which you can now give when you access the vote widget with your browser.
So an example of widget URL is http://localhost:6543/widget/vote/?config=http://localhost:6543/data/Widget/22#/







