// @flow
import { compose, graphql } from 'react-apollo';
import type { OperationComponent, QueryProps } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import TextWithHeaderPage from '../components/common/textWithHeaderPage';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import LegalNoticeAndTerms from '../graphql/TermsAndLegalNotice.graphql';
import type { RootReducer } from '../reducers/rootReducer';

const mapStateToProps: RootReducer => TermsAndConditionsQueryVariables = (state) => {
  return {
    lang: state.i18n.locale
  };
};

type Response = {
  text?: string,
  headerTitle?: string
};

type Props = Response | QueryProps;

const withData: OperationComponent<TermsAndConditionsQuery, TermsAndConditionsQueryVariables, Props> = graphql(
  LegalNoticeAndTerms,
  {
    props: ({ data }) => {
      const text = data.legalNoticeAndTerms ? data.legalNoticeAndTerms.termsAndConditions : '';
      return {
        ...data,
        text: text,
        headerTitle: I18n.t('termsAndConditions.headerTitle')
      };
    }
  }
);

export default compose(connect(mapStateToProps), withData, withLoadingIndicator())(TextWithHeaderPage);