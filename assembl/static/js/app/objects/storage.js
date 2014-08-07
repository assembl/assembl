define(function (require) {

    var Marionette = require('marionette'),
        groupSpec = require('models/groupSpec');

    var storage = Marionette.Object.extend({

        _store: window.localStorage,

        bindGroupSpecs: function(groupSpecs) {
            var that = this;
            this.groupSpecs = groupSpecs;
            this.listenTo(groupSpecs, 'add', this.addGroupSpec);
            this.listenTo(groupSpecs, 'remove', this.removeGroupSpec);
            this.listenTo(groupSpecs, 'reset change', this.saveGroupSpecs);
            groupSpecs.models.forEach(function(m) {
                that.listenTo(m.attributes.panels, 'add remove reset change', that.saveGroupSpecs);
            });
        },

        addGroupSpec: function(groupSpec, groupSpecs) {
            this.listenTo(groupSpec.attributes.panels, 'add remove reset change', this.saveGroupSpecs);
            this.saveGroupSpecs();
        },

        removeGroupSpec: function(groupSpec, groupSpecs) {
            this.stopListening(groupSpec);
            this.saveGroupSpecs();
        },

        saveGroupSpecs: function() {
            this._store.setItem('groupItems', JSON.stringify(this.groupSpecs));
        },

        createGroupItem: function(items) {
            var data = [],
                collection = [],
                groups = {},
                that = this;

            //FIXME: viewId need to be uniq to delete the right storage group

            if (items.length) {
                items.forEach(function (item) {
                    var i = {};
                    i.type = item;

                    data.push(i);
                });
            }

            groups.panels = data;

            if (!this._store.getItem('groupItems')) {

                collection.push(groups);
                this._store.setItem('groupItems', JSON.stringify(collection));

            } else {

                var groupOfPanels = JSON.parse(this._store.getItem('groupItems'));
                groupOfPanels.push(groups);

                this._store.removeItem('groupItems');
                this._store.setItem('groupItems', JSON.stringify(groupOfPanels));
            }

        },

        getStorageGroupItem: function () {
            if (this._store.getItem('groupItems')) {
                return JSON.parse(this._store.getItem('groupItems'));
            }
        }

    })

    return new storage();
});