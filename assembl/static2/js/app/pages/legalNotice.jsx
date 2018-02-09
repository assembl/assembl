// @flow
import { compose, graphql } from 'react-apollo';
import type { OperationComponent, QueryProps } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import TextWithHeaderPage from '../components/common/textWithHeaderPage';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import LegalNoticeAndTerms from '../graphql/LegalNoticeAndTerms.graphql';
import type { State } from '../reducers/rootReducer';

export const mapStateToProps: State => LegalNoticeAndTermsQueryVariables = state => ({
  lang: state.i18n.locale
});

type AdditionalProps = {
  text?: string,
  headerTitle?: string
};

export type Props = AdditionalProps & LegalNoticeAndTermsQuery & QueryProps;

const withData: OperationComponent<LegalNoticeAndTermsQuery, LegalNoticeAndTermsQueryVariables, Props> = graphql(
  LegalNoticeAndTerms,
  {
    props: ({ data }) => {
      const text = data.legalNoticeAndTerms ? data.legalNoticeAndTerms.legalNotice : '';
      return {
        ...data,
        text: text,
        headerTitle: I18n.t('legalNotice.headerTitle')
      };
    }
  }
);

export default compose(connect(mapStateToProps), withData, withLoadingIndicator())(TextWithHeaderPage);