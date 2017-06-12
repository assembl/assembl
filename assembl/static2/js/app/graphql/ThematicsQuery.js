import { gql } from 'react-apollo';

const ThematicsQuery = gql`
{
  thematics(identifier:"survey") {
    id
  }
}
`;

export default ThematicsQuery;