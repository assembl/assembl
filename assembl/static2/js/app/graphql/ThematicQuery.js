import { gql } from 'react-apollo';

const ThematicQuery = gql`
  query ThematicQuery($id: ID!) {
    thematic: node(id: $id) {
      ... on Thematic {
        titleEntries {
          localeCode,
          value
        },
        imgUrl,
        video {
          titleEntries {
            localeCode,
            value
          },
          descriptionEntries {
            localeCode,
            value
          },
          htmlCode
        },
        questions {
          titleEntries {
            localeCode,
            value
          }
        }
      }
    }
  }
`;

export default ThematicQuery;