// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';

import { get } from '../utils/routeMap';
import Section from '../components/common/section';
import SynthesesList from '../components/synthesis/synthesesList';
import SynthesesQuery from '../graphql/SynthesesQuery.graphql';
import manageErrorAndLoading from '../components/common/manageErrorAndLoading';
import type { SynthesisPost } from '../types.flow';

type SynthesesProps = {
  syntheses: Array<SynthesisPost>,
  slug: string,
  hasSyntheses: boolean,
  lang: string
};

export class DumbSyntheses extends React.Component<SynthesesProps> {
  // componentDidMount() {
  //   // redirect to synthesis if there is only one
  //   const { syntheses, slug } = this.props;
  //   if (syntheses && syntheses.length === 1) {
  //     const firstSynthesis = syntheses[0];
  //     browserHistory.push(`${get('synthesis', { synthesisId: firstSynthesis.post.id, slug: slug })}`);
  //   }
  // }

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