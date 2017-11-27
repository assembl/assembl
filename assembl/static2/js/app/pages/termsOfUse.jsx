import { graphql } from 'react-apollo';
import TextWithHeaderPage from '../components/common/textWithHeaderPage';
import TermsOfUseQuery from '../graphql/TermsOfUseQuery.graphql';

export default graphql(TermsOfUseQuery, {
  props: ({ data }) => {
    return {
      text: data.text,
      title: data.title
    };
  }
})(TextWithHeaderPage);