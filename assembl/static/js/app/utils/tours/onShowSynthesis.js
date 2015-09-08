var i18n =  require('../i18n.js');

var onShowSynthesis = {
    id: "on_show_synthesis",
    steps: [
        {
            target: "tour_step_welcome",
            placement: "right",
            title: i18n.gettext("Welcome! welcome"),
            content: i18n.gettext("Welcome to this discussion. We’ve created a 30 second tour to help you get started using Assembl")
        },
        {
            target: "tour_step_message",
            placement: "left",
            title: i18n.gettext("Join the discussion"),
            content: i18n.gettext("This is the conversation panel, where the discussion takes place. You can reply to messages directly, or create an entirely new message by clicking ‘react to the discussion’ at the bottom of the panel."),
            xOffset: 20,
            onNext: function() {
                // this should be a onBeforShow on next step...
                var element = document.getElementById('tour_step_msg_list_options');
                while (element && element.className.split(' ').indexOf('panel-body') < 0) {
                    element = element.parentNode;
                }

                if (element) {
                    element.scrollTop = 0;
                }
            }
        },
        {
            target: "tour_step_msg_list_options",
            placement: "left",
            title: i18n.gettext("Customize your view"),
            content: i18n.gettext("You can view the discussion in many different ways using the filters at the top, or under ‘more options’ in each message."),
            yOffset: -20,
            xOffset: 30
        },
        {
            target: "tour_step_segment",
            placement: "left",
            title: i18n.gettext("Find messages easily"),
            content: i18n.gettext("Excerpts from these messages are harvested and are organized to help you find messages you are interested in. Click on ‘see in context’ to view the message related to the excerpt."),
            yOffset: 40,
            xOffset: 20
        },
        {
            target: "tour_step_idealist",
            placement: "right",
            title: i18n.gettext("Navigate quickly through the conversations"),
            content: i18n.gettext("You can find the topics that are currently being discussed in this table of contents. Clicking on a topic will filter the conversation to only show messages that have been harvested under that topic."),
            xOffset: -20
        },
        {
            target: "tour_step_synthesis",
            placement: "bottom",
            title: i18n.gettext("Catch up on what’s been said"),
            yOffset: -15,
            content: i18n.gettext("Periodically an executive summary of the discussion is created to give you a quick overview of what was said since the last executive summary")
        },
        {
            target: "tour_step_notifications",
            placement: "left",
            title: i18n.gettext("Stay informed"),
            content: i18n.gettext("Notifications are set to go to your email. If you aren’t receiving them, make sure to check your spam folder! You can update your notification settings here.")
        }
    ],
    showPrevButton: true
}

module.exports = onShowSynthesis;
