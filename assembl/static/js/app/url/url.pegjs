{
    var groupSpec = require("../models/groupSpec.js"),
        panelSpec = require("../models/panelSpec.js"),
        groupState = require("../models/groupState.js"),
        Promise = require('bluebird'),
        viewsFactory = require("../objects/viewsFactory.js");
}


start = specs:( slash spec:specification0 {return spec;} )+ slash? {
    return Promise.all(specs).then(function(specs) {
        var coll = new groupSpec.Collection();
        for (var i in specs) {
            coll.add(specs[i]);
        }
        return coll;
    });
}

slash = "/"

semicolon = ";"

specification0 = pdl:panelData+ gsid:groupSpecInfos {
    pdl.push(gsid);
    return Promise.all(pdl).then(function(result) {
        gsid = result.pop();
        return new groupSpec.Model({
            panels: new panelSpec.Collection(result, {'viewsFactory': viewsFactory }),
            states: new groupState.Collection([gsid])
        });
    });
}

specification = pdl:panelData* gsid:groupSpecInfos {
    pdl.push(gsid);
    return Promise.all(pdl).then(function(result) {
        gsid = result.pop();
        return new groupSpec.Model({
            panels: new panelSpec.Collection(result, {'viewsFactory': viewsFactory }),
            states: new groupState.Collection([gsid])
        });
    });
}

panelData = panelId:panelId spec:("{" specification "}" )? {
    if (spec) {
        return spec[1].then(function(spec){
            return {
                    "type": viewsFactory.typeByCode[panelId.toUpperCase()],
                    "minimized": panelId.toUpperCase() != panelId,
                    "subSpec": spec,
                };
        });
    } else {
        return Promise.resolve({
                "type": viewsFactory.typeByCode[panelId.toUpperCase()],
                "minimized": panelId.toUpperCase() != panelId
            });
    }
}

panelId = [A-Za-z]

groupSpecInfos = gsis:( semicolon gsi:groupSpecInfo {return gsi;} )* {
    var promises = [];
    for (var i in gsis) {
        var gsi = gsis[i],
            specCode = gsi[0],
            specData = gsi[1],
            promise = groupState.Model.prototype.decodeUrlData(specCode, specData);
        if (promise) {
            promises.push(promise);
        }
    }
    if (promises.length > 0) {
        return Promise.all(promises).then(function(promises) {
            var defaults = {};
            for (var i in promises) {
                var promise = promises[i],
                    key = promise[0],
                    value = promise[1];
                defaults[key] = value;
            }
            return new groupState.Model(defaults);
        });
    } else {
        return new groupState.Model();
    }
}

groupSpecInfo = gsi:groupSpecId data:data {
    return [gsi, data];
}

groupSpecId = [A-Za-z]

data = chars:[-A-Za-z0-9\._~]* { return chars.join(""); }
