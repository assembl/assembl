import { graphql } from 'react-apollo';
import LargeTextParagraph from '../components/common/largeTextParagraph';
import TermsQuery from '../graphql/LegalNoticesQuery.graphql';

export default graphql(TermsQuery, {
  props: ({ data }) => {
    return {
      text: data.text,
      title: data.title
    };
  }
})(LargeTextParagraph);