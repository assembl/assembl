import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import TextWithHeaderPage from '../components/common/textWithHeaderPage';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import TermsAndConditions from '../graphql/TermsAndConditions.graphql';

const mapStateToProps = (state) => {
  return {
    lang: state.i18n.locale
  };
};

const withData = graphql(TermsAndConditions, {
  props: ({ data }) => {
    if (data.loading) {
      return {
        loading: true
      };
    }

    return {
      loading: data.loading,
      text: data.legalNoticeAndTerms.termsAndConditions || '',
      headerTitle: I18n.t('termsAndConditions.headerTitle')
    };
  }
});

export default compose(connect(mapStateToProps), withData, withLoadingIndicator())(TextWithHeaderPage);