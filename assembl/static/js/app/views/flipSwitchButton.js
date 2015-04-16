'use strict';

define(['backbone', 'underscore', 'jquery', 'app', 'common/context', 'utils/i18n', 'models/flipSwitchButton'],
    function (Backbone, _, $, Assembl, Ctx, i18n, FlipSwitchButtonModel) {

        var FlipSwitchButton = Marionette.ItemView.extend({
            template: '#tmpl-flipSwitchButton',
            className: 'flipSwitchButton',
            /*
            initialize: function(){
                console.log("FlipSwitchButton::initialize()");

                //this.listenTo(this.model, 'change:isOn', this.updateState); // replaced by modelEvents
            },
            */

            ui: {
                toggleButton: '.js_toggleButton'
            },

            events: {
                'click @ui.toggleButton': 'onToggle'
            },

            modelEvents: {
                'change:isOn': 'updateState'
            },

            /* not needed: model attributes are sent automatically to the template
            serializeData: function () {
                return {
                    isOn: this.isOn,
                    labelOn: this.labelOn,
                    labelOff: this.labelOff
                };
            },
            */

            onRender: function(){
                console.log("FlipSwitchButton::onRender()");
                /*
                this.renderMessageListViewStyleDropdown();
                this.renderDefaultMessageViewDropdown();
                */
            },

            onShow: function(){
                /*
                // react to when a view has been rendered and displayed
                this.applyEllipsisToSection('.context-introduction', this.ui.seeMoreIntro);
                this.applyEllipsisToSection('.context-objective', this.ui.seeMoreObjectives);
                */
            },

            onToggle: function(){
                this.model.set('isOn', !this.model.get('isOn'));
                //this.updateState(); // will be done automatically thanks to modelEvents
            },

            // does a smooth re-render (so that CSS animations are shown)
            updateState: function(){
                console.log("flipSwitchButton::updateState()");
                if ( this.model.get('isOn') )
                {
                    this.ui.toggleButton.removeClass("flipswitch-no");
                    this.ui.toggleButton.addClass("flipswitch-yes");
                }
                else {
                    this.ui.toggleButton.removeClass("flipswitch-yes");
                    this.ui.toggleButton.addClass("flipswitch-no");
                }
            }

        });

        return FlipSwitchButton;
    });