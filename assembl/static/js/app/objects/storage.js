'use strict';

var Marionette = require('../shims/marionette.js'),
    groupSpec = require('../models/groupSpec.js'),
    Ctx = require('../common/context.js');

var storage = Marionette.Object.extend({

    _store: window.localStorage,

    getStoragePrefix: function () {
        var interfaceType = Ctx.getCurrentInterfaceType(),
            storagePrefix;
        if (interfaceType === Ctx.InterfaceTypes.SIMPLE) {
            storagePrefix = "simpleInterface";
        }
        else if (interfaceType === Ctx.InterfaceTypes.EXPERT) {
            storagePrefix = "expertInterface";
        }
        else {
            console.log("storage::initialize unknown interface type: ", interfaceType);
        }
        return storagePrefix;
    },

    bindGroupSpecs: function (groupSpecs) {
        var that = this;
        this.groupSpecs = groupSpecs;
        this.listenTo(groupSpecs, 'add', this.addGroupSpec);
        this.listenTo(groupSpecs, 'remove', this.removeGroupSpec);
        this.listenTo(groupSpecs, 'reset change', this.saveGroupSpecs);
        groupSpecs.models.forEach(function (m) {
            that.listenTo(m.attributes.panels, 'add remove reset change', that.saveGroupSpecs);
            that.listenTo(m.attributes.states, 'add remove reset change', that.saveGroupSpecs);
        });
    },

    addGroupSpec: function (groupSpec, groupSpecs) {
        this.listenTo(groupSpec.attributes.panels, 'add remove reset change', this.saveGroupSpecs);
        this.saveGroupSpecs();
    },

    removeGroupSpec: function (groupSpec, groupSpecs) {
        this.stopListening(groupSpec);
        this.saveGroupSpecs();
    },

    saveGroupSpecs: function () {
        //console.log("saveGroupSpecs:", JSON.stringify(this.groupSpecs));
        this._store.setItem(this.getStoragePrefix() + 'groupItems', JSON.stringify(this.groupSpecs));
        this._store.setItem(this.getStoragePrefix() + 'lastViewSave', Date.now());
        console.log("saveGroupSpecs, store is now: ", this._store);
    },

    getDateOfLastViewSave: function () {
        var lastSave = this._store.getItem(this.getStoragePrefix() + 'lastViewSave');
        if (lastSave) {
            return new Date(lastSave);
        }
    },

    getStorageGroupItem: function () {
        if (this._store.getItem(this.getStoragePrefix() + 'groupItems')) {
            return JSON.parse(this._store.getItem(this.getStoragePrefix() + 'groupItems'));
        }
    }

})

module.exports = new storage();