'use strict';

define(['common/context', 'utils/i18n', 'common/collectionManager', 'bluebird'],
function (Ctx, i18n, CollectionManager, Promise) {
  var collectionManager = new CollectionManager();
  
  /** Base interface of all filters */
  function AbstractFilter(){
    this._values = [];
  }
  AbstractFilter.prototype = {
    /**
     * @return true if a value was actually added to the filter, false otherwise
     * (tried to add a duplicate value)
     */
    addValue: function(value) {
      if(!this.isValueInFilter(value)) {
        var index = _.sortedIndex(this._values, value);
        this._values.splice(index, 0, value)
        return true
      }
      else {
        return false;
      }
    },
    
    /**
     * @return true if a value was actually deleted from the filter, false otherwise
     * (tried to add a duplicate value)
     */
    deleteValue: function(value) {
      //console.log("deleteValue called with",value, "on values", this._values);
      var indexOfValue = _.indexOf(this._values, value, true);
      console.log(indexOfValue);
      
      if(indexOfValue !== -1) {
        this._values.splice(indexOfValue, 1);
        //console.log("deleteValue cleared something, values is now", this._values);
        return true
      }
      else {
        return false;
      }
    },
    
    /**
     * @return true if a value was actually deleted from the filter, false otherwise
     * (tried to add a duplicate value)
     */
    deleteValueAtIndex: function(valueIndex) {
      //console.log("deleteValueAtIndex called with",valueIndex, "on values", this._values);
      
      if(valueIndex !== -1 && valueIndex !== null) {
        this._values.splice(valueIndex, 1)
        //console.log("deleteValueAtIndex cleared something, values is now", this._values);
        return true
      }
      else {
        return false;
      }
    },
    
    getValues: function() {
      return this._values;
    },
    
    isValueInFilter: function(value) {
      //console.log("isValueInFilter called with", value, ", ", this._values,"returning", _.contains(this._values, value));
      return _.contains(this._values, value);
    },
    
    /** Used for CSS ids, and finding filters in queries */
    getId: function() {
      throw new Error("Need to implement getId");
    },
    
    getName: function() {
      throw new Error("Need to implement getName");
    },
    
    /** This is the text used for hover help 
     * @return The help text, or null if none is available */
    getHelpText: function() {
      return null;
    },
    
    /** Get the name of the GET parameter on the server to put the value in 
     * @return string */
    getServerParam: function() {
      throw new Error("Need to implement getServerParam");
    },
    
    getFilterIndividualValueDescriptionStringPromise: function(individualFilterValue) {
      var retval;
      retval = individualFilterValue;
      return Promise.resolve(individualFilterValue)
    },
    
    getFilterDescriptionStringPromise: function(individualValuesButtonsPromises){
      var that = this;
      return Promise.all(individualValuesButtonsPromises).then(function(individualValuesButtons) {
        return i18n.sprintf(i18n.ngettext("%s (%s)", "%s (%s)", _.size(individualValuesButtons)), that.getName(), individualValuesButtons.join(', '));
      });
    },
    
    /** Get a client side implementation of the filter, if it has one.
     * A client side implementation allows filtering on the client side if it's
     * faster */
    getClientSideImplementation: function() {
      throw new Error("RESERVED FOR FUTURE USE");
    }
  }

  
  /** For filters who can only have a single value */
  function AbstractFilterSingleValue() {
    AbstractFilter.call(this);
  }
  
  AbstractFilterSingleValue.prototype = Object.create(AbstractFilter.prototype)
  _.extend(AbstractFilterSingleValue.prototype, {
    /** For filters who can only have a single, implicit value
     * Typically displayed in the filters menu */
    getImplicitValue: function() {
      return undefined;
    },
    
    addValue: function(value) {
      if(!this.isValueInFilter(value)) {
        if(_.size(this._values) !== 0) {
          throw new Error("Filter can only have a single value, and we were provided" + _.size(values));
        }
      }
      return AbstractFilter.prototype.addValue.call(this, value);
    },
    

  });
  
  /** For filters who can only have a single, true or false */
  function AbstractFilterBooleanValue() {
    AbstractFilterSingleValue.call(this);
  }
  
  AbstractFilterBooleanValue.prototype = Object.create(AbstractFilterSingleValue.prototype);
  _.extend(AbstractFilterBooleanValue.prototype, {
    addValue: function(value) {
      //console.log("AbstractFilterBooleanValue::addValue called with", value)
      if(!this.isValueInFilter(value)) {
        if (!(value === true || value === false)) {
          throw new Error("Filter expects a boolean value, and we were provided with: " + values[0]);
        }
      }
      return AbstractFilterSingleValue.prototype.addValue.call(this, value);
    },

    getFilterIndividualValueDescriptionStringPromise: function(individualFilterValue) {
      var retval;
      retval = i18n.sprintf((individualFilterValue === true) ? i18n.gettext("%s") : i18n.gettext("NOT %s"), this.getName());
      return Promise.resolve(retval)
    }
  });
  
  function FilterPostHasIdIn() {
    AbstractFilter.call(this);
  }
  FilterPostHasIdIn.prototype = Object.create(AbstractFilter.prototype);
  _.extend(FilterPostHasIdIn.prototype, {
    getId: function() {
      return 'post_has_id_in';
    },
    getServerParam: function() {
      return 'ids';
    },
    getName: function() {
      return i18n.gettext('Posts with specific ids');
    },
    
    getHelpText: function() {
      return i18n.gettext('Only include posts that are in a range of specific ids');
    }
  });

  
  function FilterPostIsInContextOfIdea() {
    AbstractFilterSingleValue.call(this);
  }
  FilterPostIsInContextOfIdea.prototype = Object.create(AbstractFilterSingleValue.prototype);
  _.extend(FilterPostIsInContextOfIdea.prototype, {
    getId: function() {
      return 'post_in_context_of_idea';
    },
    getServerParam: function() {
      return 'root_idea_id';
    },
    getName: function() {
      return i18n.gettext('Related to idea');
    },
    getHelpText: function() {
      return i18n.gettext('Only include messages related to the specified idea.  The filter is recursive:  Messages related to ideas that are descendents of the idea are included.');
    },
    
    getFilterIndividualValueDescriptionStringPromise: function(individualFilterValue) {
      return collectionManager.getAllIdeasCollectionPromise().then(function(allIdeasCollection) {
        var idea = allIdeasCollection.get(individualFilterValue);
        if(!idea) {
          throw new Error('Idea ' + individualFilterValue + ' not found');
        }
        return '"' + idea.get('shortTitle') + '"';
      })
    },
    getFilterDescriptionStringPromise: function (individualValuesButtonsPromises) {
      return Promise.all(individualValuesButtonsPromises).then(function(individualValuesButtons) {
        return i18n.sprintf(i18n.ngettext("Discuss idea %s", "Discuss ideas: %s", individualValuesButtons.length), individualValuesButtons.join(i18n.gettext(' AND ')));
      });
    }
  });
  
  function FilterPostIsDescendentOfPost() {
    AbstractFilterSingleValue.call(this);
  }
  FilterPostIsDescendentOfPost.prototype = Object.create(AbstractFilterSingleValue.prototype);
  _.extend(FilterPostIsDescendentOfPost.prototype, {
    getId: function() {
      return 'post_thread';
    },
    getServerParam: function() {
      return 'root_post_id';
    },
    getName: function() {
      return i18n.gettext('Part of thread of');
    },
    getHelpText: function() {
      return i18n.gettext('Only include messages that are in the specified post reply thread.');
    },
    getFilterIndividualValueDescriptionStringPromise: function(individualFilterValue) {
      return collectionManager.getMessageFullModelPromise(individualFilterValue).then(function(post) {
        if(!post) {
          throw new Error('Post ' + individualFilterValue + ' not found');
        }
        if (post.get('@type') === "SynthesisPost"){
          return i18n.sprintf(i18n.gettext('synthesis "%s"'), post.get('subject'));
        }
        else {
          return i18n.sprintf(i18n.gettext('message "%s"'), post.get('subject'));
        }
      })
    },
    getFilterDescriptionStringPromise: function (individualValuesButtonsPromises) {
      return Promise.all(individualValuesButtonsPromises).then(function(individualValuesButtons) {
        return i18n.sprintf(i18n.gettext("Are in the conversation that follows: %s"), individualValuesButtons.join(i18n.gettext(' AND ')));
      });
    }
  });

  function FilterPostIsFromUser() {
    AbstractFilterSingleValue.call(this);
  }
  FilterPostIsFromUser.prototype = Object.create(AbstractFilterSingleValue.prototype);
  _.extend(FilterPostIsFromUser.prototype, {
    getId: function() {
      return 'post_is_from';
    },
    getServerParam: function() {
      return 'post_author';
    },
    getName: function() {
      return i18n.gettext('Posted by');
    },
    getHelpText: function() {
      return i18n.gettext('Only include messages that are posted by a specific user.');
    },
    getFilterIndividualValueDescriptionStringPromise: function(individualFilterValue) {
      return collectionManager.getAllUsersCollectionPromise(individualFilterValue).then(function(users) {
        var user = users.get(individualFilterValue);
        if(!user) {
          throw new Error('User ' + individualFilterValue + ' not found');
        }
        return i18n.sprintf(i18n.gettext('"%s"'), user.get('name'));
      })
    },
    getFilterDescriptionStringPromise: function (individualValuesButtonsPromises) {
      return Promise.all(individualValuesButtonsPromises).then(function(individualValuesButtons) {
        return i18n.sprintf(i18n.gettext("Are posted by: %s"), individualValuesButtons.join(i18n.gettext(' AND ')));
      });
    }
  });

  function FilterPostIsOrphan() {
    AbstractFilterBooleanValue.call(this);
  }
  FilterPostIsOrphan.prototype = Object.create(AbstractFilterBooleanValue.prototype);
  _.extend(FilterPostIsOrphan.prototype, {
    getId: function() {
      return 'only_orphan_posts';
    },
    getImplicitValue: function() {
      return "true";
    },
    getServerParam: function() {
      return 'only_orphan';
    },
    getName: function() {
      return i18n.gettext('Are orphan (not relevent to any idea so far)');
    },
    getHelpText: function() {
      return i18n.gettext('Only include messages that are not found in any idea.');
    }
  });
  
  function FilterPostIsSynthesis() {
    AbstractFilterBooleanValue.call(this);
  }
  FilterPostIsSynthesis.prototype = Object.create(AbstractFilterBooleanValue.prototype);
  _.extend(FilterPostIsSynthesis.prototype, {
    getId: function() {
      return 'only_synthesis_posts';
    },
    getImplicitValue: function() {
      return "true";
    },
    getServerParam: function() {
      return 'only_synthesis';
    },
    getName: function() {
      return i18n.gettext('Are a synthesis');
    },
    getHelpText: function() {
      return i18n.gettext('Only include messages that represent a synthesis of the discussion.');
    }
  });
  
  function FilterPostHasUnread() {
    AbstractFilterBooleanValue.call(this);
  }
  FilterPostHasUnread.prototype = Object.create(AbstractFilterBooleanValue.prototype);
  _.extend(FilterPostHasUnread.prototype, {
    getId: function() {
      return 'post_has_unread';
    },
    getServerParam: function() {
      return 'is_unread';
    },
    getName: function() {
      return i18n.gettext('Have unread value');
    },

    getFilterIndividualValueDescriptionStringPromise: function(individualFilterValue) {
      var retval;
      if (individualFilterValue === true) {
        retval = i18n.gettext("You haven't read yet");
      } else if (individualFilterValue === false) {
        retval = i18n.gettext("You've already read");
      }
      else {
        throw new Error("Value is not a boolean!")
      }
      return Promise.resolve(retval);
    },
    getFilterDescriptionStringPromise: function (individualValuesButtonsPromises) {
      return Promise.all(individualValuesButtonsPromises).then(function(individualValuesButtons) {
        return i18n.sprintf("%s", individualValuesButtons.join(''));
      });
    }
  });
  
  function FilterPostIsUnread() {
    FilterPostHasUnread.call(this);
  }
  FilterPostIsUnread.prototype = Object.create(FilterPostHasUnread.prototype);
  _.extend(FilterPostIsUnread.prototype, {
    getId: function() {
      return 'is_unread_post';
    },
    getImplicitValue: function() {
      return "true";
    },
    getName: function() {
      return i18n.gettext('Are not read yet');
    },
    getHelpText: function() {
      return i18n.gettext('Only include messages you haven\'t read yet.');
    }
  });

  function FilterPostIsRead() {
    FilterPostHasUnread.call(this);
  }
  FilterPostIsRead.prototype = Object.create(FilterPostHasUnread.prototype);
  _.extend(FilterPostIsRead.prototype, {
    getId: function() {
      return 'is_read_post';
    },
    getImplicitValue: function() {
      return "false";
    },
    getName: function() {
      return i18n.gettext('Are already read');
    },
    getHelpText: function() {
      return i18n.gettext('Only include messages you have read already.');
    }
  });
  
  function FilterPostIsPostedSinceLastSynthesis() {
    AbstractFilterSingleValue.call(this);
  }
  FilterPostIsPostedSinceLastSynthesis.prototype = Object.create(AbstractFilterSingleValue.prototype);
  _.extend(FilterPostIsPostedSinceLastSynthesis.prototype, {
    getId: function() {
      return 'is_posted_since_last_synthesis';
    },
    getImplicitValue: function() {
      return 'WRITEME';
    },
    getServerParam: function() {
      return 'posted_after_date';
    },
    getName: function() {
      return i18n.gettext('Are posted since last synthesis');
    },
    getHelpText: function() {
      return i18n.gettext('Only include posts created after the last synthesis.');
    }
  });
  
  var availableFilters = {
    POST_HAS_ID_IN: FilterPostHasIdIn,
    POST_IS_IN_CONTEXT_OF_IDEA: FilterPostIsInContextOfIdea,
    POST_IS_DESCENDENT_OF_POST: FilterPostIsDescendentOfPost,
    POST_IS_ORPHAN: FilterPostIsOrphan,
    POST_IS_SYNTHESIS: FilterPostIsSynthesis,
    POST_IS_UNREAD: FilterPostIsUnread,
    POST_IS_READ: FilterPostIsRead,
    POST_IS_POSTED_SINCE_LAST_SYNTHESIS: FilterPostIsPostedSinceLastSynthesis,
    POST_IS_FROM: FilterPostIsFromUser
  };
  
  return availableFilters;

});