define(['jasmine', 'underscore', 'app', 'views/idea'],
function(jasmine, _, app, IdeaView){

    var view,
        fixIdea;

    function getView(){
        var v = new IdeaView();
        v.model = new Backbone.Model();

        //
        setFixtures('<ul id="fix-idea"></ul>');
        fixIdea = $('#fix-idea');
        fixIdea.append( v.render().el );
        return v;
    }

    return describe('IdeaPanel View', function(){

        beforeEach(function(){
            view = getView();
        });

    });

});