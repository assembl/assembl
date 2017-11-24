import { graphql } from 'react-apollo';
import LargeTextParagraph from '../components/common/largeTextParagraph';
import LegalNoticeQuery from '../graphql/LegalNoticesQuery.graphql';

export default graphql(LegalNoticeQuery, {
  props: ({ data }) => {
    return {
      text: data.text,
      title: data.title
    };
  }
})(LargeTextParagraph);