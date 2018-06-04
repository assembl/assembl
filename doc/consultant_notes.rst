Editing the v2 Announcement section
========================================

This is a hack to wait for the v2 pad.

Edit the announcement section using in the v1 like so::

    The top text.
    !split!https://url.of.the/video!split!
    The bottom text.

Replace 'https://url.of.the/video' with the url of your video

Replace 'The top text.' with the text to be displayed on top of the video.

Replace 'The bottom text.' with the text to be displayed at the bottom of the video.

Don't try experiments with the '!split!' tags, 
dont put part of, what's in between or the '!split!' tags in bold or italic, 
only use them like described here.

For youtube only, if you want to put a link to a youtube video like 
'https://www.youtube.com/watch?v=somevid' rewrite it to 
'https://www.youtube.com/embed/somevid' instead

Integrating a motion.ai chatbot
========================================

First:

* Generate the bot css by running

::
  
  botBackgroundColor=whatever ./scripts/gen_chatbot_css.sh
  
The available variables are:

* botBackgroundColor
* botTextColor
* botTimeColor
* humanBackgroundColor
* humanTextColor
* humanTimeColor
  
Valid values are css colors. If the output is not printed to the terminal, it should be copied to your clipboard.

Then:

* Go to the motion.ai website, click on Webchat Settings, go to Customize tab, go to CSS subtab
* Replace the code in the text area with the generated one
* Go to deploy tab, copy the link in the 'Frame the webchat url yourself' section
* Go to v1 administration of the debate, Discussion preferences section, under the extra json field, add the following key:

::
  
  "chatframe": {
    "src": "your_link"
  }
