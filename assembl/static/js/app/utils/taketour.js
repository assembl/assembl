"use strict";

var i18n =  require('./i18n.js');

var Taketour = {

    tour: {
        id: "welcome_tour",
        steps: [
            {
                target: "tour_step_0",
                placement: "right",
                title: i18n.gettext("Welcome!"),
                content: i18n.gettext("Hi, I’m [insert name], I’m the community manager for this discussion. We’ve created a 30 second tour to help you get started using Assembl")
            },
            {
                target: "tour_step_1",
                placement: "left",
                title: i18n.gettext("Join the discussion"),
                content: i18n.gettext("This is the conversation panel, where the discussion takes place. You can reply to messages directly, or create an entirely new message by clicking ‘react to the discussion’ at the bottom of the panel.")
            },
            {
                target: "tour_step_2",
                placement: "left",
                title: i18n.gettext("Customize your view"),
                content: i18n.gettext("You can view the discussion in many different ways using the filters at the top, or under ‘more options’ in each message.")
            },
            {
                target: "tour_step_3",
                placement: "left",
                title: i18n.gettext("Find messages easily"),
                content: i18n.gettext("Excerpts from these messages are harvested and are organized to help you find messages you are interested in. Click on ‘see in context’ to view the message related to the excerpt.")
            },
            {
                target: "tour_step_4",
                placement: "right",
                title: i18n.gettext("Navigate quickly through the conversations"),
                content: i18n.gettext("You can find the topics that are currently being discussed in this table of contents. Clicking on a topic will filter the conversation to only show messages that have been harvested under that topic.")
            },
            {
                target: "tour_step_5",
                placement: "bottom",
                title: i18n.gettext("Catch up on what’s been said"),
                content: i18n.gettext("Periodically an executive summary of the discussion is created to give you a quick overview of what was said since the last executive summary")
            },
            {
                target: "tour_step_6",
                placement: "left",
                title: i18n.gettext("Stay informed"),
                content: i18n.gettext("Notifications are set to go to your email. If you aren’t receiving them, make sure to check your spam folder! You can update your notification settings here.")
            }
        ],
        showPrevButton: true
    },

    init: function(){

        hopscotch.configure({
            onShow: function(){

                console.debug('onShow', PanelSpecTypes.MESSAGE_LIST)

                document.querySelector('.messageList .panel-body').scrollTop = 0;

                //that.$(".panel-body").scroll(that, that.scrollLogger);

            },
            onNext:function(){

                console.debug('onNext')

                // need to scroll messageListPanel there.
            }
        });

        return hopscotch.startTour(this.tour, 0);
    }

}

module.exports = Taketour;





