// @flow
import { compose, graphql } from 'react-apollo';
import type { OperationComponent, QueryProps } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import TextWithHeaderPage from '../components/common/textWithHeaderPage';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import LegalContents from '../graphql/LegalContents.graphql';
import type { State } from '../reducers/rootReducer';


type AdditionalProps = {
  text?: string,
  headerTitle?: string
};

export type Props = AdditionalProps & LegalContentsQuery & QueryProps;

const withData: OperationComponent<LegalContentsQuery, LegalContentsQueryVariables, Props> = graphql(
  LegalContents,
  {
    props: ({ data }) => {
      const text = data.legalContents ? data.legalContents.userGuidelines : '';
      return {
        ...data,
        text: text,
        headerTitle: I18n.t('userGuidelines.headerTitle')
      };
    }
  }
);

export const mapStateToProps: State => LegalContentsQueryVariables = state => ({
  lang: state.i18n.locale
});

export default compose(connect(mapStateToProps), withData, withLoadingIndicator())(TextWithHeaderPage);