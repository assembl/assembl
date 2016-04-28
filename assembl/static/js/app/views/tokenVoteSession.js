'use strict';

var Marionette = require('../shims/marionette.js'),
  $ = require('jquery'),
  _ = require('underscore'),
  Assembl = require('../app.js'),
  Ctx = require('../common/context.js'),
  CollectionManager = require('../common/collectionManager.js'),
  Types = require('../utils/types.js'),
  BreadCrumbView = require('./breadcrumb.js'),
  CKEditorField = require('./reusableDataFields/ckeditorField.js'),
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
// Get the linear interpolation between two values
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
var _ajaxCache = {};
var getSVGElementByURLPromise = function(url){
  if ( url in _ajaxCache ){
    return _ajaxCache[url];
  }
  var success = function(data){
    var svg = $(data).find('svg');
    svg.removeAttr('xmlns:a');
    svg.attr("aria-hidden", "true");
    svg.attr("role", "img");
    return svg;
  };

  var failure = function(){
    var oneToken = $('<a class="btn"><svg viewBox="0 0 20 20" style="width: 20px; height: 20px;"><path fill="#4691f6" d="M9.917,0.875c-5.086,0-9.208,4.123-9.208,9.208c0,5.086,4.123,9.208,9.208,9.208s9.208-4.122,9.208-9.208 C19.125,4.998,15.003,0.875,9.917,0.875z M9.917,18.141c-4.451,0-8.058-3.607-8.058-8.058s3.607-8.057,8.058-8.057 c4.449,0,8.057,3.607,8.057,8.057S14.366,18.141,9.917,18.141z M13.851,6.794l-5.373,5.372L5.984,9.672 c-0.219-0.219-0.575-0.219-0.795,0c-0.219,0.22-0.219,0.575,0,0.794l2.823,2.823c0.02,0.028,0.031,0.059,0.055,0.083 c0.113,0.113,0.263,0.166,0.411,0.162c0.148,0.004,0.298-0.049,0.411-0.162c0.024-0.024,0.036-0.055,0.055-0.083l5.701-5.7 c0.219-0.219,0.219-0.575,0-0.794C14.425,6.575,14.069,6.575,13.851,6.794z"></path></svg></a>');
    return success(oneToken);
  };

  _ajaxCache[url] = $.ajax({
    url: url,
    dataType: 'xml'
  }).then(success, failure);
  return _ajaxCache[url];
};

var getTokenSize = function(number_of_tokens, maximum_tokens_per_row, maximum_total_width){
  var token_size = 35;
  maximum_total_width = maximum_total_width ? maximum_total_width : 400;
  var maximum_token_size = 35; // was 60
  var minimum_token_size = 12;
  if ( maximum_tokens_per_row != 0 ){
    //maximum_tokens_per_row = maximum_tokens_per_row > 10 ? 10 : maximum_tokens_per_row;
    token_size = maximum_total_width / maximum_tokens_per_row;
  }
  else {
    if ( maximum_total_width != 0 && number_of_tokens != 0 ){
      token_size = maximum_total_width / number_of_tokens;
    }
    else {
      token_size = maximum_token_size;
    }
  }

  if ( token_size < minimum_token_size ){
    token_size = minimum_token_size;
  }
  if ( token_size > maximum_token_size ){
    token_size = maximum_token_size;
  }
  return token_size;
}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Copies el and animates it towards el2
var transitionAnimation = function(el, el2){
  console.log("transitionAnimation(): ", el, el2);
  if ( !el.length || !el2.length ){
    return;
  }
  var el3 = el.clone();
  $("body").append(el3);
  el3.css("z-index",getRandomInt(1234, 11234));
  el3.css("position","fixed");

  /* this way creates a jerky movement
  el3.offset(el.offset());
  el3.animate(el2.offset(), 5000, function complete(){
    el3.remove();
  });
  */

  var elo = el.offset();
  var el2o = el2.offset();
  var top = el2o.top - elo.top;
  var left = el2o.left - elo.left;
  el3.offset(elo);
  el3.css("transition-duration", "1s");
  el3.css("transform", "translate(" + left + "px, " + top + "px)");
  setTimeout(function(){
    el3.remove();
  }, 1000);
};


// This view shows at the top of the popin the bag of remaining tokens the user has
var TokenBagsView = Marionette.ItemView.extend({
  template: false,
  initialize: function(options){
    if ( !("voteSpecification" in this.options)){
      console.error("option voteSpecification is mandatory");
      return;
    }

    if ( !("tokenCategories" in this.options)){
      console.error("option tokenCategories is mandatory");
      return;
    }

    if ( !("myVotesCollection" in this.options)){
      console.error("option myVotesCollection is mandatory");
      return;
    }

    this.voteSpecification = this.options.voteSpecification;
    this.tokenCategories = this.options.tokenCategories;
    this.myVotesCollection = this.options.myVotesCollection;
    this.collection = this.myVotesCollection;
  },
  collectionEvents: {
    "add remove reset change sync": "render"
  },
  onRender: function(){
    console.log("TokenBagsView::onRender()");
    var that = this;
    var container = this.$el;
    container.empty();
    var help = $("<div></div>");
    help.addClass("help-text");
    help.text(i18n.gettext("Répartissez vos jetons sur les idées de vos choix. Par défaut, votre vote est neutre par projet."));
    help.appendTo(container);
    this.tokenCategories.each(function(category){
      var customTokenImageURL = category.get("image");
      var customTokenImagePromise = getSVGElementByURLPromise(customTokenImageURL);
      var data = that.myVotesCollection.getTokenBagDataForCategory(category);
      var categoryContainer = $("<div></div>");
      categoryContainer.addClass('token-bag-for-category');
      categoryContainer.addClass(category.getCssClassFromId());
      categoryContainer.appendTo(container);
      var el = $("<div></div>");
      el.addClass("description");
      var s = i18n.sprintf(i18n.gettext("<span class='available-tokens-number'>%d</span> remaining %s tokens"), data["remaining_tokens"], category.get("typename")); // TODO: use "name" field instead (LangString)
      el.html(s);
      //el.text("You have used " + data["my_votes_count"] + " of your " + data["total_number"] + " \"" + category.get("typename") + "\" tokens.");
      el.appendTo(categoryContainer);

      var el2 = $("<div></div>");
      el2.addClass("available-tokens-icons");
      
      el2.appendTo(categoryContainer);
      $.when(customTokenImagePromise).then(function(svgEl){ 
        var token_size = getTokenSize(data["total_number"], 20, 400);
        for ( var i = 0; i < data["remaining_tokens"]; ++i ){
          var tokenIcon = svgEl.clone();
          tokenIcon[0].classList.add("available");

          tokenIcon.css("width", token_size);
          tokenIcon.attr("width", token_size);
          tokenIcon.css("height", token_size);
          tokenIcon.attr("height", token_size);

          el2.append(tokenIcon);
        }
        for ( var i = data["remaining_tokens"]; i < data["total_number"]; ++i ){
          var tokenIcon = svgEl.clone();
          tokenIcon[0].classList.add("not-available");

          tokenIcon.css("width", token_size);
          tokenIcon.attr("width", token_size);
          tokenIcon.css("height", token_size);
          tokenIcon.attr("height", token_size);

          el2.append(tokenIcon);
        }
      });
    });
  }
});



// This view shows (in the block of an idea) the clickable tokens (of one given category of tokens) a user can allocate (and has allocated) on this idea
var TokenIdeaAllocationView = Marionette.ItemView.extend({
  template: '#tmpl-tokenIdeaAllocation',
  initialize: function(options){
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
    if ( !("myVotesCollection" in this.options)){
      console.error("option myVotesCollection is mandatory");
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
    this.myVotesCollection = this.options.myVotesCollection;
    this.collection = this.myVotesCollection;

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
  collectionEvents: {
    "add remove reset change sync": "render"
  },
  onRender: function(){
    console.log("TokenIdeaAllocationView::onRender()");
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

      var token_size = getTokenSize(that.category.get("total_number"), 20, 400); // we know this computed size will be smaller than getTokenSize(that.maximum_per_idea ? that.maximum_per_idea + 1 : 0, 10, 400); and we need icons in bags and in ideas to be the same size


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
      /*
      From https://github.com/blog/2112-delivering-octicons-with-svg
      "You may have to wrap these SVGs with another div if you want to give them a background color."
      "Internet Explorer needs defined width and height attributes on the svg element in order for them to be sized correctly."
      */
      el.css("width", token_size);
      el.attr("width", token_size);
      el.css("height", token_size);
      el.attr("height", token_size);

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

      var tokenBagData = that.myVotesCollection.getTokenBagDataForCategory(that.category);
      var remaining_tokens = tokenBagData["remaining_tokens"];
      var userCanClickThisToken = (remaining_tokens + that.currentValue - number_of_tokens_represented_by_this_icon >= 0);
      var link = null;
      if ( userCanClickThisToken ){
        link = $('<a class="btn token-icon"></a>');
        el.appendTo(link);

        link.attr("title", "set "+number_of_tokens_represented_by_this_icon+" tokens");

        link.click(function(){
          if ( that.currentValue == number_of_tokens_represented_by_this_icon ){
            return;
          }
          console.log("set " + number_of_tokens_represented_by_this_icon + " tokens");

          // animation: are we adding or removing token to/from this idea?
          if ( that.currentValue < number_of_tokens_represented_by_this_icon ){ // we are adding tokens to this idea
            for ( var i = that.currentValue + 1; i <= number_of_tokens_represented_by_this_icon; ++i ){
              var selector = ".token-vote-session .token-bag-for-category." + that.category.getCssClassFromId() + " .available-tokens-icons .available";
              console.log("selector: ", selector);
              var theAvailableToken = $(selector).eq($(selector).length - 1 - (number_of_tokens_represented_by_this_icon - i));
              console.log("theAvailableToken: ", theAvailableToken);
              transitionAnimation(theAvailableToken, link.parent().children().eq(i));
            }
          }
          else { // we are removing tokens from this idea
            var initial_value = number_of_tokens_represented_by_this_icon;
            for ( var i = that.currentValue; i > number_of_tokens_represented_by_this_icon; --i ){
              var selector = ".token-vote-session .token-bag-for-category." + that.category.getCssClassFromId() + " .available-tokens-icons .not-available";
              console.log("selector: ", selector);
              var theAvailableToken = $(selector).eq(i-1);
              console.log("theAvailableToken: ", theAvailableToken);
              transitionAnimation(link.parent().children().eq(i), theAvailableToken);
            }
          }
          
          /* This is the pure AJAX way to save the data to the backend
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
          */

          // This is a more Backbone way to save the data to the backend
          _.defer(function(){
            var properties = _.clone(that.postData);
            delete properties["value"];
            properties["idea"] = that.idea.get("@id");
            var previousVote = that.myVotesCollection.findWhere(properties);
            console.log("previousVote found: ", previousVote);
            if ( previousVote ){
              previousVote.set({"value": number_of_tokens_represented_by_this_icon});
              previousVote.save();
            }
            else {
              properties["value"] = number_of_tokens_represented_by_this_icon;
              that.myVotesCollection.create(properties);
            }
            that.currentValue = number_of_tokens_represented_by_this_icon;
            el[0].classList.add("selected");
            container.removeClass("hover");
            that.render(); // show immediately the icon it its correct state, without having to wait for collection update
          });
        });
        
        link.hover(function handlerIn(){
          container.addClass("hover");
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
          container.removeClass("hover");
          el[0].classList.remove("hover");
          link.siblings().children("svg").each(function(){
            this.classList.remove("hover");
          });
        });
      } // if ( userCanClickThisToken )
      else {
        link = $('<div class="token-icon"></div>');
        el.appendTo(link);
        el[0].classList.add("not-enough-available-tokens");
        link.attr("title", "You don't have enough tokens remaining.");
      }
      
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

// This view shows an idea in the list of votable ideas (and calls a subview which shows the tokens for this idea)
var TokenVoteItemView = Marionette.LayoutView.extend({
  template: '#tmpl-tokenVoteItem',
  initialize: function(options){
    this.childIndex = options.childIndex;
    this.parent = options.parent;
  },

  ui: {
    tokensForIdea: ".tokens-for-idea"
  },

  regions: {
    regionIdeaDescription: ".js_region-idea-description",
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
    var myVotesCollection = "myVotesCollection" in this.parent.options ? this.parent.options.myVotesCollection : null;
    var idea = that.model;
    console.log("tokenCategories: ", tokenCategories);
    if ( tokenCategories ){
      tokenCategories.each(function(category){
        // get the number of tokens the user has already set on this idea
        var myVote = myVotesCollection.findWhere({"idea": idea.get("@id"), "token_category": category.get("@id")});
        console.log("myVote: ", myVote);
        if ( myVote ){
          myVote = myVote.get("value") || 0;
        }
        else {
          myVote = 0;
        }

        var view = new TokenIdeaAllocationView({
          idea: idea,
          tokenCategory: category,
          voteSpecification: voteSpecification,
          myVotesCollection: myVotesCollection,
          currentValue: myVote
        });
        that.ui.tokensForIdea.append(view.render().el);
      });
    }
  },

  onShow: function(){
    this.renderCKEditorDescription();
  },
  
  renderCKEditorDescription: function() {
    var model = this.model.getDefinitionDisplayText();

    if (!model.length) return;

    var description = new CKEditorField({
      model: this.model,
      modelProp: 'definition',
      showPlaceholderOnEditIfEmpty: false,
      canEdit: false,
      readMoreAfterHeightPx: 39 // should match the min-heght of .idea-description .  Currently this is  2*$baseLineHeightFontMultiplier*$baseFontSize (2 lines)
    });

    this.getRegion('regionIdeaDescription').show(description);
  },
});

// This view shows the list of votable ideas and their tokens
var TokenVoteCollectionView = Marionette.CompositeView.extend({
  childView: TokenVoteItemView,
  template: '#tmpl-tokenVoteCollection',
  childViewContainer: "tbody",
  childViewOptions: function(model, index){
    var that = this;
    return {
      childIndex: index,
      parent: that
    };
  },
  templateHelpers: function(){
    var that = this;
    return {
      i18n: i18n,
      numberOfIdeas: that.collection.length
    };
  }
});

var TokenResultView = Marionette.LayoutView.extend({
  constructor: function ModalView(){
    Marionette.LayoutView.apply(this, arguments);
  },

  template: false,

  ui: {

  },

  events: {

  },

  regions: {

  },

  initialize: function(options){
    this.widget = options.model;
    var cm = new CollectionManager(),
        that = this;
    cm.getAllIdeasCollectionPromise()
      .then(function(ideas){
        that.ideas = ideas;
        return cm.getUserLanguagePreferencesPromise()
      .then(function(preferences){
        that.languagePreferences = preferences;
        // then get the vote results for each specification. 
      }) 

      //Take the list of "votable_ideas" from the widget model,
      //Take the token categories from the vote_specification ?
      //  The typename of each token category is the column where the vote
      //  results go to.
      //  From vote results, the 'sum' is the value that you want to present,
      //  not the 'num' which is the number of voters. 
      //
      //
      //Each section list of votable ideas is a vote token specification!
      //
      //Can use D3 linear scale (http://bl.ocks.org/kiranml1/6872226) to represent
      //the data.
    }); 
  }
});


// This view shows the whole vote popin and its contents
var TokenVoteSessionModal = Backbone.Modal.extend({
  constructor: function TokenVoteSessionModal() {
    Backbone.Modal.apply(this, arguments);
  },

  template: '#tmpl-tokenVoteSessionModal',
  className: 'modal-token-vote-session popin-wrapper',
  cancelEl: '.close, .js_close',

  initialize: function(options) {
    var that = this;


    that.widgetModel = options.widgetModel;
    console.log("that.widgetModel: ", that.widgetModel);

    
    var CollectionManager = require('../common/collectionManager.js'); // FIXME: Why does it not work when we write it only at the top of the file?
    var collectionManager = new CollectionManager();

    var voteSpecifications = that.widgetModel.get("vote_specifications");
    console.log("voteSpecifications: ", voteSpecifications);

    that.tokenVoteSpecification = null;
    that.tokenCategories = null;
    that.myVotesCollection = null;
    that.votableIdeasCollection = null;
    
    var tokenCategories = null;
    if (voteSpecifications && voteSpecifications.length > 0){
      that.tokenVoteSpecification = _.findWhere(voteSpecifications, {"@type": "TokenVoteSpecification"});
      if ( that.tokenVoteSpecification ){
        if ( "token_categories" in that.tokenVoteSpecification && _.isArray(that.tokenVoteSpecification.token_categories) ){
          var Widget = require('../models/widget.js'); // why does it work here but not at the top of the file?
          var Votes = require('../models/votes.js');
          console.log("Widget: ", Widget);
          console.log("tokenVoteSpecification.token_categories: ", that.tokenVoteSpecification.token_categories);
          that.tokenCategories = new Votes.TokenCategorySpecificationCollection(that.tokenVoteSpecification.token_categories);
          console.log("tokenCategories: ", tokenCategories);
        }
      }
    }

    // build myVotes collection from my_votes and keep it updated
    var Widget = require('../models/widget.js'); // why does it work here but not at the top of the file?
    var myVotes = "my_votes" in that.tokenVoteSpecification ? that.tokenVoteSpecification.my_votes : null;
    that.myVotesCollection = new Widget.TokenIdeaVoteCollection(myVotes);

    // This URL needs the idea id in the JSON payload
    var genericVotingUrl = "voting_url" in that.tokenVoteSpecification ? that.tokenVoteSpecification.voting_url : null; // for example: http://localhost:6543/data/Discussion/6/widgets/90/vote_specifications/22/votes
    that.myVotesCollection.url = Ctx.getUrlFromUri(genericVotingUrl); 
    console.log("that.myVotesCollection: ", that.myVotesCollection);
    
    
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

      that.votableIdeasCollection = new IdeasSubset();
      console.log("that.votableIdeasCollection: ", that.votableIdeasCollection);

      // Compute an ordering of votable ideas
      // Each participant should always see the same ordering, but 2 different participants can see a different ordering, and all possible orderings (permutations) should be distributed among participants as equally as possible.
      // When there are much less participants than possible permutations, participants should receive permutations which are different enough (for example: participants should not all see the same idea at the top position).
      var orderedVotableIdeas = that.votableIdeasCollection.sortBy(function(idea){return idea.id;}); // /!\ with this, "local:Idea/257" < "local:Idea/36"
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

      // Show available (remaining) tokens
      var tokenBagsView = new TokenBagsView({
        voteSpecification: that.tokenVoteSpecification,
        tokenCategories: that.tokenCategories,
        myVotesCollection: that.myVotesCollection
      });
      that.$(".available-tokens").html(tokenBagsView.render().el);

      // Show votable ideas and their tokens
      var collectionView = new TokenVoteCollectionView({
        collection: that.votableIdeasCollection,
        voteSpecification: that.tokenVoteSpecification,
        tokenCategories: that.tokenCategories,
        myVotesCollection: that.myVotesCollection,
        viewComparator: function(idea){
          return _.findIndex(permutation, function(idea2){return idea2.id == idea.id;});
        }
      });

      var regionVotablesCollection = new Marionette.Region({
        el: that.$(".votables-collection")
      });
      regionVotablesCollection.show(collectionView);
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

  onDestroy: function(){
    Ctx.clearModal({destroyModal: false});
  }
});

module.exports = TokenVoteSessionModal;
