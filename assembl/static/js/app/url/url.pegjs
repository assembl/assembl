{
    var groupSpec = require("../models/groupSpec.js"),
        panelSpec = require("../models/panelSpec.js"),
        groupState = require("../models/groupState.js"),
        viewsFactory = require("../objects/viewsFactory.js");
}


start = specs:( slash spec:specification0 {return spec;} )+ slash? {
    var coll = new groupSpec.Collection();
    for (var i in specs) {
        coll.add(specs[i]);
    }
    return coll;
}

slash = "/"

semicolon = ";"

specification0 = pdl:panelData+ gsid:groupSpecInfos {
    return new groupSpec.Model({
        panels: new panelSpec.Collection(pdl, {'viewsFactory': viewsFactory }),
        states: new groupState.Collection([gsid])
    });
}

specification = pdl:panelData* gsid:groupSpecInfos {
    return new groupSpec.Model({
        panels: new panelSpec.Collection(pdl, {'viewsFactory': viewsFactory }),
        states: new groupState.Collection([gsid])
    });
}

panelData = panelId:panelId spec:("{" specification "}" )? {
    return new panelSpec.Model({
            "type": viewsFactory.typeByCode[panelId.toUpperCase()],
            "minimized": panelId.toUpperCase() != panelId,
            "subSpec": spec?spec[1]:null,
        });
}

panelId = [A-Za-z]

groupSpecInfos = gsis:( semicolon gsi:groupSpecInfo {return gsi;} )* {
    gsid = {};
    for (var i in gsis) {
        var gsi = gsis[i],
            specCode = gsi[0],
            specData = gsi[1];
        groupState.Model.decodeUrlData(specCode, specData, gsid);
    }
    return new groupState.Model(gsid);
}

groupSpecInfo = gsi:groupSpecId data:data {
    return [gsi, data];
}

groupSpecId = [A-Za-z]

data = chars:[-A-Za-z0-9\._~]* { return chars.join(""); }
