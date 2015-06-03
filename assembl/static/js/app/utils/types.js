'use strict';

var Types = {
    DISCUSSION: 'Discussion',
    EXTRACT: 'Extract',
    ROOT_IDEA: 'RootIdea',
    IDEA: 'Idea',
    IDEA_LINK: 'IdeaLink',
    POST: 'Post',
    SYNTHESIS_POST: 'SynthesisPost',
    EMAIL: 'Email',
    SYNTHESIS: 'Synthesis',
    TABLE_OF_CONTENTS: 'TableOfIdeas',
    USER: 'User',
    PARTNER_ORGANIZATION: 'PartnerOrganization',
    WEBPAGE: 'Webpage',
    initInheritance: function(inheritance) {
        // This is small, I think it can be synchronous.
        var script = document.getElementById("inheritance-json");
        try {
            this.inheritance = JSON.parse(script.textContent);
        } catch (e) {
            this.inheritance = {};
        }
    },
    getBaseType: function(type) {
        if (this.inheritance === undefined)
            return type;
        while (this.inheritance[type] !== undefined) {
            type = this.inheritance[type];
        }
        return type;
    },
    isInstance: function(type, parentType) {
        if (this.inheritance === undefined)
            return type == parentType;
        while (this.inheritance[type] !== undefined) {
            if (type == parentType)
                return true;
            type = this.inheritance[type];
        }
        return type == parentType;
    }
};
Types.initInheritance();

module.exports = Types;


