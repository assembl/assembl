'use strict';

var _ = require('underscore'),
    Backbone = require("backbone"),
    Base = require("./base.js"),
    i18n = require('../utils/i18n.js'),
    Moment = require('moment'),
    Permissions = require('../utils/permissions.js'),
    Ctx = require("../common/context.js"),
    Assembl = require('../app.js'),
    Types = require('../utils/types.js'),
    LangString = require('../models/langstring.js'),
    TokenVoteSessionView = require('../views/tokenVoteSession.js');

var WidgetModel = Base.Model.extend({
  constructor: function WidgetModel() {
    Base.Model.apply(this, arguments);
  },

  urlRoot: Ctx.getApiV2DiscussionUrl("/widgets"),

  defaults: {
    "base_idea": null,
    "start_date": null,
    "end_date": null,
    "activity_state": "active",
    "discussion": null,
    "settings": null,
    "ui_endpoint": null,
    "vote_specifications": null,
    "@id": null,
    "@type": null,
    "@view": null
  },

  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
     
  },

  onButtonClick: null, // this is a callback function which if set will replace the link (when the user clicks on the button)

  MESSAGE_LIST_INSPIREME_CTX: 1,
  IDEA_PANEL_ACCESS_CTX: 2,
  IDEA_PANEL_CONFIGURE_CTX: 3,
  IDEA_PANEL_CREATE_CTX: 4,
  DISCUSSION_MENU_CONFIGURE_CTX: 5,
  DISCUSSION_MENU_CREATE_CTX: 6,
  VOTE_REPORTS: 7,
  TABLE_OF_IDEA_MARKERS: 8,
  INFO_BAR: 9,
  UNTIL_TEXT: 10,

  isRelevantForLink: function(linkType, context, idea) {
    return false;
  },

  findLink: function(idea) {
    var id = this.getId(),
        links = idea.get("widget_links");
    links = _.filter(links, function(link) {
      return link.widget == id;
    });
    if (links.length > 0) {
      return links[0]["@type"];
    }
  },

  isRelevantFor: function(context, idea) {
    if (idea === null) {
      return this.isRelevantForLink(null, context, null);
    }
    var that = this, id=this.getId(),
        widgetLinks = idea.get("active_widget_links") || [],
        postEndpoints = idea.get("widget_add_post_endpoint") || {};
    if (postEndpoints[id] !== undefined) {
        return true;
    }
    widgetLinks = _.filter(widgetLinks, function(link) {
      return link.widget == id &&
             that.isRelevantForLink(link["@type"], context, idea);
    });
    return widgetLinks.length > 0;
  },

  /*
  getBaseUriFor: function(widgetType) {
    switch (widgetType) {
      case "CreativitySessionWidget":
        return CreativitySessionWidgetModel.prototype.baseUri;
      case "MultiCriterionVotingWidget":
        return MultiCriterionVotingWidgetModel.prototype.baseUri;
      case "TokenVotingWidget":
        return TokenVotingWidgetModel.prototype.baseUri;
      case "InspirationWidget":
        return InspirationWidgetModel.prototype.baseUri;
      default:
        console.error("Widget.getBaseUriFor: wrong type");
    }
  },
  */

  getCreationUrl: function(ideaId, locale) {
    console.error("Widget.getCreationUrl: wrong type");
  },

  getConfigurationUrl: function(targetIdeaId) {
    console.error("Widget.getConfigurationUrl: unknown type");
  },

  getUrlForUser: function(targetIdeaId, page) {
    // Is it the same as widget.get("ui_endpoint")?
    console.error("Widget.getUrlForUser: wrong type");
  },

  getCssClasses: function(context, idea) {
    return "";
  },

  getLinkText: function(context, idea) {
    return "";
  },

  getDescriptionText: function(context, idea) {
    return "";
  },

  // TODO?: Use context and targetIdeaId. But we don't need it yet.
  getShareUrl: function(context, targetIdeaId) {
    return Ctx.getAbsoluteURLFromDiscussionRelativeURL("widget/"+encodeURIComponent(this.getId()));
  },

  getUrl: function(context, targetIdeaId, page) {
    switch (context) {
      case this.DISCUSSION_MENU_CREATE_CTX:
      case this.IDEA_PANEL_CREATE_CTX:
        return this.getCreationUrl(targetIdeaId);
      case this.IDEA_PANEL_CONFIGURE_CTX:
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        return this.getConfigurationUrl(targetIdeaId);
      case this.MESSAGE_LIST_INSPIREME_CTX:
      case this.IDEA_PANEL_ACCESS_CTX:
      case this.VOTE_REPORTS:
      case this.INFO_BAR:
        if (this.get("configured")) {
          return this.getUrlForUser(targetIdeaId);
        } else {
          return this.getConfigurationUrl(targetIdeaId);
        }
      case this.TABLE_OF_IDEA_MARKERS:
      default:
        console.error("Widget.getUrlForUser: wrong context");
    }
  },

  /**
   * [Describes whether the widget model is internal to Assembl 
   * (using Marionette)(=false) or Independent (using Angular)(=true);
   * Override in child classes]
   * @return {Boolean}
   */
  isIndependentModalType: function(){
    return true;
  },

  showsButton: function(context, idea){
    return true;
  }
});

var VotingWidgetModel = WidgetModel.extend({
  constructor: function VotingWidgetModel() {
    WidgetModel.apply(this, arguments);
  },

  baseUri: "/static/widget/vote/",
  defaults: {
    '@type': 'MultiCriterionVotingWidget'
  },

  getCreationUrl: function(ideaId, locale) {
    if (locale === undefined) {
      locale = Ctx.getLocale();
    }
    return this.baseUri + "?admin=1&locale=" + locale + "#/admin/create_from_idea?idea="
      + encodeURIComponent(ideaId + "?view=creativity_widget");
  },

  getConfigurationUrl: function(targetIdeaId) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    base = base + "?admin=1&locale=" + locale + "#/admin/configure_instance?widget_uri=" + uri;
    if (targetIdeaId) {
      base += "&target=" + encodeURIComponent(targetIdeaId);
    }
    return base;
  },

  getUrlForUser: function(targetIdeaId, page) {
    var uri = this.getId(), locale = Ctx.getLocale(),
      currentUser = Ctx.getCurrentUser(),
      activityState = this.get("activity_state"),
      base = this.baseUri + "?config=" + encodeURIComponent(uri)
        + "&locale=" + locale;
    if ( currentUser.isUnknownUser() ){
      return Ctx.getLoginURL() + "?"; // "?" is added in order to handle the hacky adding of "&locale=..." in infobar.tmpl
    }
    if (activityState == "ended") {
      base += "#/results"; // was "&page=results";
    }
    return base;
  },

  VOTE_STATUS_NONE: 0,
  VOTE_STATUS_INCOMPLETE: 1,
  VOTE_STATUS_COMPLETE: 2,

  voteStatus: function() {
    var voteSpecs = this.get("vote_specifications");
    var voteCounts = _.map(voteSpecs, function(vs) {
      return (vs.my_votes || []).length;
    });
    var maxVoteCount = _.max(voteCounts);
    if (maxVoteCount === 0) {
      return this.VOTE_STATUS_NONE;
    }
    var minVoteCount = _.min(voteCounts);
    if (minVoteCount == this.get("votable_ideas", []).length) {
      return this.VOTE_STATUS_COMPLETE;
    }
    return this.VOTE_STATUS_INCOMPLETE;
  },

  getLinkText: function(context, idea) {
    var locale = Ctx.getLocale(),
        activityState = this.get("activity_state"),
        endDate = this.get("end_date");
    switch (context) {
      case this.IDEA_PANEL_CREATE_CTX:
        return i18n.gettext("Create a voting session on this idea");
      case this.INFO_BAR:
        if (this.get("configured")) {
          return i18n.gettext("Vote");
        } else {
          return i18n.gettext("Configure");
        }
      case this.IDEA_PANEL_ACCESS_CTX:
        if (!this.get("configured")) {
          return i18n.gettext("Configure");
        }
        switch (activityState) {
          case "active":
            switch (this.voteStatus()) {
              case this.VOTE_STATUS_NONE:
                return i18n.gettext("Vote");
              case this.VOTE_STATUS_INCOMPLETE:
                return i18n.gettext("Complete your vote");
              case this.VOTE_STATUS_COMPLETE:
                return i18n.gettext("Modify your vote");
            }
          case "ended":
            return i18n.gettext("See the vote results");
        }
      case this.IDEA_PANEL_CONFIGURE_CTX:
          return i18n.gettext("Configure this vote widget");
      case this.VOTE_REPORTS:
          if (activityState == "ended") {
            return i18n.gettext("See results from the vote of ") + Moment(endDate).fromNow();
          }
    }
    return "";
  },

  getCssClasses: function(context, idea) {
    var currentUser = Ctx.getCurrentUser();
    if ( currentUser.isUnknownUser() ){
        return "";
    }
    switch (context) {
      case this.INFO_BAR:
        return "js_openTargetInModal";
      case this.IDEA_PANEL_ACCESS_CTX:
        switch (this.get("activity_state")) {
          case "active":
            return "btn-primary js_openTargetInModal";
          case "ended":
            return "btn-secondary js_openTargetInModal";
        }
    }
    return "";
  },

  showsButton: function(context, idea){
    switch(context){
      case this.INFO_BAR:
        var currentUser = Ctx.getCurrentUser();
        return currentUser.can(Permissions.VOTE);
    }
    return true;
  },

  getDescriptionText: function(context, idea) {
    var locale = Ctx.getLocale(),
        currentUser = Ctx.getCurrentUser(),
        activityState = this.get("activity_state"),
        endDate = this.get("end_date");
    if (!this.get("configured")) {
      if (context == this.UNTIL_TEXT) {
        return "";
      }
      return i18n.gettext("This vote widget is not fully configured");
    }
    switch (context) {
      case this.INFO_BAR:
        var message = i18n.gettext("A vote session is ongoing.");
        if (endDate) {
          message += " " + this.getDescriptionText(this.UNTIL_TEXT, idea);
        }
        if(!currentUser.can(Permissions.VOTE)) {
          // TODO: get the current discussion synchronously.
          message += "  " + i18n.sprintf(i18n.gettext("You cannot vote right now because %s."), currentUser.getRolesMissingMessageForPermission(Permissions.VOTE));
        }
        return message;
      case this.IDEA_PANEL_ACCESS_CTX:
        var link = this.findLink(idea) || "";
        switch (link + "_" + activityState) {
          case "VotedIdeaWidgetLink_active":
          case "VotableIdeaWidgetLink_active":
            return i18n.sprintf(i18n.gettext("The option “%s” is being considered in a vote"), idea.get('shortTitle'));
          case "VotedIdeaWidgetLink_ended":
          case "VotableIdeaWidgetLink_ended":
            return i18n.sprintf(i18n.gettext("The option “%s” was considered in a vote"), idea.get('shortTitle'));
          case "BaseIdeaWidgetLink_active":
            return i18n.gettext("A voting session is ongoing on this issue");
          case "BaseIdeaWidgetLink_ended":
            return i18n.gettext("A voting session has happened on this issue");
          case "VotingCriterionWidgetLink_active":
            return i18n.sprintf(i18n.gettext("“%s” is being used as a criterion in a vote"), idea.get('shortTitle'));
          case "VotingCriterionWidgetLink_ended":
            return i18n.sprintf(i18n.gettext("“%s” was used as a criterion in a vote"), idea.get('shortTitle'));
        }
        break;
      case this.UNTIL_TEXT:
        switch ( activityState ){
          case "ended":
            return "";
            break;
          default:
            if (endDate) {
              return i18n.sprintf(i18n.gettext("You have %s to vote"), Moment(endDate).fromNow(true));
            }
        }
        break;
    }
    return "";
  },

  isRelevantForLink: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    var activityState = this.get("activity_state"),
        currentUser = Ctx.getCurrentUser();
    if (!this.get("configured") &&
        !currentUser.can(Permissions.ADMIN_DISCUSSION)) {
      return false;
    }
    switch (context) {
      case this.INFO_BAR:
        return (activityState === "active" && !this.get("closeInfobar")
          && this.get("settings", {}).show_infobar !== false
          && this.voteStatus() != this.VOTE_STATUS_COMPLETE);
      case this.IDEA_PANEL_ACCESS_CTX:
        // assume non-root idea, relevant widget type
        return (activityState == "ended"
            || currentUser.can(Permissions.VOTE));
      case this.IDEA_PANEL_CONFIGURE_CTX:
        return true;
      case this.VOTE_REPORTS:
        return (activityState === "ended");
      case this.TABLE_OF_IDEA_MARKERS:
        return (linkType === "BaseIdeaWidgetLink"
            && activityState === "active"
            && currentUser.can(Permissions.VOTE));
      default:
        return false;
    }
  }
});

var MultiCriterionVotingWidgetModel = VotingWidgetModel.extend({
  constructor: function MultiCriterionVotingWidgetModel() {
    VotingWidgetModel.apply(this, arguments);
  },

  defaults: {
    '@type': 'MultiCriterionVotingWidget'
  },

  getLinkText: function(context, idea) {
    switch (context) {
      case this.IDEA_PANEL_CREATE_CTX:
        return i18n.gettext("Create a multi-criterion voting session on this idea");
      default:
        return VotingWidgetModel.prototype.getLinkText.apply(this, arguments);
    }
  }
});


// Token Voting Widget

var TokenVotingWidgetModel = VotingWidgetModel.extend({
  constructor: function TokenVotingWidgetModel() {
    VotingWidgetModel.apply(this, arguments);
    this.on("buttonClick", this.onButtonClick);
    this.on('showResult', this.onShowResult);
  },

  defaults: {
    '@type': 'TokenVotingWidget'
  },

  getCreationUrl: function(ideaId, locale) {
    if (locale === undefined) {
      locale = Ctx.getLocale();
    }
    return this.baseUri + "?admin=1&locale=" + locale + "#/admin/create_from_idea?idea="
      + encodeURIComponent(ideaId + "?view=creativity_widget") + "&widget_type=TokenVotingWidget";
  },

  getLinkText: function(context, idea) {
    switch (context) {
      case this.IDEA_PANEL_CREATE_CTX:
        return i18n.gettext("Create a token voting session on this idea");
        break;
      case this.INFO_BAR:
        if (this.get("configured")) {
          return i18n.gettext("Vote");
        } else {
          return i18n.gettext("Configure");
        }
        break;
      default:
        return VotingWidgetModel.prototype.getLinkText.apply(this, arguments);
    }
  },

  getUrlForUser: function(targetIdeaId, page) {
    //var uri = this.getId();
    //var locale = Ctx.getLocale();
    var currentUser = Ctx.getCurrentUser();
    var activityState = this.get("activity_state");
    //var base = this.baseUri + "?config=" + encodeURIComponent(uri) + "&locale=" + locale;
    var base = this.getShareUrl();
    if ( currentUser.isUnknownUser() ){
      return Ctx.getLoginURL() + "?"; // "?" is added in order to handle the hacky adding of "&locale=..." in infobar.tmpl
    }
    if (activityState == "ended") {
      base += "/results";
    }
    return base;
  },

  // FIXME: Having view code in a model is probably not a good idea. How could we do better?
  onButtonClick: function(evt){
    console.log("TokenVotingWidgetModel::onButtonClick() evt: ", evt);
    if ( evt && _.isFunction(evt.preventDefault) ){
      evt.preventDefault();
    }

    var that = this;
    var activityState = that.get("activity_state");
    //var configured = that.get("configured");

    switch ( activityState ){
      case "active":
        var modalView = new TokenVoteSessionView.TokenVoteSessionModal({
          widgetModel: that
        });

        Ctx.setCurrentModalView(modalView);
        Assembl.slider.show(modalView);
      break;
      case "ended":
        that.onShowResult();
      break;
    }    
  },

  /*
    For debugging results view purposes
   */
  onShowResult: function(evt){
    var modalView = new TokenVoteSessionView.TokenVoteSessionResultModal({model: this});
    Ctx.setCurrentModalView(modalView);
    Assembl.slider.show(modalView);
  },

  getCssClasses: function(context, idea) {
    var currentUser = Ctx.getCurrentUser();
    if ( currentUser.isUnknownUser() ){
        return "";
    }
    switch (context) {
      case this.INFO_BAR:
        if (this.get("configured")) {
          return "";
        } else {
          return "js_openTargetInModal";
        }
      break;
      case this.IDEA_PANEL_ACCESS_CTX:
        switch (this.get("activity_state")) {
          case "active":
            if ( this.get("configured") ){
              return "btn-primary";
            }
            return "btn-primary js_openTargetInModal";
          case "ended":
            if ( this.get("configured") ){
              return "btn-primary";
            }
            return "btn-secondary js_openTargetInModal";
        }
      break;
    }
    return "";
  },

  isIndependentModalType: function(){
    return false;
  },

  /**
   * @returns {Model|null} Returns a new VoteSpec Model (if present) or null
   */
  getVoteSpecificationModel: function(){
    var specs = this.get('vote_specifications');
    if (specs && specs.length > 0) {

      //Assumes only one tokenVoteSpecification exists in this widget.
      var tokenSpec = _.findWhere(specs, {'@type': Types.TOKENVOTESPECIFICATION});
      if (tokenSpec){
        return new TokenVoteSpecificationModel(tokenSpec, {parse: true, widgetModel: this});
      }
      else return null;
    }
    else return null;
  },

  voteStatus: function() {
    // Should we also consider probably badly configured widgets? For example a widget where the user cannot allocate all his tokens? (this is a widget where a category matches this condition: votable_ideas.length * category.max_per_idea < category.total_number)
    var voteSpecs = _.where(this.get("vote_specifications"), {"@type": "TokenVoteSpecification"});
    var status = this.VOTE_STATUS_INCOMPLETE;
    for ( var i = 0; i < voteSpecs.length; ++i ){
      var voteSpec = voteSpecs[i];
      var isExclusive = "exclusive_categories" in voteSpec ? voteSpec.exclusive_categories : false;
      var myVotes = "my_votes" in voteSpec ? voteSpec.my_votes : null;
      var categories = "token_categories" in voteSpec ? voteSpec.token_categories : null;
      if ( !myVotes || !myVotes.length ){
        return this.VOTE_STATUS_INCOMPLETE;
      }
      //if ( isExclusive ){
        // Should it behave differently? For example, we could say we don't display hellobar if voter has already used all his positive tokens, even if he has not used all his negative tokens.
      //}
      //else {
        var votesPerCategory = _.groupBy(myVotes, 'token_category');
        var tokensUsedPerCategory = _.mapObject(votesPerCategory, function(val, key){
          return _.reduce(val, function(memo, num){
            return memo + ("value" in num ? num.value : 0);
          }, 0);
        });
        var someTokenCategoriesHaveUnusedTokens = _.findKey(tokensUsedPerCategory, function(val, key){
          var category = _.findWhere(categories, {"@id": key});
          if ( !category ){
            return false;
          }
          var total = "total_number" in category ? category.total_number : null;
          if ( !total ){
            return false;
          }
          return val < total;
        });
        if ( someTokenCategoriesHaveUnusedTokens ){
          return this.VOTE_STATUS_INCOMPLETE;
        }
      //}
    }
    return this.VOTE_STATUS_COMPLETE;
  }
});


var TokenVoteSpecificationModel = Base.Model.extend({
  constructor: function TokenVoteSpecificationModel(){
    Base.Model.apply(this, arguments);
  },

  defaults: {
    "@type": Types.TOKENVOTESPECIFICATION,
    'token_categories': [],
    'exclusive_categories': null,
    'settings': null,
    'results_url': null
  },

  getVoteResultUrl: function(){
    var url = this.get('results_url');
    if (url){
      // var trim = /(?:^\w+:Discussion\/\d+)(.+)/.exec(url)[1];
      return Ctx.getUrlFromUri(url);
    }
  },

  parse: function(raw, options){
    if (_.has(raw, 'token_categories') && _.isArray(raw['token_categories'])){
      raw.token_categories = new TokenCategorySpecificationCollection(raw.token_categories, {parse: true});
    }
    return raw;
  }
});

var TokenCategorySpecificationModel = Base.Model.extend({
  constructor: function TokenCategorySpecificationModel() {
    Base.Model.apply(this, arguments);
  },
  defaults: {
    "name": null, // (LangString) the display/translated name of the token category. Example: "Positive"
    "typename": null, // (string) identifier name of the token category. Categories with the same name can be compared.
    "total_number": null, // (integer) number of available tokens in the bag, that the voter can allocate on several candidates
    "token_vote_specification": null, // (string) the id of a token vote spec this category is associated to
    "image": null, // (string) URL of an image of a token
    "image_empty": null,
    "maximum_per_idea": null, // (integer) maximum number of tokens a voter has the right to put on an idea
    "color": null,
    "@type": "TokenCategorySpecification",
    "@view": "voting_widget"
  },

  parse: function(rawModel, options){
    rawModel.name = new LangString.Model(rawModel.name, {parse: true});
    return rawModel;
  }
});

var TokenCategorySpecificationCollection = Base.Collection.extend({
  constructor: function TokenCategorySpecificationCollection() {
    Base.Collection.apply(this, arguments);
  },
  model: TokenCategorySpecificationModel,
  
  /*
    The URL is rarely used to get this collection. It's taken from the Token Specification Model
   */
  url: function(){
    return Ctx.getApiV2DiscussionUrl('widgets/' + this.widgetModel.id + '/vote_specifications');
  },

  initialize: function(options){
    this.widgetModel = options.widgetModel;
  }
});


/*
  This model is not symmetrical to the back-end key-value hash
  There is no back-end model for the vote results
  This is for view purposes only (read-only)
  Do not create the model; create the collection instead!
 */
var VoteResultModel = Base.Model.extend({
  constructor: function VoteResultModel(){
    Base.Model.apply(this, arguments);
  },

  defaults: {
    'nums': null,
    'sums': null,
    'n': null,
    'idea_id': null,
    'objectConnectedTo': null,
    'objectDescription': null,
    'n_voters': null
  },

  getNumberOfVoters: function(){
    return this.get('n_voters');
  },

  /**
   * @param  {string} category      [The category typename]
   * @return {Number|null}
   */
  getTotalVotesForCategory: function(category){
    var sums = this.get('sums');
    if (_.has(sums, category)){
      return sums[category];
    }
    else return null;
  }
});

var VoteResultCollection = Base.Collection.extend({
  model: VoteResultModel,

  url: function(){
    return this.tokenSpecModel.getVoteResultUrl();
  },

  initialize: function(options){
    this.widgetModel = options.widgetModel;
    this.tokenSpecModel = this.widgetModel.getVoteSpecificationModel();
    this.sortAscending = false;
    this.sortSpecName =  this.tokenSpecModel.get("token_categories").models[0].get("typename");
  },

  comparator: function(model) {
    var sums = model.get("sums") || {};
    return (this.sortAscending?1:-1) * (sums[this.sortSpecName] || 0);
  },

  /*
    The returned data from the API is a key-value dict of idea_id: results,
    must convert to an Array of objects.
   */
  parse: function(rawModel){
    return _.chain(rawModel)
            .keys(rawModel)
            .filter(function(key){
              return key !== 'n_voters';
            })
            .map(function(idea){
              var newObj = rawModel[idea];
              newObj.idea_id = idea;
              //Data duplication
              newObj.n_voters = rawModel['n_voters'];
              return newObj;
            })
            .value(); 
  },

  /**
   * Method that associates the idea Model to the appropriate 
   * @param  {Object} objectCollection  Ideas Collection
   * @return {undefined}
   */
  associateIdeaModelToObject: function(objectCollection){
    //Add checks to ensure that the idea is not removed!
    this.each(function(result){
      var ideaModel = objectCollection.findWhere( {'@id': result.get('idea_id')} );
      result.set('objectConnectedTo', ideaModel);
    });
  },

  /**
   * Associates the Token Specification Category Collection to each result model
   * @param  {Object} categoryCollection  Collection of Token Specification Category Collection
   * @return {undefined}
   */
  associateCategoryModelToObject: function(categoryCollection){
    //Add checks to ensure that the category collection is removed
    this.each(function(result){
      result.set('objectDescription', categoryCollection);
    });
  },

  associateTo: function(ideaCollection, specificationModel){
    this.associateIdeaModelToObject(ideaCollection);
    this.associateCategoryModelToObject(specificationModel.get('token_categories'));
  },

  getNumberOfVoters: function(){
    return this.at(0).getNumberOfVoters();
  },

  /**
   * @param  {string} category  [The category typename]
   * @return {Number|null}
   */
  getTotalVotesForCategory: function(category){
    return this.reduce(function(memo, model, index){
      var val = model.getTotalVotesForCategory(category);
      return val !== null ? memo + val : memo
    }, 0);
  },

  /**
   * Method that returns a key:value object that describes
   * the total number of votes per category, keyed by category typename
   * @return {Object}
   */
  getTotalVotesByCategories: function(){
    //First, get the list of categories, which is found in every model (yes, poor design, I know...)
    var categories = this.at(0).get('objectDescription').map(function(categoryModel){
      return categoryModel.get('typename');
    });

    var sums = _.map(categories, function(categName) {
      return this.map(function(result) {
        return result.get('sums')[categName] || 0; });}, this);

    var sumTokens = _.map(sums, function (s) {
      return _.reduce(s, function(a,b) {return a+b;});
    });

    return _.object(_.zip(categories, sumTokens));
  },

  /**
   * [Returns the following statistics regarding the results collection
   *   {
   *     sums: {Array<Array>} //Collection of Arrays of tokens voted per category
   *     sumTokens: {Array<Number>} //Array of tokens voted per category 
   *     maxTokens: Array<Number> //Array of maximum number of tokens voted per category
   *     percents: Array<Number> //Array of maximum number of tokens voted per category, as percent
   *     maxPercent: Number //maximum number of tokens voted, as percent
   *   }
   * ]
   * @return {Object}
   */
  getStatistics: function(){
    //First, get the list of categories, which is found in every model (yes, poor design, I know...)
    var categories = this.at(0).get('objectDescription').map(function(categoryModel){
      return categoryModel.get('typename');
    });

    // Compute the number of tokens spent by category,
    // and for each category, the maximum percent of tokens
    // that were spent on any one idea. This maxPercent will
    // be used for scaling.
    // Note that we could also have scaled not on tokens spent,
    // but tokens spendable (given number of voters * max tokens.)
    // TODO: We should code both approaches and compare at some point.

    var sums = _.map(categories, function(categName) {
          return this.map(function(result) {
              return result.get('sums')[categName] || 0; });}, this),
        maxTokens = _.map(sums, function (s) {
          return Math.max.apply(null, s);}),
        sumTokens = _.map(sums, function (s) {
          return _.reduce(s, function(a,b) {return a+b;});}),
        percents = _.map(_.zip(maxTokens, sumTokens), function (x) {
          return x[1]?(x[0] / x[1]):0;}),
        maxPercent = Math.max.apply(null, percents),
        catSummary = _.object(_.zip(categories, sumTokens)),
        numVoters = this.getNumberOfVoters();

    return {
      sums: sums,
      maxTokens: maxTokens,
      sumTokens: sumTokens,
      percents: percents,
      maxPercent: maxPercent,
      categorySummary: catSummary,
      numVoters: numVoters
    }
  }

});

var IdeaVoteModel = Base.Model.extend({
  constructor: function IdeaVoteModel(){
    Base.Model.apply(this, arguments);
  },
  defaults: {
    "token_category": null
  }
});

var TokenIdeaVoteModel = IdeaVoteModel.extend({
  constructor: function TokenIdeaVoteModel(){
    Base.Model.apply(this, arguments);
  },
  defaults: {
    "idea": null,
    "criterion": null,
    "widget": null,
    "value": null,
    "original_uri": null,
    "vote_spec": null,
    "voter": null
  }
});

var TokenIdeaVoteCollection = Base.Collection.extend({
  constructor: function TokenIdeaVoteCollection() {
    Base.Collection.apply(this, arguments);
  },
  model: TokenIdeaVoteModel,
  getTokenBagDataForCategory: function(tokenCategory){
    // TODO: cache results until collection content changes
    var myVotesCollection = this;
    var myVotesInThisCategory = myVotesCollection.where({token_category: tokenCategory.get("@id")});
    var myVotesValues = _.map(myVotesInThisCategory, function(vote){return vote.get("value");});
    var myVotesCount = _.reduce(myVotesValues, function(memo, num){ return memo + num; }, 0);
    var total = tokenCategory.get("total_number");
    return {
      "total_number": total,
      "my_votes_count": myVotesCount,
      "remaining_tokens": total - myVotesCount
    };
  }
});


//Creativity Session Widget

var CreativitySessionWidgetModel = WidgetModel.extend({
  constructor: function CreativitySessionWidgetModel() {
    WidgetModel.apply(this, arguments);
  },
  baseUri: "/static/widget/session/",
  defaults: {
    "@type": "CreativitySessionWidget",
    "num_posts_by_current_user": 0
  },

  getCreationUrl: function(ideaId, locale) {
    if (locale === undefined) {
      locale = Ctx.getLocale();
    }
    return this.baseUri + "#/admin/create_from_idea?admin=1&locale=" + locale + "&idea="
      + encodeURIComponent(ideaId) + "&view=creativity_widget";
  },

  getConfigurationUrl: function(targetIdeaId) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    return base + "?locale=" + locale + "#/home?admin=1&config=" + uri;
  },

  getUrlForUser: function(targetIdeaId, page) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    if (!targetIdeaId) {
      if (this.get('base_idea')){
        targetIdeaId = this.get('base_idea')['@id'];
      }
    }
    if (!targetIdeaId) {
      targetIdeaId = null;
    }

    return base + "?locale=" + locale + "#/home?config=" + encodeURIComponent(uri)
      + "&target="+encodeURIComponent(targetIdeaId);
  },

  getLinkText: function(context, idea) {
    var locale = Ctx.getLocale(),
        activityState = this.get("activity_state");
    switch (context) {
      case this.IDEA_PANEL_CREATE_CTX:
        return i18n.gettext('Create a creativity session on this idea');
      case this.INFO_BAR:
        if (this.get("configured")) {
          return i18n.gettext("Participate");
        } else {
          return i18n.gettext("Configure");
        }
      case this.IDEA_PANEL_CONFIGURE_CTX:
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        // assume non-root idea, relevant widget type
        return i18n.gettext("Configure the creativity session on this idea");
      case this.IDEA_PANEL_ACCESS_CTX:
        if (!this.get("configured")) {
          return i18n.gettext("Configure");
        }
        switch (activityState) {
          case "active":
            return i18n.gettext("Participate");
          case "ended":
            return i18n.gettext("Review the session");
        }
    }
    return "";
  },

  getCssClasses: function(context, idea) {
    switch (context) {
      case this.INFO_BAR:
        return "js_openTargetInModal";
      case this.IDEA_PANEL_ACCESS_CTX:
        switch (this.get("activity_state")) {
          case "active":
            return "btn-primary js_openTargetInModal";
          case "ended":
            return "btn-secondary js_openTargetInModal";
        }
    }
    return "";
  },

  getDescriptionText: function(context, idea) {
    var locale = Ctx.getLocale(),
        activityState = this.get("activity_state"),
        endDate = this.get("end_date");
    if (!this.get("configured")) {
      if (context == this.UNTIL_TEXT) {
        return "";
      }
      return i18n.gettext("This widget is not fully configured");
    }
    switch (context) {
      case this.INFO_BAR:
        var message = i18n.gettext("A creativity session is ongoing.");
        if (endDate) {
          message += " " + this.getDescriptionText(this.UNTIL_TEXT, idea);
        }
        return message;
      case this.IDEA_PANEL_ACCESS_CTX:
        switch (activityState) {
          case "active":
            return i18n.gettext("A creativity session is ongoing on this issue");
          case "ended":
            return i18n.gettext("A creativity session has happened on this issue");
        }
      case this.UNTIL_TEXT:
        if (endDate) {
          return i18n.sprintf(i18n.gettext("You have %s to participate"), Moment(endDate).fromNow(true));
        }
    }
    return "";
  },

  isRelevantForLink: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    var activityState = this.get("activity_state"),
        currentUser = Ctx.getCurrentUser();
    if (!this.get("configured") &&
        !currentUser.can(Permissions.ADMIN_DISCUSSION)) {
      return false;
    }
    switch (context) {
      case this.INFO_BAR:
        return (activityState === "active" && !this.get("closeInfobar")
          && this.get("settings", {}).show_infobar !== false
          && currentUser.can(Permissions.ADD_POST)
          && this.get("num_posts_by_current_user", 0) === 0);
      case this.IDEA_PANEL_CONFIGURE_CTX:
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        // assume non-root idea, relevant widget type
        return (linkType === "IdeaCreativitySessionWidgetLink");
      case this.IDEA_PANEL_ACCESS_CTX:
      case this.TABLE_OF_IDEA_MARKERS:
        return (linkType == "IdeaCreativitySessionWidgetLink"
            && activityState === "active"
            && currentUser.can(Permissions.ADD_POST));
      default:
        return false;
    }
  }
});

var InspirationWidgetModel = WidgetModel.extend({
  constructor: function InspirationWidgetModel() {
    WidgetModel.apply(this, arguments);
  },
  baseUri: "/static/widget/creativity/",
  defaults: {
    '@type': 'InspirationWidget'
  },

  getCreationUrl: function(ideaId, locale) {
    if (locale === undefined) {
      locale = Ctx.getLocale();
    }
    return this.baseUri + "?admin=1&locale=" + locale + "#/admin/create_from_idea?idea="
      + encodeURIComponent(ideaId + "?view=creativity_widget");
  },

  getConfigurationUrl: function(targetIdeaId) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    base = base + "?admin=1&locale=" + locale
        + "#/admin/configure_instance?widget_uri=" + Ctx.getUrlFromUri(uri);
    if (targetIdeaId) {
      base += "&target=" + encodeURIComponent(targetIdeaId);
    }
    return base;
  },

  getUrlForUser: function(targetIdeaId, page) {
    var id = this.getId(), locale = Ctx.getLocale(),
        url = this.baseUri + "?config=" + encodeURIComponent(Ctx.getUrlFromUri(id)) + "&locale=" + locale;
    if (targetIdeaId !== undefined) {
      url += "&target=" + encodeURIComponent(targetIdeaId);
    }
    return url;
  },

  getLinkText: function(context, idea) {
    var locale = Ctx.getLocale(),
        activityState = this.get("activity_state");
    switch (context) {
      case this.IDEA_PANEL_CREATE_CTX:
        return i18n.gettext("Create an inspiration module on this idea");
      case this.DISCUSSION_MENU_CREATE_CTX:
        return i18n.gettext("Create an inspiration module on this discussion");
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        return i18n.gettext("Configure the inspiration module associated to the discussion");
      case this.IDEA_PANEL_CONFIGURE_CTX:
        return i18n.gettext("Configure the inspiration module associated to this idea");
      case this.IDEA_PANEL_ACCESS_CTX:
        if (this.get("configured")) {
          return i18n.gettext("I need inspiration");
        } else {
          return i18n.gettext("Configure");
        }
    }
    return "";
  },

  isRelevantForLink: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    // Put in subclasses?
    var activityState = this.get("activity_state"),
        currentUser = Ctx.getCurrentUser();
    if (!this.get("configured") &&
        !currentUser.can(Permissions.ADMIN_DISCUSSION)) {
      return false;
    }
    switch (context) {
      case this.MESSAGE_LIST_INSPIREME_CTX:
        return (activityState === "active");
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
      case this.IDEA_PANEL_CONFIGURE_CTX:
        // assume root idea
        return (linkType === "IdeaInspireMeWidgetLink");
      default:
        return false;
    }
  }
});


var localWidgetClassCollection = new Base.Collection([
    new MultiCriterionVotingWidgetModel(), new TokenVotingWidgetModel(), new CreativitySessionWidgetModel(), new InspirationWidgetModel()
  ]);

var globalWidgetClassCollection = new Base.Collection([
    new InspirationWidgetModel()
  ]);


// begin see https://github.com/jashkenas/backbone/commit/d1de6e89117f02adfa0f4ba05b9cf6ba3f2ecfb7
var WidgetFactory = function(attrs, options) {
  switch (attrs["@type"]) {
    case "InspirationWidget":
      return new InspirationWidgetModel(attrs, options);
    case "MultiCriterionVotingWidget":
      return new MultiCriterionVotingWidgetModel(attrs, options);
    case "TokenVotingWidget":
      return new TokenVotingWidgetModel(attrs, options);
    case "CreativitySessionWidget":
      return new CreativitySessionWidgetModel(attrs, options);
    default:
      console.error("Unknown widget type:" + attrs["@type"]);
      return new WidgetModel(attrs, options);
  }
};
WidgetFactory.prototype.idAttribute = Base.Model.prototype.idAttribute;
// end see https://github.com/jashkenas/backbone/commit/d1de6e89117f02adfa0f4ba05b9cf6ba3f2ecfb7


var WidgetCollection = Base.Collection.extend({
  constructor: function WidgetCollection() {
    Base.Collection.apply(this, arguments);
  },
  url: Ctx.getApiV2DiscussionUrl("/widgets"),
  model: WidgetFactory,

  relevantWidgetsFor: function(idea, context) {
      return this.filter(function(widget) {
        return widget.isRelevantFor(context, idea);
      });
  },

  getCreationUrlForClass: function(cls, ideaId, locale) {
    if (locale === undefined) {
      locale = Ctx.getLocale();
    }
    switch (cls) {
      case "InspirationWidget":
        return InspirationWidgetModel.getCreationUrl();
      case "MultiCriterionVotingWidget":
        return MultiCriterionVotingWidgetModel.getCreationUrl();
      case "TokenVotingWidget":
        return TokenVotingWidgetModel.getCreationUrl();
      case "CreativitySessionWidget":
        return CreativitySessionWidgetModel.getCreationUrl();
      default:
        console.error("WidgetCollection.getCreationUrlForClass: wrong widget class");
    }
  },

  configurableWidgetsUris: function(context) {
   switch (context) {
    case WidgetModel.DISCUSSION_MENU_CONFIGURE_CTX:
      return [this.getCreationUrlForClass("InspirationWidget")];
    case WidgetModel.IDEA_PANEL_CONFIGURE_CTX:
      return [
        this.getCreationUrlForClass("CreativitySessionWidget"),
        this.getCreationUrlForClass("MultiCriterionVotingWidget"),
        this.getCreationUrlForClass("TokenVotingWidget"),
        this.getCreationUrlForClass("InspirationWidget")];
    default:
        console.error("WidgetCollection.configurableWidgetsUris: wrong context");
   }
  },

  relevantUrlsFor: function(idea, context) {
    // Also give strings...
    // Careful about permissions!
    var widgets = this.relevantWidgetsFor(idea, context),
        ideaId = idea.getId();
    return _.map(widgets, function(w) {
      return w.getUrl(context, ideaId); });
  }
});


var ActiveWidgetCollection = WidgetCollection.extend({
  constructor: function ActiveWidgetCollection() {
    WidgetCollection.apply(this, arguments);
  },
  url: Ctx.getApiV2DiscussionUrl("/active_widgets")
});


/**
 * @class WidgetSubset
 *
 * A subset of the widgets relevant to a widget context
 */
var WidgetSubset = Backbone.Subset.extend({
  constructor: function WidgetSubset() {
    Backbone.Subset.apply(this, arguments);
  },

  beforeInitialize: function(models, options) {
    this.context = options.context;
    this.idea = options.idea;
    this.liveupdate_keys = options.liveupdate_keys;
  },

  sieve: function(widget) {
    return widget.isRelevantFor(this.context, this.idea);
  },

  comparator: function(widget) {
    return widget.get("end_date");
  }
});


module.exports = {
  Model: WidgetModel,
  Collection: WidgetCollection,
  WidgetSubset: WidgetSubset,
  localWidgetClassCollection: localWidgetClassCollection,
  globalWidgetClassCollection: globalWidgetClassCollection,
  ActiveWidgetCollection: ActiveWidgetCollection,
  TokenVoteSpecificationModel: TokenVoteSpecificationModel,
  TokenIdeaVoteModel: TokenIdeaVoteModel,
  TokenIdeaVoteCollection: TokenIdeaVoteCollection,
  TokenCategorySpecificationModel: TokenCategorySpecificationModel,
  TokenCategorySpecificationCollection: TokenCategorySpecificationCollection,
  VoteResultCollection: VoteResultCollection
};
