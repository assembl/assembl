// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import type { OperationComponent, QueryProps } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import TextWithHeaderPage from '../components/common/textWithHeaderPage';
import CookiesSelector from '../components/cookies/cookiesSelector';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import LegalContents from '../graphql/LegalContents.graphql';
import type { State } from '../reducers/rootReducer';

type AdditionalProps = {
  text?: string,
  headerTitle?: string
};

const CookiesPolicy = ({ text, headerTitle, debateData }) => [
  <TextWithHeaderPage headerTitle={headerTitle} text={text} debateData={debateData} key="text-with-header" />,
  <CookiesSelector key="cookies-selector" />
];

export type Props = AdditionalProps & LegalContentsQuery & QueryProps;

const withData: OperationComponent<LegalContentsQuery, LegalContentsQueryVariables, Props> = graphql(
  LegalContents,
  {
    props: ({ data }) => {
      const text = data.legalContents ? data.legalContents.cookiesPolicy : '';
      return {
        ...data,
        text: text,
        headerTitle: I18n.t('cookiesPolicy.headerTitle')
      };
    }
  }
);

export const mapStateToProps: State => LegalContentsQueryVariables = state => ({
  lang: state.i18n.locale
});

export default compose(connect(mapStateToProps), withData, withLoadingIndicator())(CookiesPolicy);