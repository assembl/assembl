"use strict";

videosApp.controller('videosCtl',
    ['$scope', '$q', '$http', '$route', '$routeParams', '$log', '$resource', '$translate', 'localConfig', 'JukeTubeVideosService', 'DiscussionService', 'sendIdeaService', 'configService', 'utils', 'AssemblToolsService', 
        function($scope, $q, $http, $route, $routeParams, $log, $resource, $translate, localConfig, JukeTubeVideosService, DiscussionService, sendIdeaService, configService, utils, AssemblToolsService) {

          // intialization code (constructor)

          $scope.init = function() {

            console.log("configService: ", configService);
            console.log("configService.data: ", configService.data);

            $scope.config = {};
            $scope.config.widget = configService.data.widget;
            $scope.config.idea = configService.data.idea;
            console.log("$scope.config: ", $scope.config);
            $scope.urlParameterConfig = $route.current.params.config; //$routeParams.config;
            console.log("$scope.urlParameterConfig: ", $scope.urlParameterConfig);
            if (!$scope.config.widget && !$scope.config.idea)
            {
              console.log("Error: no config or idea given.");
            }

            // local config json
                
            $scope.localConfigPromise = localConfig.fetch();
            $scope.localConfigPromise.success(function(data) {
              console.log("localConfig received");
              $scope.localConfig = data;
            });
            $scope.canPost = true;
            $scope.canNotPostReason = null;

            $scope.sendMessageEndpointUrl = $scope.computeSendMessageEndpointUrl();
            console.log("$scope.sendMessageEndpointUrl: ", $scope.sendMessageEndpointUrl);
            if (!$scope.sendMessageEndpointUrl) {
              $scope.canPost = false;
              $scope.canNotPostReason = "no_endpoint";
            }
                
            // set default model fields

            $scope.message_is_sent = false;
            $scope.youtube = JukeTubeVideosService.getYoutube();
            $scope.results = JukeTubeVideosService.getResults();
            $scope.pageInfo = JukeTubeVideosService.getPageInfo();
            $scope.playlist = true;
            $scope.currentVideoId = null;
            $scope.currentVideoTitle = null;
            $scope.idea = {
              shortTitle: "Idea short title",
              longTitle: "Idea long title"
            };
            $scope.discussion = {
              topic: "Discussion topic"
            };

            $scope.inspiration_keywords = [
                "modèle commercial",
                "freemium",
                "modèle d'affaires",
                "entreprise",
                "stratégie"
            ];

            $scope.inspiration_keywords_related = [
                /*"modèle économique",
                "low cost",
                "avantage compétitif",
                "établissement",
                "tactique"*/
            ];

            $scope.inspiration_keywords_used = {};

            $scope.hasSearched = false;

            // get inspiration keywords from the idea URL given in the configuration JSON

            if ($scope.config.idea) // or we could use $routeParams.idea
                $scope.idea_api_url = utils.urlApi($scope.config.idea['@id']);
            else
                $scope.idea_api_url = utils.urlApi($scope.config.widget.settings.idea);
            $scope.idea_api_url += '?view=creativity_widget';
            console.log("idea_api_url: " + $scope.idea_api_url);
            $scope.discussion_api_url = 'discussion api url';

            console.log("$scope.config.idea: ", $scope.config.idea);
            console.log("$scope.config.widget: ", $scope.config.widget);
            var
                Idea = $resource($scope.idea_api_url),
                Discussion = null,
                discussionId = ($scope.config.idea) ? $scope.config.idea.discussion : $scope.config.widget.discussion;
            discussionId = discussionId.split('/')[1];
            console.log("A");

            $scope.idea = Idea.get({}, function() { // this function is executed once the AJAX request is received and the variable is assigned
              console.log("idea:");
              console.log($scope.idea);
              $scope.inspiration_keywords = $scope.idea.most_common_words;
              $scope.inspiration_keywords_used = {};

              // get discussion from the idea
              $scope.discussion_api_url = utils.urlApi($scope.idea.discussion);
              console.log("discussion_api_url: " + $scope.discussion_api_url);
              Discussion = $resource($scope.discussion_api_url);

              $scope.discussion = DiscussionService.get({discussionId: discussionId}, function() {
                console.log("discussion:");
                console.log($scope.discussion);
              });

              // fill the search bar with the 2 first keywords and submit the search

              console.log("E");
              setFirstKeywordsAsQuery();
              console.log("F");
              $scope.search();

            });

            // hide right panel

            $("#player").css("visibility", "hidden");

            // initialize the Select2 textfield
            // If we do not encapsulate the following in a setTimeout(), we receive an AngularJS error: "Error: node[0] is undefined"
            setTimeout(function() {
              $("#query").select2({
                tags: [], //$scope.inspiration_keywords, // not used anymore, because the dropdown is now hidden
                tokenSeparators: [",", " "],
                formatNoMatches: function(term) {
                  return '';
                },

                //minimumResultsForSearch: -1
                selectOnBlur: true,
                minimumInputLength: 1,
                width: '70%'
              });

              setFirstKeywordsAsQuery();
            }, 10);
                
            // make recommended keywords re-appear on top when they are removed from the search field

            $("#query").on("change", function(e) {
              $scope.$apply(function() {
                if (e.removed) {
                  /* now handled by ng-show of Angluar in the HTML template
                   if ( $scope.inspiration_keywords.indexOf(e.removed.text) >= 0 || $scope.inspiration_keywords_related.indexOf(e.removed.text) >= 0 )
                   {
                   $("#results .keywords .keyword:contains(\""+e.removed.text.replace(/"/g, '\\"')+"\")").show();
                   }
                   */
                   
                  if ($scope.inspiration_keywords_used[e.removed.text] != undefined) {
                    delete $scope.inspiration_keywords_used[e.removed.text];
                  }

                }
                else if (e.added) {
                  $scope.inspiration_keywords_used[e.added.text] = true;
                }
              });
            });

            $('#search input.select2-input').on('keyup', function(e) {
              if (e.keyCode === 13) // press Enter
              {
                $scope.search();
              }
            });

            // load youtube script

            if (JukeTubeVideosService.getYoutube().ready === true)
                JukeTubeVideosService.onYouTubeIframeAPIReady();

          };

          /**
           * Explore wikipedia and extract keywords from 'See Also' section
           * More info on:
           * http://www.mediawiki.org/wiki/API:Tutorial
           * http://www.mediawiki.org/wiki/API:Query
           * This method does not handle disambiguation nor redirection yet.
           * @param page: "|"-separated urlencoded Wikipedia page names
           * @param lang: 'en' or 'fr'
           */
          $scope.getRelatedTermsPromise = function(page, lang) {
            if (!lang)
                lang = 'en';
            var deferred = $.Deferred();
            $.ajax("https://" + lang + ".wikipedia.org/w/api.php" +
                "?action=query&continue=&prop=revisions" +
                "&rvprop=content&format=json&titles=" + page,
                    {
                      dataType: "jsonp",
                      success: function(data) {
                        var keywords = [];
                        var pages = data.query.pages;

                        for (var p in pages) {
                          if (p < 0) {
                            console.log("Page not found");
                            continue;
                          }

                          var revision = pages[p].revisions[0];
                          var content = revision['*'];
                          var re = null;
                          if (lang == "en") {
                            re = /== ?see also ?==([^]*?)$/i;
                          } else {
                            re = /(?:=== ?articles connexes ?===|== ?annexes ?==)([^]*?)$/i;
                          }

                          if (re.exec(content) == null) {
                            var rey = /#REDIRECT \[\[(.*)\]\]/;
                            if (rey.exec(content) == null) {
                              if ((/\{\{disambiguation\}\}/i).exec(content) != null || (/\{\{homonymie\}\}/i).exec(content) != null) {
                                console.log("Try disambiguation or honomymy");
                                var rez = /\[\[(.*?)\]\](.*)$/mg;
                                var dsMatch = null;
                                var dsArray = [];
                                while ((dsMatch = rez.exec(content)) != null) {
                                  var canon = dsMatch[2].replace(/\[\[.*\|(.*)\]\]/, "[[$1]]").replace(/\[\[(.*?)\]\]/g, "$1");
                                  dsArray.push([dsMatch[1], canon]);
                                }

                                console.log("dsArray:", dsArray);

                                // TODO: recursivity?

                                continue;
                              } else {
                                continue;
                              }
                            } else {
                              var target = rey.exec(content)[1];
                              console.log("? Follow redirection from " + pages[p].title + " to " + target);

                              // Wikipedia redirection pages seem to not be handled by this code
                              /*
                              window.kwargs.acc += 2;
                              window.kwargs.ary.push({st: "redirect", page: target, kwargs: [pages[p].title], lang: LANG});
                              fn.redirect(pages[p].title, target);
                              pages[p].title = target;
                              target = [];
                              for (var k in pages) {
                                target.push(pages[k].title);
                              }
                              */
                            }

                            continue;
                          } else {
                            var seeAlso = re.exec(content)[1];
                            var match = null;
                            var rex = /\* ?\[\[(.*?)\]\]/g;
                            while ((match = rex.exec(seeAlso)) != null) {
                              keywords.push(match[1].replace(/.*?\|/, ""));
                            }
                          }
                        }

                        deferred.resolve(keywords);
                      },
                      error: function() {
                        deferred.reject();
                      }
                    }
                );
            return deferred.promise();
          };

          $scope.resumeInspiration = function() {
            console.log("resumeInspiration()");
            $scope.message_is_sent = false;
          };

          $scope.exit = function() {
            console.log("exit()");
            window.parent.exitModal();
            console.log("called exitModal");
          };

          $scope.keywordClick = function($event) {
            var keyword_value = $($event.target).html();
            var values = $("#query").select2("val");
            var alreadyThere = false;
            for (var i = 0; i < values.length; ++i) {
              if (values[i] == keyword_value) {
                alreadyThere = true;
                break;
              }
            }

            if (false == alreadyThere) {
              $scope.inspiration_keywords_used[keyword_value] = true;
              values.push(keyword_value);
              $("#query").select2("val", values);

              //$($event.target).hide(); // now handled by ng-show of Angluar in the HTML template
              //$(el.target).css('background', '#000');
            }
          };

          var setFirstKeywordsAsQuery = function() {
            console.log("setFirstKeywordsAsQuery()");
            var values = [];
            if ($scope.inspiration_keywords.length > 0) {
              values.push($scope.inspiration_keywords[0]);
              $scope.inspiration_keywords_used[$scope.inspiration_keywords[0]] = true;
            }

            if ($scope.inspiration_keywords.length > 1) {
              values.push($scope.inspiration_keywords[1]);
              $scope.inspiration_keywords_used[$scope.inspiration_keywords[1]] = true;
            }

            console.log("prefill:" + values[0] + " " + values[1]);
            $("#query").select2("val", values);
          };

          $scope.scrollToPlayerAndLaunch = function(id, title) {
            // show right panel
            $("#player").css("visibility", "visible");

            $("html, body").animate({scrollTop: $("#player").offset().top - 10}, "slow");
            $scope.launch(id, title);
          };

          $scope.launch = function(id, title) {
            $log.info('launch(): Launched video id: ' + id + ' and title: ' + title);
            $scope.currentVideoId = id;
            $scope.currentVideoTitle = title;
            JukeTubeVideosService.launchPlayer(id, title);
          };

          $scope.search = function(pageToken) {
            console.log("search()");
            $scope.hasSearched = true;
            $q.when($scope.localConfigPromise).then(function() {
              console.log("$scope.localConfigPromise is ready");
              var q = $('#query').val();
              var params = {
                key: $scope.localConfig.youtube_api_key,
                type: 'video',
                maxResults: '10',
                part: 'id,snippet',
                fields: 'items/id,items/snippet/publishedAt,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle,nextPageToken,prevPageToken,pageInfo',
                q: q
              };
              if (pageToken)
                  params.pageToken = pageToken;

              $http.get('https://www.googleapis.com/youtube/v3/search', {
                params: params
              }).success(function(data) {
                JukeTubeVideosService.processResults(data);
                $scope.results = JukeTubeVideosService.getResults();
                $scope.pageInfo = JukeTubeVideosService.getPageInfo();
                $log.info(data);
              })
                    .error(function() {
                      $log.info('Search error');
                    });
            });
                
          };

          $scope.searchRelatedTerms = function() {
            console.log("searchRelatedTerms()");
            var current_lang = $translate.use();
            var relatedTermsPromise = $scope.getRelatedTermsPromise($('#related_terms_query').val(), current_lang);
            $q.when(relatedTermsPromise).then(function(data) {
              console.log("getRelatedTermsPromise found these terms: ", data);
              $scope.inspiration_keywords_related = data;

              // angular does not like duplicates in a repeater and we don't need duplicates, so we remove them
              function onlyUnique(value, index, self) { 
                return self.indexOf(value) === index;
              }

              $scope.inspiration_keywords_related = $scope.inspiration_keywords_related.filter(onlyUnique);

              // if no result, show the i18n no result string in UI
              if (data && data.length)
                  $scope.inspiration_keywords_related_no_results = false;
              else
                  $scope.inspiration_keywords_related_no_results = true;
            }, function() {
              $scope.inspiration_keywords_related_no_results = true;
            });
          };

          $scope.computeSendMessageEndpointUrl = function() {
            console.log("config: ", $scope.config);

            //console.log("$scope.config.widget.ideas_url: ", $scope.config.widget.ideas_url);
            console.log("$scope.config.idea.widget_add_post_endpoint: ", $scope.config.idea.widget_add_post_endpoint);
            var endpoints = null;
            var url = null;
            if ("widget_add_post_endpoint" in $scope.config.idea)
                endpoints = $scope.config.idea.widget_add_post_endpoint;
            var widgetUri = AssemblToolsService.urlToResource($scope.urlParameterConfig);
            console.log("$scope.urlParameterConfig: ", $scope.urlParameterConfig);
            console.log("widgetUri: ", widgetUri);
            if (endpoints && Object.keys(endpoints).length > 0)
            {
              if (widgetUri in endpoints)
              {
                url = AssemblToolsService.resourceToUrl(endpoints[widgetUri]);
              }
              else
                    {
                      url = AssemblToolsService.resourceToUrl(endpoints[Object.keys(endpoints)[0]]);
                    }
            }
            else
                {
                  console.log("error: could not determine an endpoint URL to post message to");
                }

            return url;
          };

          $scope.sendIdeaFake = function() {
            // tell the user that the message has been successfully posted
            //alert("Your message has been successfully posted.");
            $scope.message_is_sent = true;
            $("#messageTitle").val("");
            $("#messageContent").val("");
          };

          $scope.sendIdea = function() {
            console.log("sendIdea()");
            try {
                
              var messageSubject = $("#messageTitle").val();
              var messageContent = $("#messageContent").val();
              if (!messageSubject || !messageContent) {
                return;
              }

              var videoUrl = "https://www.youtube.com/watch?v=" + $scope.currentVideoId;
              var videoTitle = $scope.currentVideoTitle; // TODO: use these last 2 pieces of info
              console.log("messageSubject: ", messageSubject);
              console.log("messageContent: ", messageContent);
              console.log("videoUrl: ", videoUrl);
              console.log("videoTitle: ", videoTitle);

              /*
               // initial way of posting: do not use any posting URL given in the config, use instead the general Discussion API
               // so here we post a message in the discussion, linked with the idea which is linked with the current instance of the widget
               var send =  new sendIdeaService();
               send.idea_id = $scope.idea["@id"];
               send.subject = messageSubject;
               send.message = messageContent;
               //TODO : better way of determining discussionId. here we use $scope.discussion.@id which is "local:Discussion/6"
               send.$save({discussionId: parseInt($scope.discussion["@id"].split("/").pop())}, function sucess(){
               alert("Your message has been successfully posted.");
               }, function error(){
               alert("Error: your message has not been posted.");
               });
               */
               
              /*
               // send an Idea, which should display in Assembl's Table of ideas as a sub-idea of the idea linked to the widget
               var EntityApiEndpoint = $resource(AssemblToolsService.resourceToUrl(WidgetConfigService.ideas_url), {}, {'Content-Type': 'application/x-www-form-urlencoded'});
               var message = new EntityApiEndpoint();
               message.type = "Idea";
               message.short_title = messageSubject;
               //message.long_title = messageContent;
               message.$save(function(u, putResponseHeaders) {
               //u => saved user object
               //putResponseHeaders => $http header getter
               alert("Your message has been successfully posted.");
               });
               // The response I get is:
               // 404 Not Found
               // The resource could not be found.
               */
               
              /*
               // does not work because even if we tell the right content type, the parameters are still sent as JSON
               var EntityApiEndpoint = $resource(AssemblToolsService.resourceToUrl(WidgetConfigService.ideas_url), {}, {
               post:{
               method:"POST",
               isArray:false,
               headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}
               },
               });
               var message = {
               type: "Idea",
               short_title: messageSubject
               };
               EntityApiEndpoint.post(message);
               */
               
              // this one works, but once posted, the discussion is broken ("Internal Server Error / The server encountered an unexpected internal server error / (generated by waitress)")
              /*var message = {
                  type: "Idea",
                  short_title: messageSubject,
                  definition: messageContent
              };*/
              var message = {
                "@type": "WidgetPost",
                "message_id": 0,
                "subject": {
                    "@type": "LangString", "entries": [{
                        "@type": "LangStringEntry", "value": messageSubject,
                        "@language": "und"}]},
                "body": {
                    "@type": "LangString", "entries": [{
                        "@type": "LangStringEntry", "value": messageContent,
                        "@language": "und"}]},
                "metadata_json": {"inspiration_url": videoUrl }
              };

              console.log("message: ", message);
              var url = $scope.sendMessageEndpointUrl;
              if (!url)
              {
                throw "no endpoint";
              }

              // an example value for url is "/data/Discussion/1/widgets/56/base_idea_descendants/4/linkedposts";
              // FIXME: error when http://localhost:6543/widget/video/?config=/data/Widget/40#/?idea=local:Idea%2F4%3Fview%3Dcreativity_widget => $scope.config.idea.widget_add_post_endpoint is an empty object

              //var url = utils.urlApi($scope.config.widget.ideas_url);
              console.log("url: ", url);
              $http({
                method: 'POST',
                url: url,
                data: JSON.stringify(message),
                headers: {'Content-Type': 'application/json'}
              }).success(function(data, status, headers, config) {
                console.log("Success: ", data, status, headers, config);
                /* commented out because we don't post an idea anymore, now we post a message
                // save the association between the video and the comment in the widget instance's memory
                var created_idea = headers("Location"); // "local:Idea/66"
                $scope.associateVideoToIdea(created_idea, videoUrl, videoTitle);
                */
                
                // tell the user that the message has been successfully posted
                //alert("Your message has been successfully posted.");
                $scope.message_is_sent = true;
                $("#messageTitle").val("");
                $("#messageContent").val("");
              }).error(function(data) {
                console.log("Error: ", data);
              });
              console.log("done");

              /*
               // send an Idea, which should display in Assembl's Table of ideas as a sub-idea of the idea linked to the widget
               var data = {
               "type": "Idea",
               "short_title": messageSubject
               };
               $http.post( AssemblToolsService.resourceToUrl(WidgetConfigService.ideas_url), data)
               //$http.post( AssemblToolsService.resourceToUrl(WidgetConfigService.ideas_url), data, { params: data })
               .success(function(data, status, headers){
               alert("Your message has been successfully posted.");
               });
               // The response I get is:
               // 400 Bad Request
               // The server could not comply with the request since it is either malformed or otherwise incorrect
               */
               
              /*
               // send a Message, which should display in Assembl's Messages panel when the idea linked to the widget is selected
               var EntityApiEndpoint = $resource(WidgetConfigService.messages_url);
               var message = new EntityApiEndpoint();
               message.idea_id = $scope.idea["@id"];
               message.message = messageSubject + " \n " + messageContent;
               message.$save();
               // The response I get is:
               // 404 Not Found
               // The resource could not be found.
               */
               
            } catch (err) {
              console.log("Error:", err);
            }
          };

          /*
           Save the association between the video and the comment in the widget instance's memory (using API endpoint `user_state_url`)
           So then in Assembl's Messages panel, it will be possible to find that a given message ("idea") has been inspired by a given item (video or card)
           */
          $scope.associateVideoToIdea = function(idea_id, video_url, video_title) {

            // declare a function which adds an item to the initial_data JSON (previously received by a GET from the `user_state_url` API endpoint), and PUTs it back to the endpoint
            var addData = function(initial_data, original_idea, idea_id, video_url, video_title) {
              console.log("associateVideoToIdea()::addData()");
              if (!initial_data || !initial_data["inspire_me_posts_by_original_idea"]) {
                initial_data = {
                  "inspire_me_posts_by_original_idea": {}
                };
              }

              var obj = {
                "idea_id": idea_id,
                "inspiration_type": "video",
                "inspiration_url": video_url
              };

              if (video_title)
                  obj["video_title"] = video_title;

              if (!initial_data["inspire_me_posts_by_original_idea"][original_idea]) {
                initial_data["inspire_me_posts_by_original_idea"][original_idea] = [];
              }

              initial_data["inspire_me_posts_by_original_idea"][original_idea].push(obj);

              // user_state_url accepts only GET and PUT actions, and accepts only headers: {'Content-Type': 'application/json'}
              $http({
                method: 'PUT',
                url: utils.urlApi($scope.config.widget.user_state_url),
                data: initial_data,
                async: true,
                headers: {'Content-Type': 'application/json'}
              }).success(function(data, status, headers) {
                console.log("PUT success");
              }).error(function(status, headers) {
                console.log("PUT error");
              });
            };

            // first, get the content of user_state_url, then add our item to it, and then only we can PUT to the endpoint (because otherwise previous information will be lost)

            $http({
              method: 'GET',
              url: utils.urlApi($scope.config.widget.user_state_url),

              //data: obj,
              async: true,
              headers: {'Content-Type': 'application/json'}
            }).success(function(data, status, headers) {
              console.log("GET success");
              console.log("data:");
              console.log(data);
              addData(data, $scope.idea["@id"], idea_id, video_url, video_title);
            }).error(function(status, headers) {
              console.log("GET error");
            });

          };
        }]);
