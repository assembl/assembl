'use strict';

var Marionette = require('../shims/marionette.js'),
  $ = require('../shims/jquery.js'),
  _ = require('../shims/underscore.js'),
  Assembl = require('../app.js'),
  Ctx = require('../common/context.js'),
  CollectionManager = require('../common/collectionManager.js'),
  Types = require('../utils/types.js'),
  BreadCrumbView = require('./breadcrumb.js'),
  IdeaModel = require('../models/idea.js'),
  i18n = require('../utils/i18n.js'),
  openIdeaInModal = require('./modals/ideaInModal.js');


// from http://stackoverflow.com/questions/3959211/fast-factorial-function-in-javascript
// The factorial mathematical function: it computes num! ("num factorial")
function sFact(num)
{
  var rval=1;
  for (var i = 2; i <= num; i++)
    rval = rval * i;
  return rval;
}

// from http://stackoverflow.com/a/24257996/2136130
function nthPermutation(atoms, index, size) {
  var src = atoms.slice(), dest = [], item;
  for (var i = 0; i < size; i++) {
    item = index % src.length;
    index = Math.floor(index / src.length);
    dest.push(src[item]);
    src.splice(item, 1);
  }
  return dest;
}

/*
// NOT USED YET
// Returned array will contain alternatively one element from the beginning of the array, and one from the end (the second element of the returned array will be the last from the input array if the array size is odd, or the penultimate if the array size is pair)
function alternateItems(atoms, size){
  var dest = atoms.slice(); // copy array
  var offset = (n % 2 == 0) ? -1 : 0;
  for ( var i = 1; i < size; i += 2 ){
    dest[i] = atoms[size - 1 + offset];
  }
  return dest;
}
*/

// Returns the index in the array, as if the array was alternated: the array would contain alternatively one element from the beginning of the array, and one from the end (the second element of the returned array will be the last from the input array if the array size is odd, or the penultimate if the array size is pair)
function alternatedIndex(index, size){
  if ( index % 2 == 0 ){
    return index;
  }
  else {
    var offset = (size % 2 == 0) ? -1 : 0;
    return size - 1 + offset;
  }
}

/*
// NOT USED YET
// Get the linear interpolation between two value
var lerp = function (value1, value2, amount) {
  amount = amount < 0 ? 0 : amount;
  amount = amount > 1 ? 1 : amount;
  return value1 + (value2 - value1) * amount;
}
*/

/*
Adding CSS to an SVG which has been embedded using an <image> tag is not possible, nor with a background CSS property.
Adding CSS to an external SVG which has been embedded using an <object> tag is possible only if the URL is on the same domain (CORS policy).
So we have to GET the SVG file from its URL with an AJAX call, and add it inline to the DOM.
*/
var getSVGElementByURLPromise = function(url){
  return $.ajax({
    url: url,
    dataType: 'xml'
  }).then(function(data) {
    var svg = $(data).find('svg');
    svg.removeAttr('xmlns:a');
    return svg;
  });
};


var TokenIdeaAllocationView = Marionette.ItemView.extend({
  template: '#tmpl-tokenIdeaAllocation',
  initialize: function(options){
    console.log("TokenIdeaAllocationView::initialize()");

    if ( !("voteSpecification" in this.options)){
      console.error("option voteSpecification is mandatory");
      return;
    }
    if ( !("tokenCategory" in this.options)){
      console.error("option tokenCategory is mandatory");
      return;
    }
    if ( !("idea" in this.options)){
      console.error("option idea is mandatory");
      return;
    }

    if ( !("currentValue" in this.options)){
      this.currentValue = 0;
    }
    else {
      this.currentValue = this.options.currentValue;
    }

    this.voteSpecification = this.options.voteSpecification;
    console.log("this.voteSpecification: ", this.voteSpecification);
    this.category = this.options.tokenCategory;
    this.idea = this.options.idea;

    // validate token category's maximum_per_idea and total_number
    var maximum_per_idea = this.category.get("maximum_per_idea");
    var total_number = this.category.get("total_number");
    if ( !_.isNumber(total_number) || total_number <= 0 || total_number > 1000 ){
      total_number = 10;
    }
    if ( !_.isNumber(maximum_per_idea) || maximum_per_idea < 0 || maximum_per_idea > 1000 ){
      maximum_per_idea = 10;
    }
    if ( maximum_per_idea == 0 ){
      maximum_per_idea = total_number;
    }
    console.log("maximum_per_idea: ", maximum_per_idea);
    console.log("total_number: ", total_number);
    this.maximum_per_idea = maximum_per_idea;
    this.total_number = total_number;


    // compute vote URL and data to post
    this.voteURL = null;
    this.postData = {};
    var voting_urls = "voting_urls" in this.voteSpecification ? this.voteSpecification["voting_urls"] : null;
    var idea_id = this.options.idea.get("@id");
    var category_id = this.category.get("@id");
    if ( voting_urls && _.isObject(voting_urls) && idea_id in voting_urls ){
      this.voteURL = Ctx.getUrlFromUri(voting_urls[idea_id]);
      this.postData["@type"] = "TokenIdeaVote";
      this.postData["token_category"] = category_id;
      //this.postData["value"] = 2;
      console.log("this.voteURL: ", this.voteURL);
      console.log("this.postData: ", this.postData);
    }
    else {
      console.error("could not compte this.voteURL and this.postData");
    }

    this.customTokenImageURL = this.category.get("image");
    this.customTokenImagePromise = getSVGElementByURLPromise(this.customTokenImageURL);
  },
  onRender: function(){
    var that = this;

    /*
    var colorizeSVG = function(el, color){
      el.find("*").attr("fill", color);
    }

    var contourOnlySVG = function(el, color){
      el.find("*").attr("fill", "none");
      el.find("*").attr("stroke", color);
    }
    */

    // Icon of an empty token := By clicking on it, the user sets 0 tokens on this idea
    var zeroToken = $('<a class="btn"><svg viewBox="0 0 20 20" style="width: 20px; height: 20px;"><path fill="#4691f6" d="M15.62,1.825H4.379v1.021h0.13c-0.076,0.497-0.13,1.005-0.13,1.533c0,3.998,2.246,7.276,5.11,7.629v5.145 H7.445c-0.282,0-0.511,0.229-0.511,0.512s0.229,0.511,0.511,0.511h5.109c0.281,0,0.512-0.229,0.512-0.511s-0.23-0.512-0.512-0.512 h-2.043v-5.145c2.864-0.353,5.109-3.631,5.109-7.629c0-0.528-0.054-1.036-0.129-1.533h0.129V1.825z M10,11.087 c-2.586,0-4.684-3.003-4.684-6.707c0-0.53,0.057-1.039,0.138-1.533h9.092c0.081,0.495,0.139,1.003,0.139,1.533 C14.685,8.084,12.586,11.087,10,11.087z"></path></svg></a>');

    // Icon of a token := There will be maximum_per_idea of them shown per votable idea. By clicking on one of them, the user sets as many tokens on the idea
    var oneToken = $('<a class="btn"><svg viewBox="0 0 20 20" style="width: 20px; height: 20px;"><path fill="#4691f6" d="M9.917,0.875c-5.086,0-9.208,4.123-9.208,9.208c0,5.086,4.123,9.208,9.208,9.208s9.208-4.122,9.208-9.208 C19.125,4.998,15.003,0.875,9.917,0.875z M9.917,18.141c-4.451,0-8.058-3.607-8.058-8.058s3.607-8.057,8.058-8.057 c4.449,0,8.057,3.607,8.057,8.057S14.366,18.141,9.917,18.141z M13.851,6.794l-5.373,5.372L5.984,9.672 c-0.219-0.219-0.575-0.219-0.795,0c-0.219,0.22-0.219,0.575,0,0.794l2.823,2.823c0.02,0.028,0.031,0.059,0.055,0.083 c0.113,0.113,0.263,0.166,0.411,0.162c0.148,0.004,0.298-0.049,0.411-0.162c0.024-0.024,0.036-0.055,0.055-0.083l5.701-5.7 c0.219-0.219,0.219-0.575,0-0.794C14.425,6.575,14.069,6.575,13.851,6.794z"></path></svg></a>');

    var customToken = null;
    

    var container = this.$el;
    var renderClickableTokenIcon = function(number_of_tokens_represented_by_this_icon){
      var el = null;

      var token_size = 50;
      if ( that.maximum_per_idea > 0 ){
        var maximum_total_size = 400;
        var maximum_token_size = 60;
        var minimum_token_size = 20;
        var max_per_row = that.maximum_per_idea > 10 ? 10 : that.maximum_per_idea;
        token_size = maximum_total_size / max_per_row;
        if ( token_size < minimum_token_size ){
          token_size = minimum_token_size;
        }
        if ( token_size > maximum_token_size ){
          token_size = maximum_token_size;
        }
      }

      if ( number_of_tokens_represented_by_this_icon == 0 ){
        if ( that.customTokenImageURL ){
          el = customToken.clone();
          //contourOnlySVG(el, "#cccccc");
          el[0].classList.add("custom");
        }
        else {
          el = zeroToken.clone();
          el[0].classList.add("default");
        }
        el[0].classList.add("zero");
      }
      else {
        if ( that.customTokenImageURL ){
          el = customToken.clone();
          //contourOnlySVG(el, "#0000ff");
          el[0].classList.add("custom");
        }
        else {
          el = oneToken.clone();
          el[0].classList.add("default");
        }
        el[0].classList.add("positive");
      }
      el.css("max-width", token_size);
      el.css("max-height", token_size);

      var showAsSelected = false;
      if ( number_of_tokens_represented_by_this_icon == 0 ){
        if ( that.currentValue == 0 ){
          showAsSelected = true;
        }
      } else if ( number_of_tokens_represented_by_this_icon <= that.currentValue ) {
        showAsSelected = true;
      }
      if ( showAsSelected ){
        el[0].classList.add("selected");
        /*
        if ( number_of_tokens_represented_by_this_icon == 0 ){
          colorizeSVG(el, "#cccccc");
        }
        else {
          colorizeSVG(el, "#00ff00");
        }
        */
      }
      else {
        el[0].classList.add("not-selected");
      }

      var link = $('<a class="btn token-icon"></a>');
      el.appendTo(link);
      link.attr("title", "set "+number_of_tokens_represented_by_this_icon+" tokens");
      link.click(function(){
        console.log("set " + number_of_tokens_represented_by_this_icon + " tokens");
        that.postData["value"] = number_of_tokens_represented_by_this_icon;
        $.ajax({
          type: "POST",
          contentType: 'application/json; charset=UTF-8',
          url: that.voteURL,
          data: JSON.stringify(that.postData),
          success: function(data){
            console.log("success! data: ", data);
            that.currentValue = number_of_tokens_represented_by_this_icon;
            that.render();
          },
          error: function(jqXHR, textStatus, errorThrown){
            console.log("error! textStatus: ", textStatus, "; errorThrown: ", errorThrown);
            // TODO: show error in the UI
          }
        });
      });
      
      link.hover(function handlerIn(){
        el[0].classList.add("hover");
        link.prevAll().children("svg").each(function(){
          if ( !(this.classList.contains("zero")) ){
            this.classList.add("hover");
          }
        });
        link.nextAll().children("svg").each(function(){
          this.classList.remove("hover");
        });
      }, function handlerOut(){
        el[0].classList.remove("hover");
        link.siblings().children("svg").each(function(){
          this.classList.remove("hover");
        });
      });
      
      link.appendTo(container);
    };

    var renderAllTokenIcons = function(){
      for ( var i = 0; i <= that.maximum_per_idea; ++i ){
        renderClickableTokenIcon(i);
      }
    };

    if ( that.customTokenImageURL ){
      $.when(that.customTokenImagePromise).then(function(svgEl){
        customToken = svgEl;
        renderAllTokenIcons();
      });
    }
    else {
      renderAllTokenIcons();
    }
  },
  serializeData: function(){
    return {
      "maximum_per_idea": this.maximum_per_idea
    };
  }
});

//var TokenVoteItemView = Marionette.ItemView.extend({
var TokenVoteItemView = Marionette.LayoutView.extend({
  template: '#tmpl-tokenVoteItem',
  initialize: function(options){
    this.childIndex = options.childIndex;
    this.parent = options.parent;
  },
  regions: {
    tokensForIdea: ".tokens-for-idea"
  },
  serializeData: function(){
    return {
      "ideaTitle": (this.childIndex+1) + ". " + this.model.get("@id") + " # " + this.model.getShortTitleDisplayText()
    }
  },
  onRender: function(){
    var that = this;
    console.log("this.parent: ", this.parent);
    var tokenCategories = "tokenCategories" in this.parent.options ? this.parent.options.tokenCategories : null;
    var voteSpecification = "voteSpecification" in this.parent.options ? this.parent.options.voteSpecification : null;
    var myVotes = "my_votes" in voteSpecification ? voteSpecification.my_votes : null;
    var idea = that.model;
    console.log("tokenCategories: ", tokenCategories);
    if ( tokenCategories ){
      tokenCategories.each(function(category){
        // get the number of tokens the user has already set on this idea
        var myVote = _.findWhere(myVotes, {idea: idea.get("@id"), token_category: category.get("@id")});
        if ( myVote ){
          myVote = "value" in myVote ? myVote.value : 0;
        }
        else {
          myVote = 0;
        }

        var view = new TokenIdeaAllocationView({
          idea: idea,
          tokenCategory: category,
          voteSpecification: voteSpecification,
          currentValue: myVote
        });
        that.getRegion('tokensForIdea').show(view);
      });
    }
  }
});


var TokenVoteCollectionView = Marionette.CollectionView.extend({
  childView: TokenVoteItemView,
  template: '#tmpl-tokenVoteCollection',
  childViewOptions: function(model, index){
    var that = this;
    return {
      childIndex: index,
      parent: that
    };
  }
});


var TokenVoteSessionModal = Backbone.Modal.extend({
  constructor: function TokenVoteSessionModal() {
    Backbone.Modal.apply(this, arguments);
  },

  template: '#tmpl-tokenVoteSessionModal',
  className: 'modal-token-vote-session popin-wrapper',
  cancelEl: '.close, .js_close',

  initialize: function(options) {
    this.widgetModel = options.widgetModel;
    console.log("this.widgetModel: ", this.widgetModel);

    var that = this;
    var CollectionManager = require('../common/collectionManager.js'); // FIXME: Why does it not work when we write it only at the top of the file?
    var collectionManager = new CollectionManager();

    var voteSpecifications = that.widgetModel.get("vote_specifications");
    console.log("voteSpecifications: ", voteSpecifications);
    
    var tokenCategories = null;
    if (voteSpecifications && voteSpecifications.length > 0){
      var tokenVoteSpecification = _.findWhere(voteSpecifications, {"@type": "TokenVoteSpecification"});
      if ( tokenVoteSpecification ){
        if ( "token_categories" in tokenVoteSpecification && _.isArray(tokenVoteSpecification.token_categories) ){
          var Widget = require('../models/widget.js'); // why does it work here but not at the top of the file?
          console.log("Widget: ", Widget);
          console.log("tokenVoteSpecification.token_categories: ", tokenVoteSpecification.token_categories);
          tokenCategories = new Widget.TokenCategorySpecificationCollection(tokenVoteSpecification.token_categories);
          console.log("tokenCategories: ", tokenCategories);
        }
      }
    }
    
    
    collectionManager.getAllIdeasCollectionPromise().done(function(allIdeasCollection) {
      var votableIdeas = that.widgetModel.get("votable_ideas"); // contains their id but not full information (because shown by server using "id_only" view)
      var votableIdeasIds = _.pluck(votableIdeas, "@id");

      var IdeasSubset = Backbone.Subset.extend({
        constructor: function IdeasSubset() {
          Backbone.Subset.apply(this, arguments);
        },
        name: 'IdeasSubset',
        sieve: function(idea) {
          return _.contains(votableIdeasIds, idea.id);
        },
        parent: function() {
          return allIdeasCollection
        }
      });

      var votableIdeasCollection = new IdeasSubset();
      console.log("votableIdeasCollection: ", votableIdeasCollection);

      // Compute an ordering of votable ideas
      // Each participant should always see the same ordering, but 2 different participants can see a different ordering, and all possible orderings (permutations) should be distributed among participants as equally as possible.
      // When there are much less participants than possible permutations, participants should receive permutations which are different enough (for example: participants should not all see the same idea at the top position).
      var orderedVotableIdeas = votableIdeasCollection.sortBy(function(idea){return idea.id;}); // /!\ with this, "local:Idea/257" < "local:Idea/36"
      console.log("orderedVotableIdeas: ", orderedVotableIdeas);
      var n = orderedVotableIdeas.length; // if there are n votable ideas, then there are m = n! ("n factorial") possible permutations
      // TODO: What if there are too many votable ideas and so the computation of n! would take too much time?
      if ( n < 100 ){
        var m = sFact(n);
        var u = parseInt(Ctx.getCurrentUserId());
        if ( u ){
          var permutationIndex = alternatedIndex(u % m, m);
          var permutation = nthPermutation(orderedVotableIdeas, permutationIndex, orderedVotableIdeas.length);
          console.log("permutation: ", permutation);
        }
      }

      var collectionView = new TokenVoteCollectionView({
        collection: votableIdeasCollection,
        voteSpecification: tokenVoteSpecification,
        tokenCategories: tokenCategories,
        viewComparator: function(idea){
          return _.findIndex(permutation, function(idea2){return idea2.id == idea.id;});
        }
      });

      that.$(".votables-collection").html(collectionView.render().el);
    });

  },

  serializeData: function() {
    var settings = this.widgetModel.get("settings") || {};
    var items = "items" in settings ? settings.items : [];
    var question_item = items.length ? items[0] : null;
    return {
      popin_title: i18n.gettext("Token vote"),
      question_title: "question_title" in question_item ? question_item.question_title : "",
      question_description: "question_description" in question_item ? question_item.question_description : ""
    };
  },

  onRender: function(){
    /*
    var IdeaClassificationCollectionView = new IdeaShowingMessageCollectionView({
      collection: this.ideaContentLinks,
      messageView: this.messageView,
      groupContent: this._groupContent
    });

    this.$(".ideas-reasons-collection").html(IdeaClassificationCollectionView.render().el);
    */


  }
});

module.exports = TokenVoteSessionModal;
