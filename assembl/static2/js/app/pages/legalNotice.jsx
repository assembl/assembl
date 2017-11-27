import { graphql } from 'react-apollo';
import TextWithHeaderPage from '../components/common/textWithHeaderPage';
import LegalNoticeQuery from '../graphql/LegalNoticesQuery.graphql';

export default graphql(LegalNoticeQuery, {
  props: ({ data }) => {
    return {
      text: data.text,
      title: data.title
    };
  }
})(TextWithHeaderPage);