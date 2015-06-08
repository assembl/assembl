'use strict';

var Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    CollectionManager = require('../common/collectionManager.js'),
    Promise = require('bluebird'),
    _ = require('../shims/underscore.js');

/**
* @class PostQuery
*
* Manages querying, filtering and sorting posts.  Abstracts out client and
* server side filtering (The client should re-call execute on the query
* to sort or modify filters.  Any client-side processing to optimize should
* be done inside this class, to ease unit testing and code clarity.
*/
var PostQuery = function () {
    var collectionManager = new CollectionManager();

    this.availableFilters = require('./postFilters.js');
    /**
     * Has a property with the id each active
     * filter, and the filter object as value
     */
    this._query = undefined;

    this._resultIds = [];

    this._resultsAreValid = false;

    this.availableViews = {
        THREADED: {
          id: 'threaded',
          name: i18n.gettext('Threaded view'),
          _supports_paging: false,
          _server_order_param_value: 'chronological',
          _client_side_implementation: null
        },

        CHRONOLOGICAL: {
          id: 'chronological',
          name: i18n.gettext('Oldest first'),
          _supports_paging: true,
          _server_order_param_value: 'chronological',
          _client_side_implementation: null
        },
        REVERSE_CHRONOLOGICAL: {
          id: 'reverse_chronological',
          name: i18n.gettext('Newest first'),
          _supports_paging: true,
          _server_order_param_value: 'reverse_chronological',
          _client_side_implementation: null
        }
    };

    /**
     * 
     */
    this._view = this.availableViews.REVERSE_CHRONOLOGICAL;

    /**
     * The server viewDef used to fulfill the data
     */
    this._viewDef = 'id_only';

    /**
     * Information on the query result once executed, such as the number of
     * read/unread posts found.
     */
    this._queryResultInfo = null;

    /**
     * get a filter definition by id
     * @param {filterDef.id}
     * @return {filterDef}
     */
    this.getFilterDefById = function (filterDefId) {
      for (var filterDefPropName in this.availableFilters) {
        var filterDef = this.availableFilters[filterDefPropName];
        var filterObject = new filterDef();
        if (filterObject.getId() == filterDefId) {
          return filterDef;
        }
      }
      throw new Error("getFilterDefById(): No filter definition with id " + filterDefId);
    }

    /**
     * Is the filter part of the current query?
     * @param {this.availableFilters} filterDef
     * @param {String} The value for which to check.  If null
     *  will return true if any filter of that type is present.
     * @return true if present, false otherwise
     */
    this.isFilterInQuery = function (filterDef, value) {
      var retval = false;
      var filterDef = new filterDef();
      //console.log("isFilterInQuery() called with:", filterDef.getId(), value, this._query)
      if(!this.isQueryValid()) {
        retval = false;
      }
      else if (filterDef.getId() in this._query) {
        if (value === null) {
          retval = true;
        }
        else {
          retval = this._query[filterDef.getId()].isValueInFilter(value);
        }
      }
      //console.log("isFilterInQuery() returning:",retval);
      return retval;
    }

    /**
     * A filter restriction on the collection.  Setting a filter value to
     * null is equivalent to removing the filter
     * @param {this.availableFilters} filterDef
     * @param {String} value
     * @return true on success, false on failure
     */
    this.addFilter = function (filterDef, value) {
      //console.log("addFilter called with: ", filterDef.name, value);
      var retval = true,
          valueWasReplaced = false,
          filter = null,
          candidate_filter = new filterDef(),
          filterId = candidate_filter.getId();

      if(this.isQueryValid() === false) {
        this.initialize();
      }
      if(this.isFilterInQuery(filterDef, value)) {
        if (value === null) {
          delete this._query[filterId];
          this.invalidateResults();
          retval = true;
        }
        else {
          retval = false;
        }
      }
      else if(this.isFilterInQuery(filterDef, null)) {
        //Query of that type is already present
        filter = this._query[filterId];
      }
      else {
        // Append the new filter instance
        filter = candidate_filter
        this._query[filterId] = filter;
      }
      
      if (filter) {
        retval = filter.addValue(value)
        if(retval) {
          this.invalidateResults();
        }
      }
      //console.log("this._query after adding filter:", this._query);
      return retval;
    };

    /**
     * Remove all filter from the query.  Effectively returns all messages
     * 
     * Same as initializing the query.  
     */
    this.clearAllFilters = function () {
      this.invalidateResults();
      this._query = {};
    };
    
    /**
     * Get a snapshot of the current filter config, that can be compared or 
     * restored later
     */
    this.getFilterConfigSnapshot = function () {
      return JSON.stringify(this._query);
    };
    
    /**
     * Compare the current state with a filter config snapshot
     */
    this.isFilterConfigSameAsSnapshot = function (snapshot) {
      var currentSnapshot = JSON.stringify(this._query);
      //console.log("isFilterConfigSameAsSnapshot comparing",currentSnapshot, snapshot);
      var retval = currentSnapshot === snapshot
      //console.log("isFilterConfigSameAsSnapshot returning",retval);
      return retval;
    };

    this.initialize = function () {
      return this.clearAllFilters();
    };
    
    /**
     * Has the query been properly initialized?
     */
    this.isQueryValid = function () {
      return this._query !== undefined;
    };

    /**
     * invalidate the Results
     */
    this.invalidateResults = function () {
      //console.log("messageListPostQuery:invalidateResults called");
      this._resultsAreValid = false;
    };

    /**
     * Remove a single filter from the query
     * @param {filterDef} filterDef
     * @param {valueIndex}  The index of the value to clear in the filter.  If null
     *  all values for that filter will be cleared.
     * @return true if filter(s) were cleared
     */
    this.clearFilter = function (filterDef, valueIndex) {
      var retval = false,
      i = 0,
      len,
      filterObject = new filterDef(),
      filterId = filterObject.getId();
     // console.log("clearFilter called with ",filterId, valueIndex)
      if(this.isQueryValid() === false) {
        this.initialize();
      }
      else if (filterId in this._query) {
        var filter = this._query[filterId],
            filterValues = filter.getValues();

        if (filter.deleteValueAtIndex(valueIndex)) {
          retval = true;
          this.invalidateResults();
        }

        if (valueIndex === null || _.size(filterValues) === 0) {
          //console.log("clearing empty filter");
          delete this._query[filterId];
          retval = true;
          this.invalidateResults();
        }
      }
      return retval;
    };

    /**
     * The order the posts are sorted for.
     * @param {viewDef} viewDef from this.availableViews
     * @return true on success, false on failure
     */
    this.setView = function (view) {
      var retval = false;
      if (view) {
        if (this._view._server_order_param_value !== view._server_order_param_value) {
          this._view = view;
          this.invalidateResults();
        }
        retval = true;
      }
      else {
        console.error(" setView() view is empty");
      }
      return retval;
    };

    /* The viewDef name used by the server to send data
     * @param {string} the name of a viewDef from assemal/view_defs
     * @return true on success, false on failure
     */
    this.setViewDef = function (viewDef) {
      var retval = false;
      if (viewDef) {
        if (this._viewDef !== viewDef) {
          this._viewDef = viewDef;
          this.invalidateResults();
        }
        retval = true;
      }
      else {
        console.error(" setViewDef() viewDef is empty");
      }
      return retval;
    };
    /**
     * Execute the query
     * @param {function} success callback to call when query is complete
     * @param {function} success_data_changed callback to call when query is complete only
     * when the data actually changed.  Will be called before success
     */
    this._execute = function () {
      //console.log("messageListPostQuery:execute() called");
      var that = this,
      url = Ctx.getApiUrl('posts'),
      params = {},
      id = null,
      value = null;

      if (this._query === undefined) {
        throw new Error("Query isn't initialized");
      }
      if (this._resultsAreValid) {
        return Promise.resolve(that._resultIds);

      } else {
        _.each(this._query, function(filter) {
          var values = filter.getValues();
          for (var i = 0; i < values.length; i++) {
            value = values[i];
            params[filter.getServerParam()] = value;
          }
        });

        params.order = this._view._server_order_param_value;
        params.view = this._viewDef;
        that._queryResultInfo = null;

        return Promise.resolve($.getJSON(url, params))
        .then(function(data){

          that._queryResultInfo = {};
          that._queryResultInfo.unread = data.unread;
          that._queryResultInfo.total = data.total;
          that._queryResultInfo.startIndex = data.startIndex;
          that._queryResultInfo.page = data.page;
          that._queryResultInfo.maxPage = data.maxPage;

          var ids = [];
          _.each(data.posts, function (post) {
            ids.push(post['@id']);
          });
          that._resultIds = ids;
          that._rawResults = data.posts;
          that._resultsAreValid = true;

          return that._resultIds;
        });
      }

    };

    /**
     * Returns a promise that will resolve to a list of id's
     */
    this.getResultMessageIdCollectionPromise = function () {
      if (this._resultsAreValid) {
        return Promise.resolve(this._resultIds);
      }

      return this._execute().then(function(collection){
        return Promise.resolve(collection);
      });
    };

    /**
     * A promise for an array for JSON data, one per post
     */
    this.getResultRawDataPromise = function () {
      var that = this;
      if (this._resultsAreValid) {
        return Promise.resolve(this._rawResults);
      }

      return this._execute().then(function(){
        return Promise.resolve(that._rawResults);
      });
    };


    /** @return undefined if query isn't complete */
    this.getResultNumUnread = function () {
      if (this._resultsAreValid) {
        return this._queryResultInfo.unread;
      }
      else {
        return undefined;
      }
    };

    /** @return undefined if query isn't complete */
    this.getResultNumTotal = function () {
      if (this._resultsAreValid) {
        return this._queryResultInfo.total;
      }
      else {
        return undefined;
      }
    };

    /**
     * Return a promise to a HTML description of a single active query filter
     */
    this._getHtmlFilterDescriptionPromise = function (filter) {
      var that = this,
      descriptionPromise,
      individualValuesButtonsPromises = [];
      _.each(filter.getValues(), function(value) {
        individualValuesButtonsPromises.push(filter.getFilterIndividualValueDescriptionStringPromise(value).then(
            function(individualValueString) {
              var retval = '';
              retval += '<span>' + individualValueString + '</span>';
              retval += '<a href="#" class="remove js_deleteFilter" data-filterid="' + filter.getId() + '" data-value-index="' + _.indexOf(filter.getValues(), value) + '"  ><i class="icon-delete"></i></a>\n';
              return retval;
            }));
      });
        
      descriptionPromise = filter.getFilterDescriptionStringPromise(individualValuesButtonsPromises);

      return descriptionPromise.then((function(description) {
        return '<li class="filter ui-tag">' + description + '</li>';
      }));
    }
    /**
     * Return a promise to a HTML description of the active query filters
     */
    this._getHtmlFiltersDescriptionPromise = function () {
      var that = this,
      nActiveFilters = 0,
      filterDescriptionPromises = [];

      _.each(this._query, function(filter) {
        filterDescriptionPromises.push(that._getHtmlFilterDescriptionPromise(filter));
      });
      
      return Promise.all(filterDescriptionPromises).then(function(filterDescriptions) {
        var retval = '';
        retval += '<ul class="post-query-filter-info pan">';
        retval += filterDescriptions.join('');
        retval += '</ul>';

        if (nActiveFilters > 0) {
          retval += '<div class="actions"><a class="js_messageList-allmessages btn btn-cancel btn-xs">' + i18n.gettext("Clear filters") + '</a></div>';
        }
        return retval;
      });

    };

    /**
     * Return a HTML description of the query results shown to the user
     */
    this.getHtmlDescriptionPromise = function () {
      var that = this;

      return this._getHtmlFiltersDescriptionPromise().then(function(filtersDescription) {
        var retval = '',
        individualValuesButtons = [],
        numActiveFilters = _.keys(that._query).length;

        if (that._queryResultInfo == null) {
          retval += '<span class="post-query-results-info">';
          retval += i18n.gettext("No query has been executed yet");
          retval += '</span>';
        }
        else if (that._resultsAreValid) {
          retval += '<span class="post-query-results-info">';
          if (that.getResultNumTotal() == 0) {
            if (numActiveFilters > 0) {
              retval += i18n.gettext("There is no message to display with those filters:");
            }
            else {
              retval += i18n.gettext("There are no messages in the discussion.");
            }
          }
          else {
            var unreadText = '';
            if (that.getResultNumUnread() > 0) {
              if (that.getResultNumUnread() == that.getResultNumTotal()) {
                if (that.getResultNumTotal() == 1) {
                  unreadText = i18n.gettext(" (unread)");
                } else {
                  unreadText = i18n.gettext(" (all unread)");
                }
              } else {
                unreadText = i18n.sprintf(
                    i18n.ngettext(" (%d unread)", " (%d unread)", that.getResultNumUnread()),
                    that.getResultNumUnread());
              }
            }
            if (numActiveFilters > 0) {
              retval += i18n.sprintf(i18n.ngettext("Found %d message%s that:", "Found %d messages%s that:", that.getResultNumTotal()), that.getResultNumTotal(), unreadText);
            }
            else {
              retval += i18n.sprintf(i18n.ngettext("Found %d message%s:", "Found %d messages%s:", that.getResultNumTotal()), that.getResultNumTotal(), unreadText);
            }
          }

          retval += '</span>';
          retval += filtersDescription;
        }
        else {
          throw new Error("Query has been executed but results are invalid")
        }
        return retval;
      });
    };

  };

module.exports = PostQuery;

