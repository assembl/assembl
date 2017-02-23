import HttpRequestHandler from '../utils/httpRequestHandler';
import GlobalFunctions from '../utils/globalFunctions';

class IdeasService {
  static fetchIdeas(debateId) {
    const that = this;
    const fetchIdeasUrl = `/data/Discussion/${debateId}/ideas`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchIdeasUrl }).then((ideas) => {
      return that.buildIdeas(ideas);
    });
  }
  static buildIdeas(ideas) {
    return {
      latestIdeas: this.getLastIdeasByCreationDate(ideas),
      controversial: this.getApiMock('controversial'),
      longerThread: this.getApiMock('longerThread'),
      topContributor: this.getApiMock('topContributor'),
      recentDiscussion: this.getApiMock('recentDiscussion')
    };
  }
  static getLastIdeasByCreationDate(ideas) {
    const latestIdeas = [];
    const sortedDate = GlobalFunctions.getSortedDate(ideas, 'creationDate');
    ideas.map((idea) => {
      const ideaDate = new Date(idea.creationDate);
      for (let i = 1; i <= 4; i += 1) {
        if (sortedDate[sortedDate.length - i] === ideaDate.valueOf()) {
          const imgUrl = idea.attachments ? idea.attachments[0].external_url : '';
          const nbPosts = idea.num_total_and_read_posts ? idea.num_total_and_read_posts[0] : 0;
          const title = idea.shortTitle ? idea.shortTitle : '';
          const ideaId = idea['@id'].split('/')[1];
          return latestIdeas.push({
            id: ideaId,
            imgUrl: imgUrl,
            title: title,
            nbPosts: nbPosts
          });
        }
      }
      return ideaDate;
    });
    return latestIdeas;
  }
  static getApiMock(key) {
    const mock = {
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
    return mock[key];
  }
}

export default IdeasService;