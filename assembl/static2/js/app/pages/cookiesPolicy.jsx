// @flow
import React, { Fragment } from 'react';
import { compose, graphql } from 'react-apollo';
import type { OperationComponent, QueryProps } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';

import TextWithHeaderPage from '../components/common/textWithHeaderPage';
import CookiesSelectorContainer from '../components/cookies/cookiesSelectorContainer';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import LegalContents from '../graphql/LegalContents.graphql';
import type { State } from '../reducers/rootReducer';

type AdditionalProps = {
  text?: string,
  headerTitle?: string
};

const CookiesPolicy = ({ text, headerTitle, debateData }) => (
  <div className="cookies-policy">
    <TextWithHeaderPage
      headerTitle={headerTitle}
      text={text}
      debateData={debateData}
      key="text-with-header"
      renderPageBody={() => (
        <Fragment>
          <CookiesSelectorContainer key="cookies-selector" />
          <h2 className="dark-title-2">
            <Translate value="cookiesPolicy.sectionTitle" />
          </h2>
          <div
            className="ellipsis-content justify"
            dangerouslySetInnerHTML={{
              __html: text
            }}
          />
        </Fragment>
      )}
    />
  </div>
);

export type Props = AdditionalProps & LegalContentsQuery & QueryProps;

const withData: OperationComponent<LegalContentsQuery, LegalContentsQueryVariables, Props> = graphql(LegalContents, {
  props: ({ data }) => {
    const text = data.legalContents ? data.legalContents.cookiesPolicy : '';
    return {
      ...data,
      text: text,
      headerTitle: I18n.t('cookiesPolicy.headerTitle')
    };
  }
});

export const mapStateToProps: State => LegalContentsQueryVariables = state => ({
  lang: state.i18n.locale
});

export default compose(connect(mapStateToProps), withData, withLoadingIndicator())(CookiesPolicy);