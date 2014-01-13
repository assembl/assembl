define(['app', 'i18n', 'sprintf'], function(app, i18n, sprintf){
    /**
     * @class PostQuery
     *
     * Manages querying, filtering and sorting posts.  Abstracts out client and 
     * server side filtering (The client should re-call execute on the query
     * to sort or modify filters.  Any client-side processing to optimize should
     * be done inside this class, to ease unit testing and code clarity.
     */
    var PostQuery = function(){
        this.availableFilters = {
                POST_IS_IN_CONTEXT_OF_IDEA: {
                    id: 'idea',
                    name: i18n._('Idea'),
                    help_text:  i18n._('Only include messages related to the specified idea.  The filter is recursive:  Messages related to ideas that are descendents of the idea are included.'),
                    _value_is_boolean: false,
                    _can_be_reversed: false,
                    _server_param: 'root_idea_id',
                    _client_side_implementation: null
                },
                    
                POST_IS_DESCENDENT_OF_POST: {
                    id: 'post_thread',
                    name: i18n._('Post thread'),
                    help_text:  i18n._('Only include messages that are in the specified post reply thread.'),
                    _value_is_boolean: false,
                    _can_be_reversed: false,
                    _server_param: 'root_post_id',
                    _client_side_implementation: null
                },
                POST_IS_SYNTHESIS: {
                    id: 'only_synthesis_posts',
                    name: i18n._('Post is synthesis'),
                    help_text:  i18n._('Only include messages that publish a synthesis of a discussion.'),
                    _value_is_boolean: false,
                    _can_be_reversed: false,
                    _server_param: 'only_synthesis',
                    _client_side_implementation: null
                },
                POST_IS_UNREAD: {
                    id: 'is_unread_post',
                    name: i18n._('Post is unread'),
                    help_text:  i18n._('Only include unread messages.'),
                    _value_is_boolean: false,
                    _can_be_reversed: true,
                    _server_param: 'is_unread',
                    _client_side_implementation: null
                }
            };
        /**
         * Has a property with the name of the filterDef id for each active 
         * filter, containing then a list of objects with a propery "value"
         * for each value the filter filters.
         */
        this._query = {};
        
        /**
         * Information on the query result once executed, such as the number of 
         * read/unread posts found.
         */
        this._queryResultInfo = null;
        
        /**
         * A filter restriction on the collection.  Setting a filter value to 
         * null is equivalent to removing the filter
         * @param {String} ideaId
         * @return true on success, false on failure
         */
        this.addFilter = function(filterDef, value){
            var retval = true;
            
            if (value == null) {
                // null value is equivalent to clearing the filter
                // How about non-boolean filters?  Let's postpone that for now...
                // benoitg
                if(filterDef.id in this._query) {
                    delete this._query[filterDef.id];
                }
            }
            else {
                // Validate values
                if (filterDef._value_is_boolean) {
                    if (! (value === true || value === false) ) {
                        console.log("ERROR:  filter " + filterDef.name + " expects a boolean value and received value " + value);
                        return false;
                    }
                    if (filterDef._can_be_reversed === false && value === false) {
                        console.log("ERROR:  filter " + filterDef.name + " cannot be reversed, but reveived value " + value);
                        return false;
                    }
                }
                if(filterDef.id in this._query) {
                    if (filterDef._value_is_boolean) {
                        // Replace the entire filter
                        this._query[filterDef.id] = [{value: value}];
                    }
                    else {
                        var valueWasReplaced = false;
                        for (var i=0;i<this._query[filterDef.id].length;i++) {
                            if(this._query[filterDef.id][i].value == value) {
                                // Replace the value
                                /* Useless for now, but will allow changing the 
                                boolean operator later */
                                this._query[filterDef.id][i].value = value;
                                valueWasReplaced = true;
                            }
                            else {
                                //Append the new filter value
                                this._query[filterDef.id].push({value: value});
                            }
                        }
                    }
                }
                else {
                    // Append the new filter instance
                    this._query[filterDef.id] = [{value: value}];
                }
                
            }
            console.log("Filters after addfilter:")
            console.log(this._query);
            return retval;
        }
        /**
         * Remove a single filter from the query
         * @param {filterDef} filterDef
         */
        this.clearAllFilters = function(filterDef){
            this._query = {};
        }
        
        /**
         * Remove a single filter from the query
         * @param {filterDef} filterDef
         */
        this.clearFilter = function(){
            return this.addFilter(filterDef, null);
        }
        /**
         * Execute the query
         * @param {function} success callback to call when query is complete
         */
        this.execute = function(success){
            var that = this,
                url = app.getApiUrl('posts'),
                params = {},
                id = null,
                filterDef = null,
                value = null;
            
            for (var filterDefPropName in this.availableFilters) {
                filterDef = this.availableFilters[filterDefPropName]
                console.log(filterDef);
                if(filterDef.id in this._query) {
                    console.log("filter in query: " + filterDef.id);
                    for (var i=0;i<this._query[filterDef.id].length;i++) {
                        value = this._query[filterDef.id][i].value;
                        params[filterDef._server_param] = value;
                    }
                }
            }

            params.view = 'id_only';
            that._queryResultInfo = null;
            $.getJSON(url, params, function(data){
                that._queryResultInfo = {};
                that._queryResultInfo.unread = data.unread;
                that._queryResultInfo.total = data.total;
                that._queryResultInfo.startIndex = data.startIndex;
                that._queryResultInfo.page = data.page;
                that._queryResultInfo.maxPage = data.maxPage;
                
                var ids = [];
                _.each(data.posts, function(post){
                    ids.push(post['@id']);
                });
                success(ids);
            });
        };
        
        this.getResultNumUnread = function(){
            return this._queryResultInfo.unread;
        }
        
        this.getResultNumTotal = function(){
            return this._queryResultInfo.total;
        }
        /**
         * Return a HTML description of the results shown to the user
         * @param {String} ideaId
         */
        this.getHtmlDescription = function(){
            var retval = '',
            values = [];
            if(this._queryResultInfo == null) {
                retval += '<div id="post-query-results-info">';
                retval += i18n._("No query has been executed yet");
                retval += '</div>';
            }
            else{
                retval += '<div id="post-query-results-info">';
                retval += sprintf(i18n._("%d messages found (%d unread) that:"), this.getResultNumTotal(), this.getResultNumUnread());
                retval += '</div>';
                retval += '<ul id="post-query-filter-info">';
                for (var filterDefPropName in this.availableFilters) {
                    filterDef = this.availableFilters[filterDefPropName]
                    
                    if(filterDef.id in this._query) {
                        retval += '<li class="filter" id="'+filterDef.id+'">';
                        values = [];
                        for (var i=0;i<this._query[filterDef.id].length;i++) {
                            value = this._query[filterDef.id][i].value;
                            values.push(value);
                        }
                        retval += sprintf(i18n._("Filter %s for %s"), filterDef.name, values.join(', '));
                        retval += '</li>';
                    }
                }
                retval += '</ul>'
            }
            return retval;
        }
        
        /**
         * Query the posts.  Any param set to null has no effect
         * @param {String} ideaId
         */
        this._queryServer = function(ideaId, onlySynthesis, isUnread, success){
            var that = this,
                url = app.getApiUrl('posts'),
                params = {},
                id = null;
    
            params.root_idea_id = ideaId;
            
            if(onlySynthesis === true){
                params.only_synthesis = true;
            }
            
            if(isUnread === true){
                params.is_unread = true;
            } else if(isUnread === false) {
                params.is_unread = false;
            }
            params.view = 'id_only';
    
            $.getJSON(url, params, function(data){
                var ids = [];
    
                _.each(data.posts, function(post){
                    ids.push(post['@id']);
                });
                
                success(ids);
            });
        };

    };

    return PostQuery;

});
