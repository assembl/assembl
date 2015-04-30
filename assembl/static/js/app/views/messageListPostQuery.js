'use strict';

define(['common/context', 'utils/i18n', 'common/collectionManager', 'bluebird'],
    function (Ctx, i18n, CollectionManager, Promise) {

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

            /* See _getHtmlFilterDescriptionPromise for more detailled example of those methods */
            //getFilterDescriptionStringPromise = function(filterDef, individualValuesButtonsPromises){
            //getFilterIndividualValueDescriptionStringPromise = function(filterDef, individualFilterValue) {
/*
                getFilterDescriptionStringPromise = function(filterDef, individualValuesButtonsPromises){
                  return Promise.all(individualValuesButtonsPromises).then(function(individualValuesButtons) {
                    var retval;
                    if(filterDef._value_is_boolean) {
                      retval = i18n.sprintf(i18n.gettext("%s"), individualValuesButtons.join(', '));
                    }
                    else {
                      retval = i18n.sprintf(i18n.ngettext("%s for value %s", "%s for values: %s", _.size(individualValuesButtons)), filterDef.name, individualValuesButtons.join(', '));
                    }
                    return retval;
                  });
                };

                getFilterIndividualValueDescriptionStringPromise = function(filterDef, individualFilterValue) {
                  var retval;
                  if (filterDef._value_is_boolean) {
                    var filterQuery = that._query[filterDef.id][0];
                    retval = i18n.sprintf((individualFilterValue === true) ? i18n.gettext("%s") : i18n.gettext("NOT %s"), filterDef.name);
                  }
                  else {
                    retval = individualFilterValue;
                  }
                  return Promise.resolve(retval)
                }
 */
            /* Useful for single values where the actual filter value doesn't need to be displayed at all */
            this._returnEmptyStringPromise = function (filterDef, individualFilterValue) {
              return Promise.resolve('');
            }
            
            this._getFilterIndividualValueDescriptionStringPromisePostInContextOfIdea = function(filterDef, individualFilterValue) {
              return collectionManager.getAllIdeasCollectionPromise().then(function(allIdeasCollection) {
                var idea = allIdeasCollection.get(individualFilterValue);
                if(!idea) {
                  throw new Error('Idea ' + individualFilterValue + ' not found');
                }
                return '"' + idea.get('shortTitle') + '"';
              })
            }
            this._getFilterDescriptionStringPromisePostInContextOfIdea = function (filterDef, individualValuesButtonsPromises) {
              return Promise.all(individualValuesButtonsPromises).then(function(individualValuesButtons) {
                return i18n.sprintf(i18n.ngettext("Discuss idea %s", "Discuss ideas: %s", individualValuesButtons.length), individualValuesButtons.join(i18n.gettext(' AND ')));
              });
            }
            
            this._getFilterIndividualValueDescriptionStringPromisePostIsDescendentOfPost = function(filterDef, individualFilterValue) {
              return collectionManager.getMessageFullModelPromise(individualFilterValue).then(function(post) {
                if(!post) {
                  throw new Error('Post ' + individualFilterValue + ' not found');
                }
                if (post.get('@type') === "SynthesisPost"){
                  return i18n.sprintf(i18n.gettext('synthesis "%s"'), post.get('subject'));
                }
                if(post.get('subject')) {
                  return i18n.sprintf(i18n.gettext('message "%s"'), post.get('subject'));
                }
              })
            }
            this._getFilterDescriptionStringPromisePostIsDescendentOfPost = function (filterDef, individualValuesButtonsPromises) {
              return Promise.all(individualValuesButtonsPromises).then(function(individualValuesButtons) {
                return i18n.sprintf(i18n.gettext("Are in the conversation that follows: %s"), individualValuesButtons.join(i18n.gettext(' AND ')));
              });
            }

            this._getFilterIndividualValueDescriptionStringPromisePostIsUnread = function(filterDef, individualFilterValue) {
              var retval;
              if (individualFilterValue === true) {
                retval = i18n.gettext("You haven't read yet");
              } else {
                retval = i18n.gettext("You've already read");
              }
              return Promise.resolve(retval);
            }
            this._getFilterDescriptionStringPromisePostIsUnread = function (filterDef, individualValuesButtonsPromises) {
              return Promise.all(individualValuesButtonsPromises).then(function(individualValuesButtons) {
                return i18n.sprintf("%s", individualValuesButtons.join(''));
              });
            }
            
            this.availableFilters = {
                POST_HAS_ID_IN: {
                    id: 'post_has_id_in',
                    name: i18n.gettext('Posts with specific ids'),
                    help_text: i18n.gettext('Only include posts that are in a range of specific ids'),
                    _value_is_boolean: false,
                    _can_be_reversed: true,
                    _server_param: 'ids',
                    _client_side_implementation: null
                },
                POST_IS_IN_CONTEXT_OF_IDEA: {
                    id: 'post_in_context_of_idea',
                    name: i18n.gettext('Related to idea'),
                    help_text: i18n.gettext('Only include messages related to the specified idea.  The filter is recursive:  Messages related to ideas that are descendents of the idea are included.'),
                    _value_is_boolean: false,
                    _can_be_reversed: false,
                    _server_param: 'root_idea_id',
                    _client_side_implementation: null,
                    _getFilterDescriptionStringPromise: this._getFilterDescriptionStringPromisePostInContextOfIdea,
                    _getFilterIndividualValueDescriptionStringPromise: this._getFilterIndividualValueDescriptionStringPromisePostInContextOfIdea
                    
                },

                POST_IS_DESCENDENT_OF_POST: {
                    id: 'post_thread',
                    name: i18n.gettext('Part of thread of'),
                    help_text: i18n.gettext('Only include messages that are in the specified post reply thread.'),
                    _value_is_boolean: false,
                    _can_be_reversed: false,
                    _server_param: 'root_post_id',
                    _client_side_implementation: null,
                    _getFilterDescriptionStringPromise: this._getFilterDescriptionStringPromisePostIsDescendentOfPost,
                    _getFilterIndividualValueDescriptionStringPromise: this._getFilterIndividualValueDescriptionStringPromisePostIsDescendentOfPost
                },
                POST_IS_ORPHAN: {
                    id: 'only_orphan_posts',
                    name: i18n.gettext('Are orphan (not relevent to any idea so far)'),
                    help_text: i18n.gettext('Only include messages that are not found in any idea.'),
                    _value_is_boolean: true,
                    _can_be_reversed: false,
                    _server_param: 'only_orphan',
                    _client_side_implementation: null
                },
                POST_IS_SYNTHESIS: {
                    id: 'only_synthesis_posts',
                    name: i18n.gettext('Are a synthesis'),
                    help_text: i18n.gettext('Only include messages that represent a synthesis of the discussion.'),
                    _value_is_boolean: true,
                    _can_be_reversed: false,
                    _server_param: 'only_synthesis',
                    _client_side_implementation: null
                },
                POST_IS_UNREAD: {
                    id: 'is_unread_post',
                    name: i18n.gettext('Are not read yet'),
                    help_text: i18n.gettext('Only include unread messages.'),
                    _value_is_boolean: false,
                    _can_be_reversed: true,
                    _server_param: 'is_unread',
                    _client_side_implementation: null,
                    _getFilterDescriptionStringPromise: this._getFilterDescriptionStringPromisePostIsUnread,
                    _getFilterIndividualValueDescriptionStringPromise: this._getFilterIndividualValueDescriptionStringPromisePostIsUnread
                },
                POST_IS_POSTED_SINCE_LAST_SYNTHESIS: {
                  id: 'is_posted_since_last_synthesis',
                  name: i18n.gettext('Are posted since last synthesis'),
                  help_text: i18n.gettext('Only include posts created after the last synthesis.'),
                  _value_is_boolean: false,
                  _can_be_reversed: false,
                  _server_param: 'posted_after_date',
                  _client_side_implementation: null,
                  _filter_description: this._returnHtmlDescriptionPostedSinceLastSynthesis
                }
            };
            /**
             * Has a property with the name of the filterDef id for each active
             * filter, containing then a list of objects with a propery "value"
             * for each value the filter filters.
             */
            this._query = {};

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
             * Has a property with the name of the filterDef id for each active
             * filter, containing then a list of objects with a propery "value"
             * for each value the filter filters.
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
             * get a filter defintion by id
             * @param {filterDef.id}
             * @return {filterDef}
             */
            this.getFilterDefById = function (filterDefId) {
                for (var filterDefPropName in this.availableFilters) {
                    var filterDef = this.availableFilters[filterDefPropName];
                    if (filterDef.id == filterDefId) {
                        return filterDef;
                    }
                }
                console.error("getFilterDefById(): No filter definition with id " + filterDefId);
                return null;
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
                //console.log("isFilterInQuery():",filterDef, value, this._query)
                if (filterDef.id in this._query) {
                    if (value == null) {
                        retval = true;
                    }
                    else {
                        for (var i = 0; i < this._query[filterDef.id].length; i++) {
                            if (this._query[filterDef.id][i].value == value) {
                                retval = true;
                            }
                        }
                    }
                }
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
                this.invalidateResults();
                var retval = true,
                    valueWasReplaced = false;

                // Validate values
                if (filterDef._value_is_boolean) {
                    if (!(value === true || value === false)) {
                        console.error(" filter " + filterDef.name + " expects a boolean value and received value " + value);
                        return false;
                    }
                    if (filterDef._can_be_reversed === false && value === false) {
                        console.error(" filter " + filterDef.name + " cannot be reversed, but received value " + value);
                        return false;
                    }
                }

                if (filterDef.id in this._query) {

                    for (var i = 0; i < this._query[filterDef.id].length; i++) {
                        if (this._query[filterDef.id][i].value == value) {
                            // Replace the value
                            /* Useless for now, but will allow changing the
                             boolean operator later */
                            this._query[filterDef.id][i].value = value;
                            valueWasReplaced = true;
                        }
                    }
                    if (valueWasReplaced == false && value != null) {
                        //Append the new filter value
                        this._query[filterDef.id].push({value: value});
                    }
                }
                else {
                    if (value != null) {
                        // Append the new filter instance
                        this._query[filterDef.id] = [
                            {value: value}
                        ];
                    }
                }

                return retval;
            };

            /**
             * Remove all filter from the query
             * @param {filterDef} filterDef
             */
            this.clearAllFilters = function (filterDef) {
                this.invalidateResults();
                this._query = {};
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
             * @param {value}  The value for which to clear the filter.  If null
             *  all values for that filter will be cleared.
             * @return true if filter(s) were cleared
             */
            this.clearFilter = function (filterDef, value) {
                var retval = false,
                    i = 0,
                    len;
                this.invalidateResults();
                if (filterDef.id in this._query) {
                    len = this._query[filterDef.id].length;
                    for (; i < len; i++) {
                        if (value === null || this._query[filterDef.id][i].value.toString() == value.toString()) {
                            this._query[filterDef.id].splice(i, 1);
                            retval = true;
                        }
                    }
                    len = this._query[filterDef.id].length;
                    if (len === 0) {
                        delete this._query[filterDef.id];
                    }
                }
                return retval;
            };

            /**
             * Check if a filter is present in the query
             * @param {filterDef} filterDef
             * @param {value}  The value for which to clear the filter.  If null
             *  any value for that filter will be considered.
             * @return true if filter is present in the query
             */
            this.isFilterActive = function (filterDef, value) {
                if (filterDef.id in this._query) {
                    for (var i = 0; i < this._query[filterDef.id].length; i++) {
                        if (value == null || this._query[filterDef.id][i].value.toString() == value.toString()) {
                            return true;
                        }
                    }
                }
                return false;
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
                    filterDef = null,
                    value = null;

                if (this._resultsAreValid) {
                    return Promise.resolve(that._resultIds);

                } else {
                    for (var filterDefPropName in this.availableFilters) {
                        filterDef = this.availableFilters[filterDefPropName];
                        if (filterDef.id in this._query) {
                            for (var i = 0; i < this._query[filterDef.id].length; i++) {
                                value = this._query[filterDef.id][i].value;
                                params[filterDef._server_param] = value;
                            }
                        }
                    }

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
            this._getHtmlFilterDescriptionPromise = function (filterDef) {
              var that = this,
                  descriptionPromise,
                  getFilterIndividualValueDescriptionStringPromise,
                  getFilterDescriptionStringPromise,
                  individualValuesButtonsPromises = [];
              

              if (filterDef._getFilterDescriptionStringPromise) {
                getFilterDescriptionStringPromise = filterDef._getFilterDescriptionStringPromise;
              }
              else {
                getFilterDescriptionStringPromise = function(filterDef, individualValuesButtonsPromises){
                  return Promise.all(individualValuesButtonsPromises).then(function(individualValuesButtons) {
                    var retval;
                    if(filterDef._value_is_boolean) {
                      retval = i18n.sprintf(i18n.gettext("%s"), individualValuesButtons.join(', '));
                    }
                    else {
                      retval = i18n.sprintf(i18n.ngettext("%s (%s)", "%s (%s)", _.size(individualValuesButtons)), filterDef.name, individualValuesButtons.join(', '));
                    }
                    return retval;
                  });
                 
                };
              }
              if (filterDef._getFilterIndividualValueDescriptionStringPromise) {
                getFilterIndividualValueDescriptionStringPromise = filterDef._getFilterIndividualValueDescriptionStringPromise;
              }
              else {
                getFilterIndividualValueDescriptionStringPromise = function(filterDef, individualFilterValue) {
                  var retval;
                  if (filterDef._value_is_boolean) {
                    var filterQuery = that._query[filterDef.id][0];
                    retval = i18n.sprintf((individualFilterValue === true) ? i18n.gettext("%s") : i18n.gettext("NOT %s"), filterDef.name);
                  }
                  else {
                    retval = individualFilterValue;
                  }
                  return Promise.resolve(retval)
                }
              }

              for (var i = 0; i < that._query[filterDef.id].length; i++) {
                var value = that._query[filterDef.id][i].value;

                individualValuesButtonsPromises.push(getFilterIndividualValueDescriptionStringPromise(filterDef, value).then(
                    function(individualValueString) {
                      return '<span>' + individualValueString + '</span><a href="#" class="remove js_deleteFilter" data-filterid="' + filterDef.id + '" data-value="' + value + '"><i class="icon-delete"></i></a>\n';
                    }));
              }
              descriptionPromise = getFilterDescriptionStringPromise(filterDef, individualValuesButtonsPromises);

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

              for (var filterDefPropName in that.availableFilters) {
                var filterDef = that.availableFilters[filterDefPropName];

                if (filterDef.id in that._query) {
                  ++nActiveFilters;
                  filterDescriptionPromises.push(this._getHtmlFilterDescriptionPromise(filterDef));
                }
              }
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

        return PostQuery;

    });
