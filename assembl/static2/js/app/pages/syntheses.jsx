// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Link } from 'react-router';
import { I18n, Translate } from 'react-redux-i18n';

import { get } from '../utils/routeMap';
import Section from '../components/common/section';
import SynthesesList from '../components/synthesis/synthesesList';
import SynthesesQuery from '../graphql/SynthesesQuery.graphql';
import manageErrorAndLoading from '../components/common/manageErrorAndLoading';
import { DELETE_CALLBACK } from '../constants';
import { displayAlert } from '../utils/utilityManager';
import type { SynthesisPost } from '../types.flow';

type SynthesesProps = {
  syntheses: Array<SynthesisPost>,
  slug: string,
  hasSyntheses: boolean,
  lang: string,
  location: { state: { callback: string } }
};

export class DumbSyntheses extends React.Component<SynthesesProps> {
  componentDidMount() {
    this.displayDeleteMessage();
  }

  displayDeleteMessage() {
    // Location state is set in brightMirrorFiction.jsx > deleteFictionCallback
    const locationState = this.props.location.state;
    if (locationState && locationState.callback === DELETE_CALLBACK) {
      displayAlert('success', I18n.t('debate.syntheses.deleteSuccessMessage'));
    }
  }

  render() {
    const { syntheses, slug, hasSyntheses, lang } = this.props;
    const createSynthesisRoute = get('createSynthesis', { slug: slug });
    const updateSynthesesQuery = {
      query: SynthesesQuery,
      variables: {
        lang: lang
      }
    };
    const refetchQueries = [updateSynthesesQuery];

    return (
      <Section title="debate.syntheses.summary" translate>
        <div className="center create-synthesis-button">
          <Link to={createSynthesisRoute} className="button-submit button-dark">
            <Translate value="debate.syntheses.createNewSynthesis" />
          </Link>
        </div>
        {!hasSyntheses ? (
          <h2 className="dark-title-2 margin-left-xxl">
            <Translate value="synthesis.noSynthesisYet" />
          </h2>
        ) : (
          <SynthesesList syntheses={syntheses} refetchQueries={refetchQueries} />
        )}
      </Section>
    );
  }
}

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  slug: state.debate.debateData.slug
});

export default compose(
  connect(mapStateToProps),
  graphql(SynthesesQuery, {
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        syntheses: data.syntheses,
        hasSyntheses: data && data.syntheses ? data.syntheses.length > 0 : false
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: true })
)(DumbSyntheses);