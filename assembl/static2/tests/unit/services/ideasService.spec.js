import IdeasService from '../../../js/app/services/ideasService';

const mockApi = [
  {
    "@id":"local:Idea/12",
    "@type":"RootIdea",
    "@view":"default",
    attachments:[
      {
        "@id":"local:Attachment/226",
        "@type":"IdeaAttachment",
        "@view":"default",
        attachmentPurpose:"EMBED_ATTACHMENT",
        creation_date:"2016-11-09T13:42:15.323096Z",
        document:{},
        external_url:"http://localhost:6543/data/Discussion/6/documents/404/data",
        idAttachedDocument:"local:Document/402",
        idCreator:"local:AgentProfile/1296",
        idObjectAttachedTo:"local:Idea/18",
        title:""
      }
    ],
    creationDate:"2014-01-20T16:01:29Z",
    extracts:[],
    hidden:false,
    is_tombstone:false,
    message_columns:[],
    messages_in_parent:true,
    numChildIdea:16,
    num_orphan_posts:55,
    num_synthesis_posts:8,
    num_total_and_read_posts:[195, 34, 0],
    order:null,
    original_uri:"local:Idea/12",
    parents:[],
    shortTitle:"Title 1",
    root:true,
    subtype:"assembl:RootIdea",
    widget_add_post_endpoint:{},
    widget_links:[]
  },
  {
    "@id":"local:Idea/38",
    "@type":"RootIdea",
    "@view":"default",
    attachments:[
      {
        "@id":"local:Attachment/227",
        "@type":"IdeaAttachment",
        "@view":"default",
        attachmentPurpose:"EMBED_ATTACHMENT",
        creation_date:"2016-11-09T13:42:15.323096Z",
        document:{},
        external_url:"http://localhost:6543/data/Discussion/6/documents/405/data",
        idAttachedDocument:"local:Document/402",
        idCreator:"local:AgentProfile/1296",
        idObjectAttachedTo:"local:Idea/18",
        title:""
      }
    ],
    creationDate:"2015-02-20T16:01:29Z",
    definition: 'Description de l\'idée',
    extracts:[],
    hidden:false,
    is_tombstone:false,
    message_columns:[],
    messages_in_parent:true,
    numChildIdea:16,
    num_orphan_posts:55,
    num_synthesis_posts:8,
    num_total_and_read_posts:[231, 67, 0],
    order:null,
    original_uri:"local:Idea/38",
    parents:[],
    shortTitle:"Title 2",
    root:true,
    subtype:"assembl:RootIdea",
    widget_add_post_endpoint:{},
    widget_links:[]
  },
  {
    "@id":"local:Idea/56",
    "@type":"RootIdea",
    "@view":"default",
    attachments:[
      {
        "@id":"local:Attachment/228",
        "@type":"IdeaAttachment",
        "@view":"default",
        attachmentPurpose:"EMBED_ATTACHMENT",
        creation_date:"2016-11-09T13:42:15.323096Z",
        document:{},
        external_url:"http://localhost:6543/data/Discussion/6/documents/406/data",
        idAttachedDocument:"local:Document/402",
        idCreator:"local:AgentProfile/1296",
        idObjectAttachedTo:"local:Idea/18",
        title:""
      }
    ],
    creationDate:"2017-01-20T16:01:29Z",
    extracts:[],
    hidden:false,
    is_tombstone:false,
    message_columns:[],
    messages_in_parent:true,
    numChildIdea:16,
    num_orphan_posts:55,
    num_synthesis_posts:8,
    num_total_and_read_posts:[765, 43, 0],
    order:null,
    original_uri:"local:Idea/56",
    parents:[],
    shortTitle:"Title 3",
    root:true,
    subtype:"assembl:RootIdea",
    widget_add_post_endpoint:{},
    widget_links:[]
  },
  {
    "@id":"local:Idea/98",
    "@type":"RootIdea",
    "@view":"default",
    attachments:[
      {
        "@id":"local:Attachment/229",
        "@type":"IdeaAttachment",
        "@view":"default",
        attachmentPurpose:"EMBED_ATTACHMENT",
        creation_date:"2016-11-09T13:42:15.323096Z",
        document:{},
        external_url:"http://localhost:6543/data/Discussion/6/documents/407/data",
        idAttachedDocument:"local:Document/402",
        idCreator:"local:AgentProfile/1296",
        idObjectAttachedTo:"local:Idea/18",
        title:""
      }
    ],
    creationDate:"2016-11-20T16:01:29Z",
    extracts:[],
    hidden:false,
    is_tombstone:false,
    message_columns:[],
    messages_in_parent:true,
    numChildIdea:16,
    num_orphan_posts:55,
    num_synthesis_posts:8,
    num_total_and_read_posts:[876, 13, 0],
    order:null,
    original_uri:"local:Idea/98",
    parents:[],
    shortTitle:"Title 4",
    root:true,
    subtype:"assembl:RootIdea",
    widget_add_post_endpoint:{},
    widget_links:[]
  },
  {
    "@id":"local:Idea/27",
    "@type":"RootIdea",
    "@view":"default",
    attachments:[
      {
        "@id":"local:Attachment/230",
        "@type":"IdeaAttachment",
        "@view":"default",
        attachmentPurpose:"EMBED_ATTACHMENT",
        creation_date:"2016-11-09T13:42:15.323096Z",
        document:{},
        external_url:"http://localhost:6543/data/Discussion/6/documents/408/data",
        idAttachedDocument:"local:Document/402",
        idCreator:"local:AgentProfile/1296",
        idObjectAttachedTo:"local:Idea/18",
        title:""
      }
    ],
    creationDate:"2015-08-20T16:01:29Z",
    extracts:[],
    hidden:false,
    is_tombstone:false,
    message_columns:[],
    messages_in_parent:true,
    numChildIdea:16,
    num_orphan_posts:55,
    num_synthesis_posts:8,
    num_total_and_read_posts:[876, 89, 0],
    order:null,
    original_uri:"local:Idea/27",
    parents:[],
    shortTitle:"Title 5",
    root:true,
    subtype:"assembl:RootIdea",
    widget_add_post_endpoint:{},
    widget_links:[]
  }
];

describe('This test concern ideas Service', () => {
  it('Should return the model built from API response', () => {
    const expectedResult = {
      latestIdeas: [
        {
          id:"38",
          imgUrl:"http://localhost:6543/data/Discussion/6/documents/405/data",
          title:"Title 2",
          nbPosts:231,
          nbContributors:67,
          definition:'Description de l\'idée'
        },
        {
          id:"56",
          imgUrl:"http://localhost:6543/data/Discussion/6/documents/406/data",
          title:"Title 3",
          nbPosts:765,
          nbContributors:43,
          definition:''
        },
        {
          id:"98",
          imgUrl:"http://localhost:6543/data/Discussion/6/documents/407/data",
          title:"Title 4",
          nbPosts:876,
          nbContributors:13,
          definition:''
        },
        {
          id:"27",
          imgUrl:"http://localhost:6543/data/Discussion/6/documents/408/data",
          title:"Title 5",
          nbPosts:876,
          nbContributors:89,
          definition:''
        }
      ],
      controversial: [
        {
          title: 'Intensifier l\'agriculture classique',
          nbUsers: 452,
          nbPosts: 216
        },
        {
          title: 'Laïcité et éducation',
          nbUsers: 387,
          nbPosts: 654
        },
        {
          title: 'Intensifier l\'agriculture biologique',
          nbUsers: 239,
          nbPosts: 643
        }
      ],
      longerThread: [
        {
          title: 'L\'étranger, une menace ou une chance ?',
          nbUsers: 452,
          nbPosts: 216
        },
        {
          title: 'Peut-on se moquer des croyances ?',
          nbUsers: 387,
          nbPosts: 654
        },
        {
          title: 'La liberté d\'expression peut-elle être limitée ?',
          nbUsers: 239,
          nbPosts: 643
        }
      ],
      topContributor: [
        {
          title: 'L\'idéologie écologiste est-elle une réponse adaptée ?',
          nbUsers: 452,
          nbPosts: 216
        },
        {
          title: 'Entraide scolaire et méthode',
          nbUsers: 387,
          nbPosts: 654
        },
        {
          title: 'L\'évasion fiscale',
          nbUsers: 239,
          nbPosts: 643
        }
      ],
      recentDiscussion: [
        {
          title: 'En faveur du vote blanc',
          nbUsers: 452,
          nbPosts: 216
        },
        {
          title: 'Un sujet polémique',
          nbUsers: 387,
          nbPosts: 654
        },
        {
          title: 'Un thème anthropologique et polémique',
          nbUsers: 239,
          nbPosts: 643
        }
      ]
    };
    const result = IdeasService.buildIdeas(mockApi);
    expect(result).toEqual(expectedResult);
  });
});