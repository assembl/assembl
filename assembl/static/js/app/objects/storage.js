define(function (require) {

    var Marionette = require('marionette'),
        groupSpec = require('models/groupSpec');

    var storage = Marionette.Object.extend({

        _store: window.localStorage,

        createGroupItem: function (items) {
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