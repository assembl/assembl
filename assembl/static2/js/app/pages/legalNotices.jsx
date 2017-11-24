import { graphql } from 'react-apollo';
import LargeTextParagraph from '../components/common/largeTextParagraph';
import LegalNoticesQuery from '../graphql/LegalNoticesQuery.graphql';

export default graphql(LegalNoticesQuery, {
  props: ({ data }) => {
    return {
      text: data.text,
      title: data.title
    };
  }
})(LargeTextParagraph);