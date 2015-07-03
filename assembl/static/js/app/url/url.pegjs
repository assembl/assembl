start = specs:( slash spec:specification0 {return spec;} )+ slash? {
    return specs;
}

slash = "/"

semicolon = ";"

specification0 = pdl:panelData+ gsid:groupSpecInfos {
    return {
        "panels": pdl,
        "data": gsid
    };
}

specification = pdl:panelData* gsid:groupSpecInfos {
    return {
        "panels": pdl,
        "data": gsid
    };
}

panelData = panelId:panelId spec:("{" specification "}" )? {
    return {
        "panelId": panelId,
        "spec": spec?spec[1]:null,
    };
}

panelId = [A-Za-z]

groupSpecInfos = gsis:( semicolon gsi:groupSpecInfo {return gsi;} )* {
    gsid = {};
    for (var i in gsis) {
        var gsi = gsis[i];
        gsid[gsi[0]] = gsi[1];
    }
    return gsid;
}

groupSpecInfo = gsi:groupSpecId data:data {
    return [gsi, data];
}

groupSpecId = [A-Za-z]

data = chars:[-A-Za-z0-9\._~]* { return chars.join(""); }
