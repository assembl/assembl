define(function (require) {

    var Ctx = require('modules/context'),
        i18n = require('utils/i18n'),
        CollectionManager = require('modules/collectionManager');

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
        this._returnHtmlDescriptionPostInContextOfIdea = function (filterDef, queryObjects) {
            var retval = '',
                idea = null,
                valuesText = [];
            for (var i = 0; i < queryObjects.length; i++) {
                var value = queryObjects[i].value,
                //Yes, this is cheating - benoitg 2014-07-23
                    idea = collectionManager._allIdeasCollection.get(value),
                    span = '<a href="#" class="remove js_deleteFilter" data-filterid="' + filterDef.id + '" data-value="' + value + '"><i class="icon-delete"></i></a>\n';
                valuesText.push('"' + idea.get('shortTitle') + '"' + span);
            }
            retval += i18n.sprintf(i18n.ngettext("Discuss idea %s", "Discuss ideas: %s", valuesText.length), valuesText.join(i18n.gettext(' AND ')));
            return retval;
        }
        this._returnHtmlDescriptionPostIsDescendentOfPost = function (filterDef, queryObjects) {
            var retval = '',
                post = null,
                valuesText = [];
            for (var i = 0; i < queryObjects.length; i++) {
                var value = queryObjects[i].value,
                    post = collectionManager._allMessageStructureCollection.get(value),
                    span = '<a href="#" class="remove js_deleteFilter" data-filterid="' + filterDef.id + '" data-value="' + value + '"><i class="icon-delete"></i></a>\n';
                if (post == undefined) {
                    // TODO
                    console.log("BUG: could not find post", value);
                } else {
                    valuesText.push('"' + post.get('subject') + '"' + span);
                }
            }
            retval += i18n.sprintf(i18n.ngettext("Are in the conversation that follows post %s",
                    "Are in the conversation that follows posts: %s",
                    valuesText.length),
                valuesText.join(i18n.gettext(' AND ')));
            return retval;
        }
        this._returnHtmlDescriptionPostIsUnread = function (filterDef, queryObjects) {
            var retval = '';
            if (queryObjects && queryObjects.length > 0) {
                var value = true;
                if (queryObjects[0].hasOwnProperty("value"))
                    value = queryObjects[0].value;
                var retval = '',
                    closeBtn = '<a href="#" class="remove js_deleteFilter" data-filterid="' + filterDef.id + '" data-value="' + value + '"><i class="icon-delete"></i></a>\n';

                if (value === true) {
                    retval += i18n.sprintf(i18n.gettext("%s %s"), "You haven't read yet", closeBtn);
                } else {
                    retval += i18n.gettext("You've already read");
                }
            }

            return retval;
        }
        this._returnHtmlDescriptionSynthesis = function (filterDef, queryObjects) {
            var retval = '',
                valuesText = [];
            value = queryObjects[0].value,
                span = '<a href="#" class="remove js_deleteFilter" data-filterid="' + filterDef.id + '" data-value=' + value + '><i class="icon-delete"></i></a>\n';
            valuesText.push(span);

            retval += i18n.sprintf(i18n.gettext("%s %s"), filterDef.name, valuesText.join(', '));

            return retval;
        }
        this.availableFilters = {
            POST_IS_IN_CONTEXT_OF_IDEA: {
                id: 'post_in_context_of_idea',
                name: i18n.gettext('Idea'),
                help_text: i18n.gettext('Only include messages related to the specified idea.  The filter is recursive:  Messages related to ideas that are descendents of the idea are included.'),
                _value_is_boolean: false,
                _can_be_reversed: false,
                _server_param: 'root_idea_id',
                _client_side_implementation: null,
                _filter_description: this._returnHtmlDescriptionPostInContextOfIdea
            },

            POST_IS_DESCENDENT_OF_POST: {
                id: 'post_thread',
                name: i18n.gettext('Post thread'),
                help_text: i18n.gettext('Only include messages that are in the specified post reply thread.'),
                _value_is_boolean: false,
                _can_be_reversed: false,
                _server_param: 'root_post_id',
                _client_side_implementation: null,
                _filter_description: this._returnHtmlDescriptionPostIsDescendentOfPost
            },
            POST_IS_ORPHAN: {
                id: 'only_orphan_posts',
                name: i18n.gettext('Are orphan (not relevent to any idea so far)'),
                help_text: i18n.gettext('Only include messages that are not found in any idea.'),
                _value_is_boolean: true,
                _can_be_reversed: false,
                _server_param: 'only_orphan',
                _client_side_implementation: null,
                _filter_description: null
            },
            POST_IS_SYNTHESIS: {
                id: 'only_synthesis_posts',
                name: i18n.gettext('Publish a synthesis of the discussion'),
                help_text: i18n.gettext('Only include messages that publish a synthesis of a discussion.'),
                _value_is_boolean: true,
                _can_be_reversed: false,
                _server_param: 'only_synthesis',
                _client_side_implementation: null,
                _filter_description: this._returnHtmlDescriptionSynthesis
            },
            POST_IS_UNREAD: {
                id: 'is_unread_post',
                name: i18n.gettext('not read yet'),
                help_text: i18n.gettext('Only include unread messages.'),
                _value_is_boolean: false,
                _can_be_reversed: true,
                _server_param: 'is_unread',
                _client_side_implementation: null,
                _filter_description: this._returnHtmlDescriptionPostIsUnread
            }
        };
        /**
         * Has a property with the name of the filterDef id for each active
         * filter, containing then a list of objects with a propery "value"
         * for each value the filter filters.
         */
        this._query = {};

        this._results = [];

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
                name: i18n.gettext('Chronological'),
                _supports_paging: true,
                _server_order_param_value: 'chronological',
                _client_side_implementation: null
            },
            REVERSE_CHRONOLOGICAL: {
                id: 'reverse_chronological',
                name: i18n.gettext('Activity feed (reverse chronological)'),
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
                filterDef = this.availableFilters[filterDefPropName]
                if (filterDef.id == filterDefId) {
                    return filterDef;
                }
            }
            console.log("ERROR: getFilterDefById(): No filter definition with id " + filterDefId);
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
            retval = false;
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
                    console.log("ERROR:  filter " + filterDef.name + " expects a boolean value and received value " + value);
                    return false;
                }
                if (filterDef._can_be_reversed === false && value === false) {
                    console.log("ERROR:  filter " + filterDef.name + " cannot be reversed, but received value " + value);
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
         * @param {viewDef} viewDef
         * @return true on success, false on failure
         */
        this.setView = function (viewDef) {
            var retval = false;
            if (viewDef) {
                if (this._view._server_order_param_value !== viewDef._server_order_param_value) {
                    this._view = viewDef;
                    this.invalidateResults();
                }
                retval = true;
            }
            else {
                console.log("ERROR:  setView() viewDef is empty");
            }
            return retval;
        };

        /**
         * Execute the query
         * @param {function} success callback to call when query is complete
         * @param {function} success_data_changed callback to call when query is complete only
         * when the data actually changed.  Will be called before success
         */
        this._execute = function (success, success_data_changed) {
            //console.log("messageListPostQuery:execute() called");
            var that = this,
                url = Ctx.getApiUrl('posts'),
                params = {},
                id = null,
                filterDef = null,
                value = null;

            if (this._resultsAreValid) {
                if (_.isFunction(success)) {
                    success(that._results);
                }
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
                params.view = 'id_only';
                that._queryResultInfo = null;
                $.getJSON(url, params, function (data) {
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
                    that._results = ids;
                    that._resultsAreValid = true;

                    if (_.isFunction(success_data_changed)) {
                        success_data_changed(that._results);
                    }
                    if (_.isFunction(success)) {
                        success(that._results);
                    }
                });
            }

        };
        this.getResultMessageIdCollectionPromise = function () {
            var that = this,
                deferred = $.Deferred();
            //console.log("messageListPostQuery:getResultMessageIdCollectionPromise() called");
            if (this._resultsAreValid) {
                deferred.resolve(this._results);
            }
            else {
                this._execute(function (collection) {
                    //console.log('resolving getResultMessageIdCollectionPromise()');
                    deferred.resolve(collection);
                });
            }
            ;

            // Returning a Promise so that only this function can modify
            // the Deferred object
            return deferred.promise();
        };

        /** @return undefined if query isn't complete */
        this.getResultNumUnread = function () {
          if(this._resultsAreValid) {
            return this._queryResultInfo.unread;
          }
          else {
            return undefined;
          }
        };

        /** @return undefined if query isn't complete */
        this.getResultNumTotal = function () {
          if(this._resultsAreValid) {
            return this._queryResultInfo.total;
            }
          else {
            return undefined;
          }
        };

        /**
         * Return a HTML description of the results shown to the user
         * @param {String} ideaId
         */
        this.getHtmlDescription = function () {
            var retval = '',
                valuesText = [],
                numActiveFilters = _.keys(this._query).length;
            if (this._queryResultInfo == null) {
                retval += '<div class="post-query-results-info">';
                retval += i18n.gettext("No query has been executed yet");
                retval += '</div>';
            }
            else if(this._resultsAreValid) {
                retval += '<div class="post-query-results-info">';
                if (this.getResultNumTotal() == 0) {
                    if (numActiveFilters > 0) {
                        retval += i18n.gettext("Found no message in the discussion that:");
                    }
                    else {
                        retval += i18n.gettext("There are no messages in the discussion.");
                    }
                }
                else {
                    var unreadText = '';
                    if (this.getResultNumUnread() > 0) {
                        unreadText = i18n.sprintf(i18n.gettext("(%d unread)"), this.getResultNumUnread());
                    }
                    if (numActiveFilters > 0) {
                        retval += i18n.sprintf(i18n.gettext("Found %d messages %s that:"), this.getResultNumTotal(), unreadText);
                    }
                    else {
                        retval += i18n.sprintf(i18n.gettext("Found %d messages %s:"), this.getResultNumTotal(), unreadText);
                    }
                }

                retval += '</div>';
                retval += '<ul class="post-query-filter-info mll pan">';

                var nActiveFilters = 0;
                for (var filterDefPropName in this.availableFilters) {
                    var filterDef = this.availableFilters[filterDefPropName];

                    if (filterDef.id in this._query) {
                        ++nActiveFilters;
                        retval += '<li class="filter ui-tag">';
                        if (filterDef._filter_description) {
                            retval += filterDef._filter_description(filterDef, this._query[filterDef.id]);
                        }
                        else {
                            if (filterDef._value_is_boolean) {
                                var filterQuery = this._query[filterDef.id][0];
                                var span = '<a href="#" class="remove js_deleteFilter" data-filterid="' + filterDef.id + '" data-value="' + filterQuery.value + '"><i class="icon-delete"></i></a>\n';
                                retval += i18n.sprintf((filterQuery.value === true) ? i18n.gettext("%s") : i18n.gettext("NOT %s"), filterDef.name);
                                retval += span;
                            }

                            else {
                                for (var i = 0; i < this._query[filterDef.id].length; i++) {
                                    var value = this._query[filterDef.id][i].value;
                                    var span = '<a href="#" class="remove js_deleteFilter" data-filterid="' + filterDef.id + '" data-value="' + value + '"><i class="icon-delete"></i></span>\n';
                                    valuesText.push(value + span);
                                }
                                retval += i18n.sprintf(i18n.gettext("%s for values %s"), filterDef.name, valuesText.join(', '));
                            }
                        }
                        retval += '</li>';
                    }
                }
                retval += '</ul>';

                if (nActiveFilters > 0) {
                    retval += '<div class="actions"><a class="js_messageList-allmessages button">' + i18n.gettext("Clear filters") + '</a></div>';
                }
            }
            return retval;
        };

    };

    return PostQuery;

});
