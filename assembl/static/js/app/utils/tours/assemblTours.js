var i18n =  require('../i18n.js'),
    Ctx = require("../../common/context.js"),
    $ = require('../../shims/jquery.js');

var AssemblTours = [
  {
    name: "on_start",
    autostart: true,
    tour: {
      steps: [
        {
          target: "tour_step_welcome",
          placement: "right",
          title: i18n.gettext("Welcome!"),
          stepOnShow: function() {
              $(".hopscotch-next").text(i18n.gettext("Thank you"));
          },
          content: i18n.gettext("Welcome to this discussion. We’ve created series of hints to help you get started using Assembl.")
        }
      ]}},
  {
    name: "first_message",
    autostart: false,
    // TODO: Pas dans le cas du panneau synthèse
    tour: {
      steps: [
        {
          target: "tour_step_message",
          placement: "left",
          title: i18n.gettext("Join the discussion"),
          content: i18n.gettext("This is the conversation panel, where the discussion takes place. You can reply to messages directly, or start a new topic by clicking ‘Start a new discussion thread’ at the bottom of the panel."),
          xOffset: 20,
          stepOnShow: function() {
            var element = document.getElementById("tour_step_message");
            while (element && element.className.split(' ').indexOf("panel-body") < 0) {
              element = element.parentNode;
            }

            if (element) {
              element.scrollTop = 0;
              hopscotch.refreshBubblePosition();
            }
          }
        }
      ]}},
  {
    name: "message_list_options",
    autostart: false,
    condition: function() {
      return $("#tour_step_msg_list_options").is(":visible");
    },
    tour: {
      steps: [
        {
          target: "tour_step_msg_list_options",
          placement: "left",
          title: i18n.gettext("Customize your view"),
          content: i18n.gettext("You can view the discussion in many different ways using the filters at the top."),
          yOffset: -20,
          xOffset: 30,
          stepOnShow: function() {
            var element = document.getElementById("tour_step_msg_list_options");
            while (element && element.className.split(' ').indexOf("panel-body") < 0) {
              element = element.parentNode;
            }

            if (element) {
              element.scrollTop = 0;
              hopscotch.refreshBubblePosition();
            }
          }
        }]}},
  {
    name: "segment",
    autostart: false,
    tour: {
      steps: [
        {
          target: "tour_step_segment",
          placement: "left",
          title: i18n.gettext("Spot relevant quotes on each idea"),
          content: i18n.gettext("Excerpts from messages are harvested and are organized to help you find relevant contributions on this idea."),
          yOffset: 10,
          xOffset: 0
        }]}},
  {
      name: "idea_list",
      autostart: false,
      condition: function() {
        // idea is visible
        return $("#tour_step_idealist").is(":visible");
      },
      tour: {
        steps: [
          {
            target: "tour_step_idealist",
            placement: "right",
            title: i18n.gettext("Explore one of these topics"),
            content: i18n.gettext("You can find the topics that are currently being discussed in this table of contents. Clicking on a topic will filter the conversation to only show messages that are related to this topic."),
            xOffset: -20
          }]}},
  {
    name: "synthesis",
    autostart: false,
    tour: {
      steps: [
        {
          target: "tour_step_synthesis",
          placement: "bottom",
          title: i18n.gettext("Catch up on what’s been said"),
          yOffset: -15,
          content: i18n.gettext("Periodically an executive summary of the discussion is created to give you a quick overview of what was said since the last executive summary")
        }]}},
  {
    name: "synthesis_item1",
    autostart: false,
    tour: {
      steps: [
        {
          target: "tour_step_synthesis_item1",
          placement: "bottom",
          title: i18n.gettext("DISABLED"),
          yOffset: -15,
          content: i18n.gettext("Find the different syntheses produced since the beginning of the discussion")
        }]}},
  {
    name: "synthesis_intro",
    autostart: false,
    tour: {
      steps: [
        {
          target: "tour_step_synthesis_intro",
          placement: "bottom",
          title: i18n.gettext("Catch up on the evolution"),
          yOffset: -15,
          content: i18n.gettext("The facilitator of the discussion has written this synthesis to help you get on board of the discussion. Enjoy reading!")
        }]}},
  {
    name: "synthesis_idea1",
    autostart: false,
    tour: {
      steps: [
        {
          target: "tour_step_synthesis_idea1",
          placement: "left",
          title: i18n.gettext("Dig more on an interesting idea and post your contribution"),
          yOffset: -15,
          content: i18n.gettext("You can click on this idea to see current discussions happening on it. You would be able to start contributing on this idea from there.")
        }]}},
  {
    name: "notifications",
    autostart: true,
    condition: function() {
      return !Ctx.getCurrentUser().isUnknownUser();
    },
    tour: {
      steps: [
        {
          target: "tour_step_notifications",
          placement: "left",
          title: i18n.gettext("Stay informed"),
          content: i18n.gettext("Notifications are set to go to your email. If you aren’t receiving them, make sure to check your spam folder! You can update your notification settings here.")
        }]}}
];

module.exports = AssemblTours;
