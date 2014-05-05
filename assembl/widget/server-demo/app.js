
/**
 * Module dependencies.
 */

var express = require('express')
  , bodyParser = require('body-parser')
  , app = express();

// all environments
app.use(bodyParser());


// development only
if ('development' == app.get('env')) {
  //app.use(express.errorHandler());
}

app.route('/discussion').get(function(req, res){
    var discussion = {

        "ideas":[
            {
                "id":1,
                "fullname":"Laurent Guillar",
                "avatar":"app/img/avatar-m-40x40.png",
                "message":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at porta nunc. Vestibulum sodales sodales consectetur. Phasellus rhoncus imperdiet est, non laoreet tortor congue eu.",
                "comments":[
                    {
                        "fullname":"Remy Guillar",
                        "avatar":"app/img/avatar-m-40x40.png",
                        "message":"Aenean adipiscing lorem sed nibh posuere mattis. Sed consectetur augue quis ultricies pharetra."
                    },
                    {
                        "fullname":"Julie Rouseau",
                        "avatar":"app/img/avatar-w-40x40.png",
                        "message":"Aenean adipiscing lorem sed nibh posuere mattis. Sed consectetur augue quis ultricies pharetra."
                    },
                    {
                        "fullname":"Jean Michel",
                        "avatar":"app/img/avatar-w-40x40.png",
                        "message":"Aenean adipiscing lorem sed nibh posuere mattis. Sed consectetur augue quis ultricies pharetra."
                    }
                ]
            },
            {
                "id":2,
                "fullname":"Sofia Ouazry",
                "avatar":"app/img/avatar-w-40x40.png",
                "message":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at porta nunc. Vestibulum sodales sodales consectetur. Phasellus rhoncus imperdiet est, non laoreet tortor congue eu.",
                "comments":[
                    {
                        "fullname":"Gerard Dami",
                        "avatar":"app/img/avatar-m-40x40.png",
                        "message":"Mauris eu cursus sem. Vivamus vitae fringilla turpis"
                    },
                    {
                        "fullname":"Cedric Folliot",
                        "avatar":"app/img/avatar-m-40x40.png",
                        "message":"Mauris eu cursus sem. Vivamus vitae fringilla turpis"
                    }
                ]
            },
            {
                "id":3,
                "fullname":"Tonny Bee",
                "avatar":"app/img/avatar-w-40x40.png",
                "message":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at porta nunc. Vestibulum sodales sodales consectetur. Phasellus rhoncus imperdiet est, non laoreet tortor congue eu.",
                "comments":[
                    {
                        "fullname":"Gerard Dami",
                        "avatar":"app/img/avatar-m-40x40.png",
                        "message":"Mauris eu cursus sem. Vivamus vitae fringilla turpis"
                    },
                    {
                        "fullname":"Cedric Folliot",
                        "avatar":"app/img/avatar-m-40x40.png",
                        "message":"Mauris eu cursus sem. Vivamus vitae fringilla turpis"
                    }
                ]
            },
            {
                "id":4,
                "fullname":"Alexandre Paron",
                "avatar":"app/img/avatar-w-40x40.png",
                "message":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at porta nunc. Vestibulum sodales sodales consectetur. Phasellus rhoncus imperdiet est, non laoreet tortor congue eu.",
                "comments":[
                    {
                        "fullname":"Gerard Dami",
                        "avatar":"app/img/avatar-m-40x40.png",
                        "message":"Mauris eu cursus sem. Vivamus vitae fringilla turpis"
                    },
                    {
                        "fullname":"Cedric Folliot",
                        "avatar":"app/img/avatar-m-40x40.png",
                        "message":"Mauris eu cursus sem. Vivamus vitae fringilla turpis"
                    },
                    {
                        "fullname":"Martin Gerard",
                        "avatar":"app/img/avatar-m-40x40.png",
                        "message":"Mauris eu cursus sem. Vivamus vitae fringilla turpis"
                    },
                    {
                        "fullname":"Fabien Thomas",
                        "avatar":"app/img/avatar-m-40x40.png",
                        "message":"Mauris eu cursus sem. Vivamus vitae fringilla turpis"
                    }
                ]
            },
            {
                "id":5,
                "fullname":"Pierre mouillon",
                "avatar":"app/img/avatar-w-40x40.png",
                "message":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce at porta nunc. Vestibulum sodales sodales consectetur. Phasellus rhoncus imperdiet est, non laoreet tortor congue eu.",
                "comments":[]
            }
        ]

    }

    res.send(discussion);


    //res.send('Hello world');
});

app.route('/config').get(function(req, res){
   var config = {
        "useraname":"test 1",
        "persmission":["read","write"],
        "youtube_api_key":"AIzaSyC8lCVIHWdtBwnTtKzKl4dy8k5C_raqyK4",
        "url":{
        "synthesis":"http://app.com/test/rest/synthesis",
            "message":"http://app.com/test/rest/message",
            "comment":"http://app.com/test/rest/comment"
    },
        "card_game":{
        "0":[
            {
                "id":"1",
                "description":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris quis nisl sapien.",
                "question":"Does this card inspire you about \"Assembl business models\"? Write your idea below!",
                "help":"test help card",
                "img_url":"https://farm4.staticflickr.com/3130/3175011222_e572d2810a_m.jpg",
                "color":"blue",
                "html_content":"<p>STRATEGY CARD #21</p><h3>Reframe losses and gains.</h3><br/><p>A situation can often be described in terms of losses or gains – the glass is half full or anecdote/example half empty. Emphasizing losses will generally cause people to avoid an option or activity. Emphasizing gains will make an option seem more attractive.</p><br/><h4>To reframe losses and gains...</h4><h5>ask yourself:</h5><p>How might we reorganize, restate, recontextualize, or reconsider information to emphasize the relevant gains or losses?</p><h5>e.g.</h5><p>Consider these two energy campaigns:</p><p>“(1) If you use energy conservation methods, you will save $350/year; (2) If you do not use energy conservation methods, you will lose $350/year.” Framing the campaign in terms of a loss, like in the second example, is far more effective than the first.</p>"
            },
            {
                "id":"2",
                "description":"Phasellus commodo, elit in sodales consequat, arcu metus commodo enim.",
                "question":"Maecenas id velit ut libero pharetra accumsan",
                "help":"test help card",
                "img_url":"https://farm4.staticflickr.com/3713/9628208421_fd149be19d_m.jpg",
                "color":"back",
                "html_content":"<img src='https://farm4.staticflickr.com/3713/9628208421_fd149be19d_m.jpg' alt='card image' /><p>Phasellus commodo, elit in sodales consequat, arcu metus commodo enim.</p>"
            },
            {
                "id":"3",
                "description":"Curabitur id urna vitae orci varius congue. Ut rutrum lectus sed enim scelerisque sodales.",
                "question":"Morbi laoreet ante et risus lobortis rutrum sit amet id mauris",
                "help":"test help card",
                "img_url":"https://farm2.staticflickr.com/1021/3175006734_99990f376d_m.jpg",
                "color":"yellow",
                "html_content":"<img src='https://farm2.staticflickr.com/1021/3175006734_99990f376d_m.jpg' alt='card image' /><p>Curabitur id urna vitae orci varius congue. Ut rutrum lectus sed enim scelerisque sodales.</p></div>"
            }
        ],
            "1":[
            {
                "id":"1",
                "description":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris quis nisl sapien.",
                "question":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                "help":"test help card",
                "img_url":"https://farm4.staticflickr.com/3130/3175011222_e572d2810a_m.jpg",
                "color":"blue",
                "html_content":"<img src='https://farm4.staticflickr.com/3130/3175011222_e572d2810a_m.jpg' alt='card image' /><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris quis nisl sapien.</p>"
            },
            {
                "id":"2",
                "description":"Phasellus commodo, elit in sodales consequat, arcu metus commodo enim.",
                "question":"Maecenas id velit ut libero pharetra accumsan",
                "help":"test help card",
                "img_url":"https://farm4.staticflickr.com/3713/9628208421_fd149be19d_m.jpg",
                "color":"back",
                "html_content":"<img src='https://farm4.staticflickr.com/3713/9628208421_fd149be19d_m.jpg' alt='card image' /><p>Phasellus commodo, elit in sodales consequat, arcu metus commodo enim.</p>"
            },
            {
                "id":"3",
                "description":"Curabitur id urna vitae orci varius congue. Ut rutrum lectus sed enim scelerisque sodales.",
                "question":"Morbi laoreet ante et risus lobortis rutrum sit amet id mauris",
                "help":"test help card",
                "img_url":"https://farm2.staticflickr.com/1021/3175006734_99990f376d_m.jpg",
                "color":"yellow",
                "html_content":"<img src='https://farm2.staticflickr.com/1021/3175006734_99990f376d_m.jpg' alt='card image' /><p>Curabitur id urna vitae orci varius congue. Ut rutrum lectus sed enim scelerisque sodales.</p>"
            }
        ],
            "2":[
            {
                "id":"1",
                "description":"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris quis nisl sapien.",
                "question":"Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                "help":"test help card",
                "img_url":"",
                "color":"blue"
            },
            {
                "id":"2",
                "description":"Phasellus commodo, elit in sodales consequat, arcu metus commodo enim.",
                "question":"Maecenas id velit ut libero pharetra accumsan",
                "help":"test help card",
                "img_url":"",
                "color":"back"
            },
            {
                "id":"3",
                "description":"Curabitur id urna vitae orci varius congue. Ut rutrum lectus sed enim scelerisque sodales.",
                "question":"Morbi laoreet ante et risus lobortis rutrum sit amet id mauris",
                "help":"test help card",
                "img_url":"",
                "color":"yellow"
            }
        ]
    }
  }

   res.send(config);

});


app.listen(process.env.PORT || 3000);

