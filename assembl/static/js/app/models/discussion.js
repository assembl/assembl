'use strict';

define(['models/base', 'common/context', 'utils/permissions', 'utils/i18n', 'utils/roles'], function (Base, Ctx, Permissions, i18n, Roles) {

    var discussionModel = Base.Model.extend({
        url: Ctx.getApiV2DiscussionUrl(),
        defaults: {
            'settings': {},
            'introduction': '',
            'objectives': '',
            'creation_date': '',
            'topic': '',
            'introductionDetails': '',
            '@type': '',
            'widget_collection_url': '',
            'slug': '',
            '@view': '',
            'permissions': {},
            'subscribe_to_notifications_on_signup': false,
            'web_analytics_piwik_id_site': null,
            'show_help_in_debate_section': true
        },
        validate: function(attrs, options){
            /**
             * check typeof variable
             * */
        },
        
        getRolesForPermission: function(permission){
          var roles = undefined;
          if(_.contains(Permissions, permission)) {
            roles = this.get('permissions')[permission];
            if(roles) {
              return roles;
            }
            else {
              return []
            }
          }
          else {
            throw Error("Permission "+permission+" does not exist");
          }
        },
        
        /**
         * @return A text message designed to replace X in the question "You cannot perform this operation because X"
         */
        getRolesMissingMessageForPermission: function(user, permission){
          var retval;
          if(user.hasPermission(permission)) {
            retval = i18n.gettext('need no additional permissions');
          }
          else if (user.isUnknownUser()) {
            retval = i18n.sprintf(i18n.gettext("you must <a href='%s'>Sign in</a>"), Ctx.getLoginURL());
          }
          else {
            var rolesGrantingPermission = this.getRolesForPermission(permission);
            if(_.size(rolesGrantingPermission) > 0){
              if(_.contains(rolesGrantingPermission, Roles.PARTICIPANT) && _.contains(this.getRolesForPermission(Permissions.SELF_REGISTER), Roles.AUTHENTICATED)) {
                retval = i18n.sprintf(i18n.gettext('you must Join this group'));
              }
              else {
                //TODO:  Handle the case of self_register_req
                retval = i18n.sprintf(i18n.ngettext('you must ask a discussion administrator for the following role: %s', 'you must ask a discussion administrator for one of the following roles: %s', _.size(rolesGrantingPermission)), rolesGrantingPermission.join(', '));
              }
            }
            else {
              retval = i18n.sprintf(i18n.gettext('an administrator must open this discussion to contributions'), '');
            }
            
          }
          return retval;
        }

    });

    var discussionCollection = Base.Collection.extend({
        url: Ctx.getApiV2DiscussionUrl(),
        model: discussionModel
    });

    return {
        Model: discussionModel,
        Collection: discussionCollection
    };
});