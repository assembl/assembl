'use strict';
/**
 * 
 * @module app.views.tokenVoteSession
 */

var Marionette = require('../shims/marionette.js'),
  $ = require('jquery'),
  _ = require('underscore'),
  Promise = require('bluebird'),
  Assembl = require('../app.js'),
  classlist = require('classlist-polyfill'),
  Ctx = require('../common/context.js'),
  CollectionManager = require('../common/collectionManager.js'),
  Types = require('../utils/types.js'),
  BreadCrumbView = require('./breadcrumb.js'),
  CKEditorLSField = require('./reusableDataFields/ckeditorLSField.js'),
  IdeaModel = require('../models/idea.js'),
  LangString = require('../models/langstring.js'),
  i18n = require('../utils/i18n.js'),
  Ctx = require('../common/context.js'),
  Moment = require('moment'),
  d3 = require('d3');


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

// Icon of an "zero"/empty token := By clicking on it, the user sets 0 tokens on this idea
// path.outer is the outer circle, and path.inner is the inner disk. They get stylized differently using CSS depending on the icon's CSS hover state.
var zeroFullTokenIcon = $('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" style="width: 20px; height: 20px;" xml:space="preserve" aria-hidden="true" role="img" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="20px" height="20px" viewBox="0 0 20 20" version="1.1" inkscape:version="0.48.4 r9939" sodipodi:docname="token_zero.svg"> <metadata id="metadata22"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> </cc:Work> </rdf:RDF> </metadata> <sodipodi:namedview pagecolor="#ffffff" bordercolor="#666666" borderopacity="1" objecttolerance="10" gridtolerance="10" guidetolerance="10" inkscape:pageopacity="0" inkscape:pageshadow="2" inkscape:window-width="1541" inkscape:window-height="876" id="namedview20" showgrid="false" inkscape:zoom="23.6" inkscape:cx="5.5729235" inkscape:cy="10.96989" inkscape:window-x="59" inkscape:window-y="24" inkscape:window-maximized="1" inkscape:current-layer="svg2" /> <path class="outer" sodipodi:type="arc" fill="none" stroke="#000000" stroke-width="1" stroke-miterlimit="4" stroke-opacity="1" stroke-dasharray="none" id="path2999" sodipodi:cx="9.3644066" sodipodi:cy="11.271187" sodipodi:rx="6.2288136" sodipodi:ry="6.3559322" d="m 15.59322,11.271187 a 6.2288136,6.3559322 0 1 1 -12.4576271,0 6.2288136,6.3559322 0 1 1 12.4576271,0 z" transform="matrix(1.4872568,0,0,1.4575117,-3.9272774,-6.4278868)" /> <path class="inner" sodipodi:type="arc" fill:"#000000" fill-opacity="1" stroke="none" id="path2999-6" sodipodi:cx="9.3644066" sodipodi:cy="11.271187" sodipodi:rx="6.2288136" sodipodi:ry="6.3559322" d="m 15.59322,11.271187 a 6.2288136,6.3559322 0 1 1 -12.4576271,0 6.2288136,6.3559322 0 1 1 12.4576271,0 z" transform="matrix(0.80272108,0,0,0.78666666,2.4829934,1.133333)" /></svg>');

// Icon of a token := There will be maximum_per_idea of them shown per votable idea. By clicking on one of them, the user sets as many tokens on the idea
var oneFullTokenIcon = $('<a class="btn"><svg viewBox="0 0 20 20" style="width: 20px; height: 20px;"><path fill="#4691f6" d="M9.917,0.875c-5.086,0-9.208,4.123-9.208,9.208c0,5.086,4.123,9.208,9.208,9.208s9.208-4.122,9.208-9.208 C19.125,4.998,15.003,0.875,9.917,0.875z M9.917,18.141c-4.451,0-8.058-3.607-8.058-8.058s3.607-8.057,8.058-8.057 c4.449,0,8.057,3.607,8.057,8.057S14.366,18.141,9.917,18.141z M13.851,6.794l-5.373,5.372L5.984,9.672 c-0.219-0.219-0.575-0.219-0.795,0c-0.219,0.22-0.219,0.575,0,0.794l2.823,2.823c0.02,0.028,0.031,0.059,0.055,0.083 c0.113,0.113,0.263,0.166,0.411,0.162c0.148,0.004,0.298-0.049,0.411-0.162c0.024-0.024,0.036-0.055,0.055-0.083l5.701-5.7 c0.219-0.219,0.219-0.575,0-0.794C14.425,6.575,14.069,6.575,13.851,6.794z"></path></svg></a>');

var oneEmptyTokenIcon = $('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" style="width: 20px; height: 20px;" xml:space="preserve" aria-hidden="true" role="img" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="20px" height="20px" viewBox="0 0 20 20" version="1.1" inkscape:version="0.48.4 r9939" sodipodi:docname="token_zero.svg"> <metadata id="metadata22"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> </cc:Work> </rdf:RDF> </metadata> <sodipodi:namedview pagecolor="#ffffff" bordercolor="#666666" borderopacity="1" objecttolerance="10" gridtolerance="10" guidetolerance="10" inkscape:pageopacity="0" inkscape:pageshadow="2" inkscape:window-width="1541" inkscape:window-height="876" id="namedview20" showgrid="false" inkscape:zoom="23.6" inkscape:cx="5.5729235" inkscape:cy="10.96989" inkscape:window-x="59" inkscape:window-y="24" inkscape:window-maximized="1" inkscape:current-layer="svg2" /> <path class="outer" sodipodi:type="arc" fill="none" stroke="#000000" stroke-width="1" stroke-miterlimit="4" stroke-opacity="1" stroke-dasharray="none" id="path2999" sodipodi:cx="9.3644066" sodipodi:cy="11.271187" sodipodi:rx="6.2288136" sodipodi:ry="6.3559322" d="m 15.59322,11.271187 a 6.2288136,6.3559322 0 1 1 -12.4576271,0 6.2288136,6.3559322 0 1 1 12.4576271,0 z" transform="matrix(1.4872568,0,0,1.4575117,-3.9272774,-6.4278868)" /></svg>');


var contourOnlySVG = function(el, color){
  if ( color === undefined ){
    color = "green";
  }
  var selector = "path, rect, circle";
  el.find(selector).css("fill", "none");
  el.find(selector).css("stroke", color);
}

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
    if (!svg.attr("viewBox")){
      svg.attr("viewBox","0 0 100 100");
    }
    return svg;
  };

  var failure = function(){
    return success(oneFullTokenIcon);
  };

  _ajaxCache[url] = $.ajax({
    url: url,
    dataType: 'xml'
  }).then(success, failure);
  return _ajaxCache[url];
};


// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Copies el and animates it towards el2
var transitionAnimation = function(el, el2, duration){
  if ( !el.length || !el2.length ){
    return;
  }
  if ( duration === undefined ){
    duration = 1000;
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
  if ( el.css('display') == 'none' ){ // DOM elements which have the "display: none" CSS property are excluded from the rendering tree and thus have a position that is undefined.
    elo = el.siblings().first().offset();
  }
  var el2o = el2.offset();
  if ( el2.css('display') == 'none' ){ // DOM elements which have the "display: none" CSS property are excluded from the rendering tree and thus have a position that is undefined.
    el2o = el2.siblings().first().offset();
  }
  var top = el2o.top - elo.top;
  var left = el2o.left - elo.left;
  el3.offset(elo);
  el3.css("transition-duration", duration+"ms");
  el3.css("transform", "translate(" + left + "px, " + top + "px)");
  setTimeout(function(){
    el3.remove();
  }, duration);
};




// This view shows at the top of the popin the bag of remaining tokens the user has
var TokenBagsView = Marionette.LayoutView.extend({
  template: '#tmpl-tokenBags',
  regions: {
    "tokenBags": ".token-bags-content"
  },
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
    this.tokenSize = this.options.tokenSize;
    this.userLanguagePreferences = this.options.userLanguagePreferences;
  },
  onRender: function(){
    var that = this;

    var bags = new RemainingTokenCategoriesCollectionView({
      collection: that.tokenCategories,
      myVotesCollection: that.myVotesCollection,
      tokenSize: that.tokenSize,
      userLanguagePreferences: that.userLanguagePreferences
    });
    that.getRegion('tokenBags').show(bags);
  }
});

// This view shows the remaining tokens the user has, of a given category
// This view's model is a token category (an instance of Widget.TokenCategorySpecificationModel)
var RemainingCategoryTokensView = Marionette.ItemView.extend({
  template: false,
  initialize: function(options){
    if ( !("myVotesCollection" in this.options)){
      console.error("option myVotesCollection is mandatory");
      return;
    }

    this.myVotesCollection = this.options.myVotesCollection;
    this.listenTo(this.myVotesCollection, "change:category:"+this.model.getId(), this.render); // this is a category-level refresh, to refresh only the ones which have changed (avoids animation glitches triggered by allocation clicks on exclusive categories icons)
    this.tokenSize = options.tokenSize;
    this.userLanguagePreferences = options.userLanguagePreferences;
  },
  onRender: function(){
    var that = this;
    var categoryContainer = this.$el;
    categoryContainer.empty();
    
    var category = this.model;
    var customTokenImageURL = category.get("image");
    var customTokenImagePromise = customTokenImageURL ? getSVGElementByURLPromise(customTokenImageURL) : $.Deferred().resolve();
    var customEmptyTokenImageURL = category.get("image_empty");
    var color = category.get("color");
    var customEmptyTokenImagePromise = customEmptyTokenImageURL ? getSVGElementByURLPromise(customEmptyTokenImageURL) : $.Deferred().resolve();
    var data = that.myVotesCollection.getTokenBagDataForCategory(category);
    categoryContainer.addClass('token-bag-for-category');
    categoryContainer.addClass(category.getCssClassFromId());
    var el = $("<div></div>");
    el.addClass("description");

    var categoryNameLangString = category.get("name");
    var categoryNameBestTranslation = categoryNameLangString.bestWithErrors(that.userLanguagePreferences, false).entry.value();
    // var s = i18n.sprintf(i18n.ngettext("<span class='available-tokens-number'>%d</span> remaining %s token", "<span class='available-tokens-number'>%d</span> remaining %s tokens", data["remaining_tokens"]), data["remaining_tokens"], category.get("typename")); // TODO: use "name" field instead (LangString)
    var s = i18n.sprintf(i18n.ngettext("<span class='available-tokens-number'>%d</span> remaining %s token", "<span class='available-tokens-number'>%d</span> remaining %s tokens", data["remaining_tokens"]), data["remaining_tokens"], categoryNameBestTranslation);
    el.html(s);
    //el.text("You have used " + data["my_votes_count"] + " of your " + data["total_number"] + " \"" + category.get("typename") + "\" tokens.");
    el.appendTo(categoryContainer);

    var el2 = $("<div></div>");
    el2.addClass("available-tokens-icons");
    
    el2.appendTo(categoryContainer);
    $.when(customTokenImagePromise, customEmptyTokenImagePromise).then(function(fullToken, emptyToken){ 
      var token_size = that.tokenSize; // was getTokenSize(data["total_number"], 20, 400);

      for ( var i = 0; i < data["total_number"]; ++i ){
        var tokenContainer = $("<div class='token-icon'></div>");
        var tokenIconElement = fullToken.clone();

        var emptyTokenIconElement = null;
        if ( customEmptyTokenImageURL ){
          emptyTokenIconElement = emptyToken.clone();
        }
        else {
          emptyTokenIconElement = oneEmptyTokenIcon.clone();
        }
        if ( color ){
          contourOnlySVG(emptyTokenIconElement, color);
        }
        
        tokenIconElement[0].classList.add("token-icon-full");
        emptyTokenIconElement[0].classList.add("token-icon-empty");
        
        tokenIconElement.css("width", token_size);
        tokenIconElement.attr("width", token_size);
        tokenIconElement.css("height", token_size);
        tokenIconElement.attr("height", token_size);

        emptyTokenIconElement.css("width", token_size);
        emptyTokenIconElement.attr("width", token_size);
        emptyTokenIconElement.css("height", token_size);
        emptyTokenIconElement.attr("height", token_size);

        if ( i < data["remaining_tokens"] ){
          tokenContainer[0].classList.add("available");
        }
        else {
          tokenContainer[0].classList.add("not-available");
        }

        tokenContainer.append(tokenIconElement);
        tokenContainer.append(emptyTokenIconElement);
        el2.append(tokenContainer);
      }
    });
  }
});



var RemainingTokenCategoriesCollectionView = Marionette.CollectionView.extend({
  template: false,
  childView: RemainingCategoryTokensView,
  initialize: function(options) {
    this.myVotesCollection = options.myVotesCollection;
    this.tokenSize = options.tokenSize;
    this.userLanguagePreferences = options.userLanguagePreferences;
  },
  childViewOptions: function(){
    return {
      myVotesCollection: this.myVotesCollection,
      tokenSize: this.tokenSize,
      userLanguagePreferences: this.userLanguagePreferences
    };
  }
});



// This view shows (in the block of an idea) the clickable tokens (of one given category of tokens) a user can allocate (and has allocated) on this idea
// This view's model is a token category
var TokenCategoryAllocationView = Marionette.ItemView.extend({
  template: '#tmpl-tokenIdeaAllocation',
  className: "token-category-allocation",
  initialize: function(options){
    this.collectionView = options.collectionView;
    this.voteItemView = options.voteItemView;
    if ( !("voteSpecification" in this.options)){
      console.error("option voteSpecification is mandatory");
      return;
    }
    // if ( !("tokenCategory" in this.options)){
    //   console.error("option tokenCategory is mandatory");
    //   return;
    // }
    if ( !("idea" in this.options)){
      console.error("option idea is mandatory");
      return;
    }
    if ( !("myVotesCollection" in this.options)){
      console.error("option myVotesCollection is mandatory");
      return;
    }

    this.voteSpecification = this.options.voteSpecification;
    this.idea = this.options.idea;
    this.myVotesCollection = this.options.myVotesCollection;
    this.showZeroIcon = "showZeroIcon" in this.options ? this.options.showZeroIcon : true;
    this.preventDefaultTokenClickBehaviour = "preventDefaultTokenClickBehaviour" in this.options ? this.options.preventDefaultTokenClickBehaviour : false;
    this.forceUnselectZero = "forceUnselectZero" in this.options ? this.options.forceUnselectZero : false;
    this.tokenSize = "tokenSize" in this.options ? this.options.tokenSize : null;
    this.listenTo(this.myVotesCollection, "change:category:"+this.model.getId(), this.render); // force re-render of all other token allocation views of the same token category, so that only the right icons are clickable. We use this way instead of setting this.collection to this.myVotesCollection and adding a collectionEvents hash, because does it not seem to work (probably because the hash executes before initialize())

    var myVote = this.myVotesCollection.findWhere({"idea": this.idea.get("@id"), "token_category": this.model.get("@id")});
    if ( myVote ){
      this.currentValue = myVote.get("value") || 0;
    }
    else {
      this.currentValue = 0;
    }

    // validate token category's maximum_per_idea and total_number
    var maximum_per_idea = this.model.get("maximum_per_idea");
    var total_number = this.model.get("total_number");
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
    var category_id = this.model.get("@id");
    if ( voting_urls && _.isObject(voting_urls) && idea_id in voting_urls ){
      this.voteURL = Ctx.getUrlFromUri(voting_urls[idea_id]);
      this.postData["@type"] = "TokenIdeaVote";
      this.postData["token_category"] = category_id;
      //this.postData["value"] = 2;
    }
    else {
      console.error("could not compte this.voteURL and this.postData");
    }

    this.customTokenImageURL = this.model.get("image");
    this.customTokenImagePromise = this.customTokenImageURL ? getSVGElementByURLPromise(this.customTokenImageURL) : $.Deferred().resolve();

    this.customEmptyTokenImageURL = this.model.get("image_empty");
    this.customEmptyTokenImagePromise = this.customEmptyTokenImageURL ? getSVGElementByURLPromise(this.customEmptyTokenImageURL) : $.Deferred().resolve();

    this.customColor = this.model.get("color");
  },
  setForceUnselectZero: function(val){
    this.forceUnselectZero = val;
  },
  onRender: function(){
    var that = this;

    var customToken = null;
    var customEmptyToken = null;
    

    var container = this.$el;

    container.hover(function handlerIn(){
      container.addClass("hover");
    }, function handlerOut(){
      container.removeClass("hover");
      container.find(".token-icon").each(function(){
        this.classList.remove("hover");
      });
    });

    // needs: that.tokenSize (was getTokenSize()), that.model, that.customTokenImageURL, customToken, zeroFullTokenIcon, that.currentValue, that.myVotesCollection, transitionAnimation(), that.postData, that.idea, that.render()
    var renderClickableTokenIcon = function(number_of_tokens_represented_by_this_icon){
      var tokenIconElement = null;
      var emptyTokenIconElement = null;
      var tokenContainer = $('<a class="btn token-icon"></a>');

      var token_size = that.tokenSize; // was getTokenSize(that.model.get("total_number"), 20, 400); // we know this computed size will be smaller than getTokenSize(that.maximum_per_idea ? that.maximum_per_idea + 1 : 0, 10, 400); and we need icons in bags and in ideas to be the same size


      if ( number_of_tokens_represented_by_this_icon == 0 ){
        /* We used to create dynamically an icon for the zero token case, by styling the icon of the regular token. This is no longer the case, but we may revert this decision in the future.
        if ( that.customTokenImageURL ){
          tokenIconElement = customToken.clone();
          tokenIconElement[0].classList.add("custom");
        }
        else {
          tokenIconElement = zeroFullTokenIcon.clone();
          tokenIconElement[0].classList.add("default");
        }
        */
        tokenIconElement = zeroFullTokenIcon.clone();
        tokenContainer[0].classList.add("custom");

        tokenContainer[0].classList.add("zero");
        if ( !that.showZeroIcon ){
          tokenContainer.hide();
        }
      }
      else {
        if ( that.customTokenImageURL ){
          tokenIconElement = customToken.clone();
          tokenContainer[0].classList.add("custom");
        }
        else {
          tokenIconElement = oneFullTokenIcon.clone();
          tokenContainer[0].classList.add("default");
        }

        
        tokenContainer[0].classList.add("positive");
        tokenIconElement[0].classList.add("token-icon-full");

        if ( that.customEmptyTokenImageURL ){
          emptyTokenIconElement = customEmptyToken.clone();
        } else {
          emptyTokenIconElement = oneEmptyTokenIcon.clone();
        }
        if ( that.customColor ){
          contourOnlySVG(emptyTokenIconElement, that.customColor);
        }
        emptyTokenIconElement[0].classList.add("token-icon-empty");
      }
      /*
      From https://github.com/blog/2112-delivering-octicons-with-svg
      "You may have to wrap these SVGs with another div if you want to give them a background color."
      "Internet Explorer needs defined width and height attributes on the svg element in order for them to be sized correctly."
      */
      tokenIconElement.css("width", token_size);
      tokenIconElement.attr("width", token_size);
      tokenIconElement.css("height", token_size);
      tokenIconElement.attr("height", token_size);
      if ( number_of_tokens_represented_by_this_icon > 0 ){
        emptyTokenIconElement.css("width", token_size);
        emptyTokenIconElement.attr("width", token_size);
        emptyTokenIconElement.css("height", token_size);
        emptyTokenIconElement.attr("height", token_size);
      }

      var showAsSelected = false;
      if ( number_of_tokens_represented_by_this_icon == 0 ){
        if ( that.currentValue == 0 && !that.forceUnselectZero ){
          showAsSelected = true;
        }
      } else if ( number_of_tokens_represented_by_this_icon <= that.currentValue ) {
        showAsSelected = true;
      }
      if ( showAsSelected ){
        tokenContainer[0].classList.add("selected");
      }
      else {
        tokenContainer[0].classList.add("not-selected");
      }

      var tokenBagData = that.myVotesCollection.getTokenBagDataForCategory(that.model);
      var remaining_tokens = tokenBagData["remaining_tokens"];
      var userCanClickThisToken = (remaining_tokens + that.currentValue - number_of_tokens_represented_by_this_icon >= 0);
      if ( userCanClickThisToken ){
        tokenIconElement.appendTo(tokenContainer);
        if ( number_of_tokens_represented_by_this_icon > 0 ){
          emptyTokenIconElement.appendTo(tokenContainer);
        }

        tokenContainer.attr("title", i18n.sprintf(i18n.gettext("set %d tokens"), number_of_tokens_represented_by_this_icon));

        
        tokenContainer.click(function(){
          that.triggerMethod("token:click", number_of_tokens_represented_by_this_icon);
          if ( !that.preventDefaultTokenClickBehaviour ){
            that.onTokenIconClick(number_of_tokens_represented_by_this_icon, tokenContainer, tokenIconElement, container);
          }
        });
        
        tokenContainer.hover(function handlerIn(){
          tokenContainer[0].classList.add("hover");
          tokenContainer.prevAll().each(function(){
            if ( !(this.classList.contains("zero")) ){
              this.classList.add("hover");
            }
          });
          tokenContainer.nextAll().each(function(){
            this.classList.remove("hover");
          });
        }, function handlerOut(){
          if ( (this.classList.contains("zero")) ){
            this.classList.remove("hover");
          }
        });
      } // if ( userCanClickThisToken )
      else {
        //tokenIconElement.appendTo(link);
        emptyTokenIconElement.appendTo(tokenContainer);
        //tokenIconElement[0].classList.add("not-enough-available-tokens");
        tokenContainer[0].classList.add("not-enough-available-tokens");
        tokenContainer.attr("title", i18n.gettext("You don't have enough tokens remaining."));
      }
      
      tokenContainer.appendTo(container);
    };

    var renderAllTokenIcons = function(){
      for ( var i = 0; i <= that.maximum_per_idea; ++i ){
        renderClickableTokenIcon(i);
      }
    };

    $.when(that.customTokenImagePromise, that.customEmptyTokenImagePromise).then(function(fullIcon, emptyIcon){
      if ( that.customTokenImageURL ){
        customToken = fullIcon;
      }
      if ( that.customEmptyTokenImageURL ){
        customEmptyToken = emptyIcon;
      }
      renderAllTokenIcons();
    });
  },

  serializeData: function(){
    return {
      "maximum_per_idea": this.maximum_per_idea
    };
  },

  getCurrentValue: function(){
    return this.currentValue;
  },

  getTokenIconForValue: function(number_of_tokens_represented_by_this_icon){
    return this.$(".token-icon").eq(number_of_tokens_represented_by_this_icon);
  },

  // this function needs the following variables: number_of_tokens_represented_by_this_icon, that, that.currentValue, that.model, tokenContainer, that.postData, that.idea, that.myVotesCollection, tokenIconElement, container
  // TODO: refactor
  onTokenIconClick: function(number_of_tokens_represented_by_this_icon){
    var that = this;

    var tokenContainer = that.getTokenIconForValue(number_of_tokens_represented_by_this_icon);
    var tokenIconElement = tokenContainer.children().first();
    var container = that.$el;

    if ( that.currentValue == number_of_tokens_represented_by_this_icon && ((!that.forceUnselectZero && tokenIconElement.hasClass("selected")) || (that.forceUnselectZero && tokenIconElement.hasClass("not-selected"))) ){
      return;
    }

    console.log("set " + number_of_tokens_represented_by_this_icon + " tokens");
    var animation_duration = 800;

    var endAnimationTowardsNotAvailable = function(el){
      return function(){
        el.classList.remove("animating-towards-not-available");
        el.classList.remove("available");
        el.classList.add("not-available");
      };
    };

    var endAnimationTowardsAvailable = function(el){
      return function(){
        el.classList.remove("animating-towards-available");
        el.classList.remove("not-available");
        el.classList.add("available");
      };
    };

    // animation: are we adding or removing token to/from this idea?
    if ( that.currentValue < number_of_tokens_represented_by_this_icon ){ // we are adding tokens to this idea
      for ( var i = that.currentValue + 1; i <= number_of_tokens_represented_by_this_icon; ++i ){
        var selector = ".token-vote-session .token-bag-for-category." + that.model.getCssClassFromId() + " .available-tokens-icons .available";
        console.log("selector: ", selector);
        var theAvailableToken = $(selector).eq($(selector).length - 1 - (number_of_tokens_represented_by_this_icon - i));
        var theAllocatedToken = tokenContainer.parent().children().eq(i);
        theAvailableToken[0].classList.add("animating-towards-not-available");
        theAllocatedToken[0].classList.add("animating-towards-selected");
        setTimeout(endAnimationTowardsNotAvailable(theAvailableToken[0]), animation_duration*0.9);
        transitionAnimation(theAvailableToken.find("svg").first(), theAllocatedToken.find("svg").first(), animation_duration);
      }
    }
    else { // we are removing tokens from this idea
      var initial_value = number_of_tokens_represented_by_this_icon;
      for ( var i = that.currentValue; i > number_of_tokens_represented_by_this_icon; --i ){
        var selector = ".token-vote-session .token-bag-for-category." + that.model.getCssClassFromId() + " .available-tokens-icons .not-available";
        console.log("selector: ", selector);
        var theAvailableToken = $(selector).eq(i - number_of_tokens_represented_by_this_icon - 1);
        var theAllocatedToken = tokenContainer.parent().children().eq(i);
        theAvailableToken[0].classList.add("animating-towards-available");
        theAllocatedToken[0].classList.add("animating-towards-not-selected");
        setTimeout(endAnimationTowardsAvailable(theAvailableToken[0]), animation_duration*0.9);
        transitionAnimation(theAllocatedToken.find("svg").first(), theAvailableToken.find("svg").first(), animation_duration);
      }
    }

    var zeroToken = tokenContainer.parent().children().eq(0);
    if ( number_of_tokens_represented_by_this_icon == 0 ){
      zeroToken[0].classList.add("animating-towards-selected");
      zeroToken[0].classList.remove("animating-towards-not-selected");
    } else {
      zeroToken[0].classList.add("animating-towards-not-selected");
      zeroToken[0].classList.remove("animating-towards-selected");
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
    setTimeout(function(){
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
      if ( number_of_tokens_represented_by_this_icon > 0 || !that.forceUnselectZero ){
        tokenIconElement[0].classList.add("selected");
      }
      container.removeClass("hover");
      that.myVotesCollection.trigger("change:category:"+that.model.getId()); // force re-render of all token allocation views of this same token category (so that the right icons are clickable)
      that.render(); // show immediately the icon it its correct state, without having to wait for collection update
    }, animation_duration*0.9);
  }
});

// The collection parameter has to be a collection of token categories
var TokenCategoryAllocationCollectionView = Marionette.CollectionView.extend({
  template: '#tmpl-tokenCategoryAllocationCollection',
  childView: TokenCategoryAllocationView,
  initialize: function(options) {
    this.idea = options.idea;
    this.myVotesCollection = options.myVotesCollection;
    this.voteSpecification = options.voteSpecification;
    this.parent = options.parent;
    this.tokenSize = options.tokenSize;
  },
  childViewOptions: function(){
    return {
      idea: this.idea,
      myVotesCollection: this.myVotesCollection,
      voteSpecification: this.voteSpecification,
      collectionView: this,
      voteItemView: this.parent,
      tokenSize: this.tokenSize
    };
  }
});


var TokenCategoryExclusivePairCollectionView = Marionette.LayoutView.extend({
  template: '#tmpl-tokenCategoryExclusivePairCollection',
  regions: {
    negativeTokens: ".negative-tokens",
    positiveTokens: ".positive-tokens"
  },
  initialize: function(options) {
    this.idea = options.idea;
    this.myVotesCollection = options.myVotesCollection;
    this.voteSpecification = options.voteSpecification;
    this.parent = options.parent;
    this.tokenSize = options.tokenSize;
  },
  onShow: function() {
    // placeholder for better code. TODO: We need to choose positive/negative
    // according to typename.
    var negativeTokens = this.collection.at(0),
        positiveTokens = this.collection.at(1),
        childViewOptions = {
      idea: this.idea,
      myVotesCollection: this.myVotesCollection,
      voteSpecification: this.voteSpecification,
      collectionView: this,
      voteItemView: this.parent,
      model: negativeTokens,
      tokenSize: this.tokenSize
    };
    childViewOptions.preventDefaultTokenClickBehaviour = true;
    var animation_duration = 800;


    var negativeTokensView = new TokenCategoryAllocationView(childViewOptions);
    childViewOptions.model = positiveTokens;
    childViewOptions.showZeroIcon = false;
    var positiveTokensView = new TokenCategoryAllocationView(childViewOptions);

    if ( positiveTokensView.getCurrentValue() > 0 ){
      negativeTokensView.setForceUnselectZero(true);
    }

    this.getRegion("negativeTokens").show(negativeTokensView);
    this.getRegion("positiveTokens").show(positiveTokensView);


    positiveTokensView.on("token:click", function(clicked_value){
      console.log("positiveTokensView click clicked_value: ", clicked_value);
      var currentNegativeValue = negativeTokensView.getCurrentValue();
      var currentPositiveValue = positiveTokensView.getCurrentValue();
      negativeTokensView.setForceUnselectZero(true);
      if ( currentNegativeValue > 0 ){
        negativeTokensView.onTokenIconClick(0);
        setTimeout(function(){
          positiveTokensView.onTokenIconClick(clicked_value);
        }, animation_duration*0.9);
      } else {
        negativeTokensView.render();
        positiveTokensView.onTokenIconClick(clicked_value);
      }
    });

    negativeTokensView.on("token:click", function(clicked_value){
      console.log("negativeTokensView click clicked_value: ", clicked_value);
      var currentNegativeValue = negativeTokensView.getCurrentValue();
      var currentPositiveValue = positiveTokensView.getCurrentValue();
      negativeTokensView.setForceUnselectZero(false);
      if ( currentPositiveValue > 0 ){
        negativeTokensView.render();
        positiveTokensView.onTokenIconClick(0);
        setTimeout(function(){
          negativeTokensView.onTokenIconClick(clicked_value);
        }, animation_duration*0.9);
      } else {
        negativeTokensView.onTokenIconClick(clicked_value);
      }
    });
  }
});


// This view shows an idea in the list of votable ideas (and calls a subview which shows the tokens for this idea)
var TokenVoteItemView = Marionette.LayoutView.extend({
  template: '#tmpl-tokenVoteItem',
  initialize: function(options){
    this.childIndex = options.childIndex;
    this.parent = options.parent;
    this.userLanguagePreferences = options.userLanguagePreferences;
  },

  regions: {
    regionIdeaDescription: ".js_region-idea-description",
    tokensForIdea: ".tokens-for-idea"
  },

  serializeData: function(){
    return {
      "ideaTitle": (this.childIndex+1) + ". " + this.model.getShortTitleDisplayText(this.userLanguagePreferences)
    }
  },
  onRender: function(){
    var that = this;
    var tokenCategories = "tokenCategories" in this.parent.options ? this.parent.options.tokenCategories : null;
    var voteSpecification = "voteSpecification" in this.parent.options ? this.parent.options.voteSpecification : null;
    var myVotesCollection = "myVotesCollection" in this.parent.options ? this.parent.options.myVotesCollection : null;
    var tokenSize = "tokenSize" in this.parent.options ? this.parent.options.tokenSize : null;
    var idea = that.model;
    var tokenCategoryCollection;
    if ( tokenCategories ){
      // if there are 2 categories and they are exclusive, we show them on a single row
      if ( tokenCategories.length == 2 && voteSpecification && "exclusive_categories" in voteSpecification && voteSpecification.exclusive_categories ){
        // that.ui.tokensForIdea.addClass("exclusive");
        tokenCategoryCollection = new TokenCategoryExclusivePairCollectionView({
          idea: idea,
          collection: tokenCategories,
          myVotesCollection: myVotesCollection,
          voteSpecification: voteSpecification,
          tokenSize: tokenSize
        });
      } else {
        tokenCategoryCollection = new TokenCategoryAllocationCollectionView({
          idea: idea,
          collection: tokenCategories,
          myVotesCollection: myVotesCollection,
          voteSpecification: voteSpecification,
          parent: this,
          tokenSize: tokenSize
        });
      }
      this.getRegion('tokensForIdea').show(tokenCategoryCollection);
    }
  },

  onShow: function(){
    this.renderCKEditorDescription();
  },

  renderCKEditorDescription: function() {
    var defn = this.model.get('definition');
    if (!defn || defn.isEmptyStripped(this.userLanguagePreferences)) {
      return;
    }

    var description = new CKEditorLSField({
      model: this.model,
      modelProp: 'definition',
      translationData: this.userLanguagePreferences,
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
  initialize: function(options) {
    this.options = options;
  },
  childViewOptions: function(model, index){
    return {
      childIndex: index,
      parent: this,
      userLanguagePreferences: this.getOption('userLanguagePreferences')
    };
  },
  templateHelpers: function(){
    return {
      i18n: i18n,
      numberOfIdeas: this.collection.length
    };
  }
});


// List of views for the result modal.

/*
  The view of a single vote result, which will be created by
  the collection view TokenVoteResultCollectionView
 */
var TokenVoteResultView = Marionette.LayoutView.extend({
  constructor: function TokenVoteResultView(){
    Marionette.LayoutView.apply(this, arguments);
  },

  template: '#tmpl-tokenVoteResultSingleView',
  className: 'token-result-row',

  ui: {
    'descriptionArea': '.js_see-idea-description',
    'descriptionButton': '.js_description-button',
    'descriptionRegion': '.js_region-idea-description'
  },

  events: {
    'click @ui.descriptionArea': 'onSeeDescriptionClick'
  },

  regions: {
    'regionIdeaDescription': '@ui.descriptionRegion'
  },

  initialize: function(options){
    this.categoryIndex = options.categoryIndex;
    this.shownDescription = false;
    this.categoryNumber = _.indexOf(this.categoryIndex, this.model.get('typename'));
    this.sumTokens = options.sumTokens;
    this.maxPercent = options.maxPercent;
    this.voteSpecification = options.voteSpecification;
    this.userLanguagePreferences = options.userLanguagePreferences;
    this.maxPixels = 100;
    this.shownDescription = false;
    this.descriptionButton = i18n.gettext("See Description");
    this._calculate();
  },

  _calculateColor: function(categoryName){

    //http://jsfiddle.net/WK_of_Angmar/xgA5C/
    function validTextColour(stringToTest) {
      //Alter the following conditions according to your need.
      if (stringToTest === "") { return false; }
      if (stringToTest === "inherit") { return false; }
      if (stringToTest === "transparent") { return false; }
      
      var image = document.getElementById('js_test-css-color');
      image.style.color = "rgb(0, 0, 0)";
      image.style.color = stringToTest;
      if (image.style.color !== "rgb(0, 0, 0)") { return true; }
      image.style.color = "rgb(255, 255, 255)";
      image.style.color = stringToTest;
      return image.style.color !== "rgb(255, 255, 255)";
    };

    var categories = this.voteSpecification.get('token_categories'),
        cat = categories.find(function(category){
          return category.get('typename') === categoryName;
        });
    var color = cat.get('color') || null;
    if (color){
      var tmp;
      color.trim(); //Get rid of whitespace around text
      if (!(color.indexOf('#') === 0)){
        tmp = "#" + color;
      }
      var isGoodCss = validTextColour(tmp);
      return isGoodCss ? tmp : null;
    }
    else { return null; }
  },

  _getCategoryName: function(catName){
    var categoryModel = this.model.get('objectDescription').find(function(cat){
      return cat.get('typename') === catName;
    });
    return categoryModel.get('name').bestWithErrors(this.userLanguagePreferences, false).entry.value();
  },

  _calculate: function(){
    var that = this;
    this.results = _.map(this.categoryIndex, function(catName, index) {
        return {
            sum: that.model.get('sums')[catName] || 0,
            num: that.model.get('nums')[catName] || 0,
            n: that.model.get('n'),
            totalTokens: that.sumTokens[index],
            /*
              The color attribute is tested against a dummy img tag in a parent view.
              This validates the css color attribute. Returns null if test fail
             */
            color: that._calculateColor(catName),
            categoryName: that._getCategoryName(catName)
        };
    });
  },

  _getDefaultColor: function(){
    var elem = $('#js_vote-result-default-color');
    return elem.css('background-color');
  },

  serializeData: function() {
    var defn = this.model.get('objectConnectedTo').get('definition');
    return {
      ideaTitle: this.model.get('objectConnectedTo').getShortTitleDisplayText(this.userLanguagePreferences),
      categoryResult: this.results,
      showDescriptionButton: defn && !defn.isEmptyStripped(this.userLanguagePreferences),
      descriptionButton: this.descriptionButton
    };
  },

  onRender: function(){
    //Have to define the data-points in an array.
    Ctx.removeCurrentlyDisplayedTooltips();
    // var unknownColor = '#515151'; //$gray2
    var unknownColor = this._getDefaultColor();
    var displayTooltip = function(num, total, category){
      //Simplify to give more of a human feel.
      return i18n.sprintf(
        i18n.ngettext("%d token \"%s\" was voted on this idea, out of a total %d \"%s\" tokens voted ",
                      "%d tokens \"%s\" were voted on this idea, out of a total %d \"%s\" tokens voted", num),
        num, category, total, category);
    };

    var scale = d3.scale.linear()
                        .domain([0, this.maxPercent])
                        .range([0, this.maxPixels]);

    var percent = d3.format('%');
    var results = d3.select(this.el)
       .selectAll("div.token-vote-result-category-column")
        .data(this.results);
    results.append('div')
      .attr('data-toggle', 'tooltip')
      .attr('data-position', 'top')
      .attr('title', function(r){ return displayTooltip(r.sum, r.totalTokens, r.categoryName)})
      .style('background-color', function(d){
        return d.color ? d.color : unknownColor;
      })
      .style('display', 'inline-block')
      .style('border-radius', '3px')
      .style('height', '14px')
      .style('margin-top', '5px')
      .style('width', function(r) {
        if (r.totalTokens == 0) {
            return "0";
        }
        var d = r.sum / r.totalTokens;
        var tmp = scale(d) + 'px';
        return tmp; }).append('img');
    results.append('span')
      .style('margin-left', '5px')
      .text(function(r) {
        if (r.totalTokens == 0) {
            return "-";
        }
        var d = r.sum / r.totalTokens;
        return percent(d);
    });
    Ctx.initTooltips(this.$el);
  },

  onSeeDescriptionClick: function(ev){
    ev.preventDefault();
    var icon = this.ui.descriptionArea.find('i');
    if (this.shownDescription === true) {
      this.shownDescription = false;
      this.ui.descriptionButton.text(this.descriptionButton);
      icon.removeClass('icon-arrowup');
      icon.addClass('icon-arrowdown');
      this.ui.descriptionRegion.empty();
    }

    else {
      this.shownDescription = true;
      var descriptionButtonText = i18n.gettext("Hide Description"),
          defn = this.model.get('objectConnectedTo').get('definition');
      icon.removeClass('icon-arrowdown');
      icon.addClass('icon-arrowup');
      this.ui.descriptionButton.text(descriptionButtonText);
      this.ui.descriptionRegion.html(defn ? defn.bestValue(this.userLanguagePreferences) : '');
    }
  }

});

/*
  This is the collection view of each vote result
 */
var TokenVoteResultCollectionView = Marionette.CompositeView.extend({
  constructor: function TokenVoteResultCollectionView(){
    Marionette.CompositeView.apply(this, arguments);
  },

  template: '#tmpl-tokenVoteResultCollectionView',

  ui: {
    'categoryName': '.js_vote-result-category'
  },

  events: {
    'click @ui.categoryName': 'onCategoryClickName'
  },

  childView: TokenVoteResultView,
  childViewContainer: 'tbody',
  sortOnCategoryNum: 0,
  initialize: function(options){
    this.firstRender = true;
    this.categoryIndex = options.categoryIndex;
    this.sumTokens = options.sumTokens;
    this.maxPercent = options.maxPercent;
    this.voteResults = options.voteResults;
    this.voteSpecification = options.voteSpecification;
    this.userLanguagePreferences = options.userLanguagePreferences;
    this.sortAscending = _.map(this.categoryIndex, function() {return false;});
    this.voteResults.sortSpecName = this.categoryIndex[this.sortOnCategoryNum];
    this.voteResults.sort();
  },

  _colorMeBaby: function(element){
    if (!element.hasClass('purple')){
      element.addClass('purple');
    }
  },

  onCategoryClickName: function(ev){
    // remove old arrow
    var arrowEl = $(this.ui.categoryName[this.sortOnCategoryNum]).find("i");
    arrowEl.removeClass("icon-down icon-up");
    // Set our state
    var category = ev.currentTarget.cellIndex - 1;
    if (category == this.sortOnCategoryNum) {
        this.sortAscending[category] = !this.sortAscending[category];
    } else {
        this.sortOnCategoryNum = category;
        arrowEl = $(ev.currentTarget).find('i');
    }
    // set arrow
    if (this.sortAscending[category]) {
        arrowEl.addClass("icon-up");
    } else {
        arrowEl.addClass("icon-down");
    }
    //Remove purple class from each category, save the column selected
    var that = this;
    _.each(this.sortAscending, function(value, index){
      var el = $(that.ui.categoryName[index]);
      if (index === category) {
        that._colorMeBaby(el);
      }
      else {
        el.removeClass('purple');
      }
    });

    // Sort the collection based on the category
    this.voteResults.sortSpecName = this.categoryIndex[this.sortOnCategoryNum];
    this.voteResults.sortAscending = this.sortAscending[category];
    this.voteResults.sort();
  },

  childViewOptions: function(){
    return {
      categoryIndex: this.categoryIndex,
      sumTokens: this.sumTokens,
      maxPercent: this.maxPercent,
      voteSpecification: this.voteSpecification,
      userLanguagePreferences: this.userLanguagePreferences
    };
  },

  onRender: function() {
    if (this.firstRender) {
      var el = $(this.ui.categoryName[0]),
          arrowEl = el.find("i");
      arrowEl.addClass("icon-down");
      this._colorMeBaby(el);
      this.firstRender = false;
    }
  },

  serializeData: function(){
    var that = this,
        categories = _.values(this.categoryIndex),
        categoryList = this.voteSpecification.get('token_categories');
    categories = _.map(categories, function(cat){
      var importantCategory = categoryList.find(function(categoryModel){
        //Has to exist, as the original category list was created from the models
        return categoryModel.get('typename') === cat;
      });
      var categoryLangString = importantCategory.get('name');
      var best = categoryLangString.bestWithErrors(that.userLanguagePreferences, false);
      return best.entry.value()
    });

    categories = _.map(categories, function(cat){
      return i18n.sprintf(i18n.gettext("Token: \"%s\""), cat);
    });
    return {
      categories: categories
    }
  }
});


/*
  The Token Vote Result View:
  It contains the question asked, and a collection view of each
  idea's vote results
 */
var TokenResultView = Marionette.LayoutView.extend({
  constructor: function ModalView(){
    Marionette.LayoutView.apply(this, arguments);
  },

  template: "#tmpl-tokenVoteResultView",

  ui: {
    'resultArea': '.js_vote-result-region'
  },

  regions: {
    'results': '@ui.resultArea'
  },

  initialize: function(options){
    this.model = options.model;

    //categoryIndex will be used by each vote result view to show the results in the correct order,
    //{index: category}
    this.categoryIndex = [];

    var CollectionManager = require('../common/collectionManager.js'),
        cm = new CollectionManager(),
        Widget = require('../models/widget.js'),
        that = this;


    cm.getAllIdeasCollectionPromise()
      .then(function(ideas){
        that.ideas = ideas;
        //Add ONLY the subset of votable_ideas!!!
        return cm.getUserLanguagePreferencesPromise(Ctx)
      .then(function(preferences){
        that.userLanguagePreferences = preferences;
      }).then(function(){
        that.voteResults = new Widget.VoteResultCollection({widgetModel: that.model, parse: true});
        return that.voteResults.fetch();
      }).then(function(){
        //Don't care about results, it's been fetched.
        that.tokenSpecs = that.model.getVoteSpecificationModel();
        that.voteResults.associateTo(that.ideas, that.tokenSpecs);

        //Determine the sort order of the categories and get their names:
        var categories = that.tokenSpecs.get('token_categories');
        categories.each(function(category, index){
          var name = category.get('typename');
          that.categoryIndex.push(name);
        });
        
        //Get statistics from the collection
        var stats = that.voteResults.getStatistics();
        that.numVoters = stats.numVoters;
        that.totalTokensVoted = stats.categorySummary;

        var settings = that.model.get("settings") || {};
        var items = "items" in settings ? settings.items : [];
        var question_item = items.length ? items[0] : null;

        var questionTitleLangString = new LangString.Model();
        questionTitleLangString.initFromObjectProperty(question_item, 'question_title');
        if ( questionTitleLangString.getEntries().length ){
          that.questionTitle = questionTitleLangString.bestValue(that.userLanguagePreferences);
        }

        var questionDescriptionLangString = new LangString.Model();
        questionDescriptionLangString.initFromObjectProperty(question_item, 'question_description');
        if ( questionDescriptionLangString.getEntries().length ){
          that.questionDescription = questionDescriptionLangString.bestValue(that.userLanguagePreferences);
        }

        that.tokenResultsView = new TokenVoteResultCollectionView({
          collection: that.voteResults,
          categoryIndex: that.categoryIndex,
          sumTokens: stats.sumTokens,
          maxPercent: stats.maxPercent,
          voteResults: that.voteResults,
          reorderOnSort: true, //disable re-rendering child views on sort
          voteSpecification: that.tokenSpecs,
          userLanguagePreferences: that.userLanguagePreferences
        });
        if (!that.isViewDestroyed()){
          that.isReady = true;
          that.render();
          that.results.show(that.tokenResultsView);
        }
      });
    });
  },

  serializeData: function(){
    var settings = this.model.get("settings") || {},
        items = "items" in settings ? settings.items : [],
        questionItem = items.length ? items[0] : null,
        questionTitle = this.questionTitle ? this.questionTitle : "question_title" in questionItem ? questionItem.question_title : "",
        questionDescription = this.questionDescription ? this.questionDescription : "question_description" in questionItem ? questionItem.question_description : "",
        startDate = Ctx.getNiceDate(this.model.get('start_date'), true, true, false),
        endDate = Ctx.getNiceDate(this.model.get('end_date'), true, true, false),
        statement = "",
        that = this;

    if (!this.isReady) { 
      return {
        questionTitle: questionTitle,
        questionDescription: questionDescription,
        statement: statement
      };
    }

    else {
      var theEndDate = new Moment(this.model.get('end_date')).utc(),
          _now = new Moment().utc(),
          voteOngoing = _now.isAfter(theEndDate) ? 100: 1; //Plurarlism for past/present tense of copy
      
      //Need a list of token names and their available number
      var data = this.tokenSpecs.get('token_categories').map(function(category){
        return {
          name: category.get('name').bestWithErrors(that.userLanguagePreferences, false).entry.value(),
          number: category.get('total_number')
        }
      });

      statement += "<div>";
      statement += i18n.sprintf(
        i18n.ngettext(
          "%d participant voted between %s and %s. The number of tokens available for voting per participant:",
          "%d participants voted between %s and %s. The number of tokens available for voting per participant:", that.numVoters),
        that.numVoters, startDate, endDate);

      statement += "</div><div><ul>";
      _.each(data, function(category){
        statement += "<li>"
        statement += i18n.sprintf(
                      i18n.ngettext("<strong>%d</strong> token of type \"%s\"",
                                    "<strong>%d</strong> tokens of type \"%s\"", category.number),
                      category.number, category.name);
        statement += "</li>";
      });
      statement += "</ul></div>"
      return {
        questionTitle: questionTitle,
        questionDescription: questionDescription,
        numVoters: this.numVoters,
        totalVoted: this.totalTokensVoted,
        statement: statement
      }
    }
  },

  onShow: function(){
    var that = this;
    if (this.tokenResultsView){
      this.results.show(this.tokenResultsView);
    }
  }
});


/*
  The results modal view
  It is barely a simple container for the real view: TokenResultView
 */
var TokenVoteSessionResultModal = Backbone.Modal.extend({
  constructor: function TokenVoteSessionResultModel(){
    Backbone.Modal.apply(this, arguments);
  },

  template: '#tmpl-modalWithoutIframe',
  className: 'modal-token-vote-session popin-wrapper',
  cancelEl: '.close, .js_close',

  ui: {
    'body': '.js_modal-body'
  },

  onRender: function(){
    var resultView = new TokenResultView({model: this.model});
    this.$(this.ui.body).html(resultView.render().el);
  },

  serializeData: function(){
    return {
      modal_title: i18n.gettext('Token Vote Results')
    }
  }

});


// This view shows the whole vote popin and its contents
// The model which should be given as parameter of this view is a Widget.Model instance (or a subclass of it)
var TokenVoteSessionModal = Backbone.Modal.extend({
  constructor: function TokenVoteSessionModal() {
    Backbone.Modal.apply(this, arguments);
  },

  template: '#tmpl-tokenVoteSessionModal',
  className: 'modal-token-vote-session popin-wrapper',
  cancelEl: '.close, .js_close',
  events: {
    //'scroll .popin-body': 'onScroll', // scroll event does not bubble up, and scrollable element is now .popin-body instead of this.$el
    'click .submit-button-container a': 'onSubmit'
  },

  availableTokensPositionTop: 1000, // initial value high, will be updated in render()

  initialize: function(options) {
    var that = this;


    this.widgetModel = this.model;
    console.log("that.widgetModel: ", that.widgetModel);

    var Widget = require('../models/widget.js'); // FIXME: why does it work here but not at the top of the file?
    var CollectionManager = require('../common/collectionManager.js'); // FIXME: Why does it not work when we write it only at the top of the file?
    var collectionManager = new CollectionManager();

    var voteSpecifications = that.widgetModel.get("vote_specifications");
    console.log("voteSpecifications: ", voteSpecifications);

    that.tokenVoteSpecification = null;
    that.tokenCategories = null;
    that.myVotesCollection = null;
    that.votableIdeasCollection = null;
    
    if (voteSpecifications && voteSpecifications.length > 0){
      that.tokenVoteSpecification = _.findWhere(voteSpecifications, {"@type": "TokenVoteSpecification"});
      if ( that.tokenVoteSpecification ){
        if ( "token_categories" in that.tokenVoteSpecification ){
          if ( _.isArray(that.tokenVoteSpecification.token_categories) ){
            console.log("going to parse tokenVoteSpecification.token_categories and convert it into a TokenCategorySpecificationCollection");
            that.tokenCategories = new Widget.TokenCategorySpecificationCollection(that.tokenVoteSpecification.token_categories, {parse: true});
          } else if ( _.isObject(that.tokenVoteSpecification.token_categories) ){
            console.log("wtf, tokenVoteSpecification.token_categories was already parsed and converted into a TokenCategorySpecificationCollection");
            that.tokenCategories = that.tokenVoteSpecification.token_categories;
          }
        }
      }
    }
    if ( !that.tokenCategories ){
      console.error("that.tokenCategories should not be empty");
    }

    // build myVotes collection from my_votes and keep it updated
    
    var myVotes = "my_votes" in that.tokenVoteSpecification ? that.tokenVoteSpecification.my_votes : null; // TODO: maybe we should dynamically load user's votes on each time the user opens the popin, instead of relying on potentially outdated user vote data
    that.myVotesCollection = new Widget.TokenIdeaVoteCollection(myVotes);

    // This URL needs the idea id in the JSON payload
    var genericVotingUrl = "voting_url" in that.tokenVoteSpecification ? that.tokenVoteSpecification.voting_url : null; // for example: http://localhost:6543/data/Discussion/6/widgets/90/vote_specifications/22/votes
    that.myVotesCollection.url = Ctx.getUrlFromUri(genericVotingUrl); 
    console.log("that.myVotesCollection: ", that.myVotesCollection);
    
    
    Promise.join(collectionManager.getUserLanguagePreferencesPromise(Ctx), collectionManager.getAllIdeasCollectionPromise(), function(userLanguagePreferences, allIdeasCollection) {
      that.userLanguagePreferences = userLanguagePreferences;
      var settings = that.widgetModel.get("settings") || {};
      var items = "items" in settings ? settings.items : [];
      var question_item = items.length ? items[0] : null;

      var questionTitleLangString = new LangString.Model();
      questionTitleLangString.initFromObjectProperty(question_item, 'question_title');
      if ( questionTitleLangString.getEntries().length ){
        that.$('.question-title').text(questionTitleLangString.bestValue(that.userLanguagePreferences));
      }

      var questionDescriptionLangString = new LangString.Model();
      questionDescriptionLangString.initFromObjectProperty(question_item, 'question_description');
      if ( questionDescriptionLangString.getEntries().length ){
        that.$('.question-description').text(questionDescriptionLangString.bestValue(that.userLanguagePreferences));
      }

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

      // Compute an ordering of votable ideas
      // Each participant should always see the same ordering, but 2 different participants can see a different ordering, and all possible orderings (permutations) should be distributed among participants as equally as possible.
      // When there are much less participants than possible permutations, participants should receive permutations which are different enough (for example: participants should not all see the same idea at the top position).
      var orderedVotableIdeas = that.votableIdeasCollection.sortBy(function(idea){return idea.id;}); // /!\ with this, "local:Idea/257" < "local:Idea/36"
      var n = orderedVotableIdeas.length; // if there are n votable ideas, then there are m = n! ("n factorial") possible permutations
      // TODO: What if there are too many votable ideas and so the computation of n! would take too much time?
      // TODO: This permutation computation algorithm is not perfect: when there are much more possible permutations than voters, the permutations used will be only the top and bottom few ones, so I guess the few first and the few last ideas have more chances to appear at the top of users' screens than those in the middle of the initial list.
      if ( n < 100 ){
        var m = sFact(n);
        var u = parseInt(Ctx.getCurrentUserId());
        if ( u ){
          var permutationIndex = alternatedIndex(u % m, m);
          var permutation = nthPermutation(orderedVotableIdeas, permutationIndex, orderedVotableIdeas.length);
          console.log("permutation: ", permutation);
        }
      }

      var tokenVoteSpecificationModel = new Widget.TokenVoteSpecificationModel(that.tokenVoteSpecification, {parse: true});
      console.log("tokenVoteSpecificationModel: ", tokenVoteSpecificationModel);
      var maximumTokensPerRow = that.computeMaximumTokensPerRow(tokenVoteSpecificationModel);
      console.log("maximumTokensPerRow: ", maximumTokensPerRow);
      var tokenSize = that.computeTokenSize(maximumTokensPerRow);
      console.log("tokenSize: ", tokenSize);

      // Show available (remaining) tokens
      var tokenBagsView = new TokenBagsView({
        voteSpecification: that.tokenVoteSpecification,
        tokenCategories: that.tokenCategories,
        myVotesCollection: that.myVotesCollection,
        tokenSize: tokenSize,
        userLanguagePreferences: that.userLanguagePreferences
      });
      that.$(".available-tokens").html(tokenBagsView.render().el);

      // Show votable ideas and their tokens
      var collectionView = new TokenVoteCollectionView({
        collection: that.votableIdeasCollection,
        voteSpecification: that.tokenVoteSpecification,
        tokenCategories: that.tokenCategories,
        myVotesCollection: that.myVotesCollection,
        tokenSize: tokenSize,
        userLanguagePreferences: that.userLanguagePreferences,
        viewComparator: function(idea){
          return _.findIndex(permutation, function(idea2){return idea2.id == idea.id;});
        }
      });
      var regionVotablesCollection = new Marionette.Region({
        el: that.$(".votables-collection")
      });
      regionVotablesCollection.show(collectionView);
    });

    that.throttledScroll = _.throttle(that.myOnScroll, 100);

  },

  beforeCancel: function(){
    window.location = Ctx.getDiscussionGenericURL();
  },

  onShow: function(){
    var that = this;

    that.availableTokensPositionTop = that.$(".available-tokens").position().top;
    that.$(".available-tokens").width(that.$(".popin-body").width());
    var popinHeaderTotalHeight = that.$(".popin-header").outerHeight();
    that.$(".available-tokens").css("top", popinHeaderTotalHeight + (popinHeaderTotalHeight > 0 ? "px" : ""));
    that.$(".available-tokens-container").css('min-height', "36px");

    that.$(".popin-body").on('scroll', _.bind(that.onScroll, that)); // scroll event does not bubble up, and scrollable element is now .popin-body instead of this.$el
  },

  onScroll: function(){
    this.throttledScroll();
  },

  myOnScroll: function(){
    if (this.$(".popin-body").scrollTop() > this.availableTokensPositionTop) {
      this.$(".available-tokens").addClass("fixed");
    }
    else {
      this.$(".available-tokens").removeClass("fixed");
    }
  },

  serializeData: function() {
    var settings = this.widgetModel.get("settings") || {};
    var items = "items" in settings ? settings.items : [];
    var question_item = items.length ? items[0] : null;
    var question_title = "question_title" in question_item ? question_item.question_title : "";
    var question_description = "question_description" in question_item ? question_item.question_description : "";
    return {
      popin_title: i18n.gettext("Collective votes"),
      question_title: question_title,
      question_description: question_description,
      available_tokens_info: i18n.gettext("Split your tokens among the ideas of your choice. By default, your vote is neutral per project."),
      save_vote: i18n.gettext("Save my votes")
    };
  },

  onDestroy: function(){
    if ( this.widgetModel ){
      /*
      We re-fetch widget data from the server, so that when the user opens the vote popin again,
      up-to-date information is displayed (because this widget data comes from a model contained
      in the collection collectionManager::getAllWidgetsPromise()).
      TODO: This is a bit hacky, maybe we should find a better way, for example when popin opens, re-load user votes (instead of widget) and use these instead of the ones listed in the widget.
      */
      this.widgetModel.fetch();
    }
    Ctx.clearModal({destroyModal: false});
  },

  onSubmit: function(){
    var modalView = new TokenVoteSessionSubmittedModal({ model: this.model});
    this.onDestroy();
    this.remove();
    Ctx.setCurrentModalView(modalView);
    Assembl.slider.show(modalView);
  },

  /*
  @param tokenVoteSpecification: an instance of TokenVoteSpecificationModel
  Output value is computed as follows:
  if (categories.length == 2 and categories are exclusive){
    maximum_tokens_per_row := sum(category.maximum_per_idea foreach category in tokenVoteSpecification.tokenCategories) + 1
  }
  else {
    maximum_tokens_per_row := max(category.maximum_per_idea foreach category in tokenVoteSpecification.tokenCategories) +1
  }
  maximum_tokens_per_row := max(maximum_tokens_per_row, max(category.total_number foreach category in tokenVoteSpecification.tokenCategories))
  */
  computeMaximumTokensPerRow: function(tokenVoteSpecification){
    var maximum_tokens_per_row = 0;
    var maximum_tokens_per_idea_row = 0;

    // compute maximum per idea row
    var tokenCategories = tokenVoteSpecification.get('token_categories');
    if ( tokenCategories.length == 2 && tokenVoteSpecification.get('exclusive_categories') == true ){
      maximum_tokens_per_idea_row = tokenCategories.reduce(function(memo, category){
        var category_maximum;
        if ( category.get('maximum_per_idea') > 0 ){
          category_maximum = category.get('maximum_per_idea');
        }
        else {
          category_maximum = category.get('total_number') || 0;
        }
        return memo + category_maximum;
      }, 0);
      maximum_tokens_per_idea_row += 1; // add the zero token icon
    }
    else {
      maximum_tokens_per_idea_row = tokenCategories.reduce(function(memo, category){
        var category_maximum;
        if ( category.get('maximum_per_idea') > 0 ){
          category_maximum = category.get('maximum_per_idea');
        }
        else {
          category_maximum = category.get('total_number') || 0;
        }
        return Math.max(memo, category_maximum);
      }, 0);
      maximum_tokens_per_idea_row += 1; // add the zero token icon
    }

    // compute maximum per remaining token bags row
    var maximum_tokens_in_a_bag = tokenCategories.max('total_number').get('total_number') || 0;
    maximum_tokens_per_row = Math.max(maximum_tokens_per_idea_row, maximum_tokens_in_a_bag) || 0;
    return maximum_tokens_per_row;
  },

  computeTokenSize: function(maximum_tokens_per_row){
    var maximum_total_width = 480; // Could be 0.5 * popin_width
    var token_horizontal_margin = 5; /* Horizontal total margin should match _tokenVote.scss::.tokens-for-idea.token-icon */
    var maximum_token_size = 20 + token_horizontal_margin; // Including token_horizontal_margin. Was 60
    var minimum_token_size = 14 + token_horizontal_margin; // Including token_horizontal_margin
    
    var token_size = maximum_token_size;

    if ( maximum_tokens_per_row != 0 ){
      //maximum_tokens_per_row = maximum_tokens_per_row > 10 ? 10 : maximum_tokens_per_row;
      token_size = maximum_total_width / maximum_tokens_per_row;
    }
    if ( token_size < minimum_token_size ){
      token_size = minimum_token_size;
    }
    if ( token_size > maximum_token_size ){
      token_size = maximum_token_size;
    }
    return Math.floor(token_size - token_horizontal_margin);
  }
});

var TokenVoteSessionSubmittedModal = Backbone.Modal.extend({
  constructor: function TokenVoteSessionSubmittedModal(){
    Backbone.Modal.apply(this, arguments);
  },

  template: '#tmpl-modalWithoutIframe',
  className: 'modal-token-vote-session-submitted popin-wrapper',
  cancelEl: '.close, .js_close',

  onShow: function(){
    var that = this;
    var container = this.$el.find(".js_modal-body");
    container.empty();
    var text = $("<p></p>");
    text.text(i18n.gettext("Your vote has been saved successfully."));
    container.append(text);
    var btn = $("<a class='btn btn-sm btn-primary'></a>");
    btn.attr("href", Ctx.getDiscussionGenericURL());
    btn.text(i18n.gettext("Go back to the discussion"));
    container.append(btn);

    var btn2 = $("<a class='btn btn-sm btn-secondary'></a>");
    btn2.text(i18n.gettext("Modify my vote"));
    container.append(btn2);

    var editMyVote = function(){
      var modalView = new TokenVoteSessionModal({
        model: that.model
      });

      Ctx.setCurrentModalView(modalView);
      Assembl.slider.show(modalView);
    };
    btn2.click(editMyVote);
  },



  serializeData: function(){
    return {
      modal_title: i18n.gettext("Vote confirmation")
    }
  }

});

module.exports = {
  TokenVoteSessionModal: TokenVoteSessionModal,
  TokenVoteSessionResultModal: TokenVoteSessionResultModal
};
