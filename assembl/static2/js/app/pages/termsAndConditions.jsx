// @flow
import { compose, graphql } from 'react-apollo';
import type { OperationComponent } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import TextWithHeaderPage from '../components/common/textWithHeaderPage';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import LegalNoticeAndTerms from '../graphql/LegalNoticeAndTerms.graphql';
import { mapStateToProps } from './legalNotice';
import type { Props } from './legalNotice';

const withData: OperationComponent<LegalNoticeAndTermsQuery, LegalNoticeAndTermsQueryVariables, Props> = graphql(
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