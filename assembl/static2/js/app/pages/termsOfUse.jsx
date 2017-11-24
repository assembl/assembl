import { graphql } from 'react-apollo';
import LargeTextParagraph from '../components/common/largeTextParagraph';
import TermsOfUseQuery from '../graphql/TermsOfUseQuery.graphql';

export default graphql(TermsOfUseQuery, {
  props: ({ data }) => {
    return {
      text: data.text,
      title: data.title
    };
  }
})(LargeTextParagraph);