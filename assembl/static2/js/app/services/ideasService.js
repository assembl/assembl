import { xmlHttpRequest } from '../utils/httpRequestHandler';
import { getSortedArrayByKey } from '../utils/globalFunctions';

const getApiMock = (key) => {
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
};

const getLastIdeasByCreationDate = (ideas) => {
  const latestIdeas = [];
  const sortedIdeas = getSortedArrayByKey(ideas, 'creationDate').reverse();
  sortedIdeas.map((idea, index) => {
    if (index < 4) {
      const imgUrl = idea.attachments && idea.attachments.length ? idea.attachments[0].external_url : '';
      const nbPosts = idea.num_total_and_read_posts ? idea.num_total_and_read_posts[0] : 0;
      const nbContributors = idea.num_total_and_read_posts ? idea.num_total_and_read_posts[1] : 0;
      const title = idea.shortTitle ? idea.shortTitle : '';
      const definition = idea.definition ? idea.definition : '';
      const ideaId = idea['@id'].split('/')[1];
      return latestIdeas.push({
        id: ideaId,
        imgUrl: imgUrl,
        title: title,
        nbPosts: nbPosts,
        nbContributors: nbContributors,
        definition: definition
      });
    }
    return idea;
  });
  return latestIdeas;
};

export const buildIdeas = (ideas) => {
  return {
    latestIdeas: getLastIdeasByCreationDate(ideas),
    controversial: getApiMock('controversial'),
    longerThread: getApiMock('longerThread'),
    topContributor: getApiMock('topContributor'),
    recentDiscussion: getApiMock('recentDiscussion')
  };
};

export const getIdeas = (debateId) => {
  const fetchIdeasUrl = `/data/Discussion/${debateId}/ideas`;
  return xmlHttpRequest({ method: 'GET', url: fetchIdeasUrl }).then((ideas) => {
    return buildIdeas(ideas);
  });
};