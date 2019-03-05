// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Link } from 'react-router';
import { Localize, Translate } from 'react-redux-i18n';

import { get } from '../utils/routeMap';
import { browserHistory } from '../router';
import { CLASS_NAME_GENERATOR } from '../utils/cardList';
import Section from '../components/common/section';
import Card from '../components/common/card';
import SynthesesList from '../components/synthesis/synthesesList';
import SynthesesQuery from '../graphql/SynthesesQuery.graphql';

import manageErrorAndLoading from '../components/common/manageErrorAndLoading';

type SynthesesProps = {
  syntheses: Array<Object>,
  slug: string,
  hasSyntheses: boolean
};

const fakeSyntheses = [
  {
    id: '1234',
    title: 'Une jolie synthèse',
    subTitle: 'Cette synthèse est fort bien écrite',
    creationDate: '02-03-2019',
    link: 'http://www.google.com',
    lang: 'fr',
    userCanEdit: true,
    userCanDelete: true,
    imageUrl: 'https://start.lesechos.fr/images/2017/07/11/8856_1499784814_felix-simplon.jpg'
  },
  {
    id: '4524',
    title: 'Une seconde synthèse',
    subTitle: 'Cette synthèse est bif bof on va pas se mentir on est entre adultes',
    creationDate: '01-02-2019',
    link: 'http://www.google.com',
    lang: 'fr',
    userCanEdit: true,
    userCanDelete: true,
    imageUrl: 'https://start.lesechos.fr/images/2017/07/11/8856_1499784814_felix-simplon.jpg'
  }
];

export class DumbSyntheses extends React.Component<SynthesesProps> {
  componentDidMount() {
    const { syntheses, slug } = this.props;
    if (syntheses && syntheses.length === 1) {
      const firstSynthesis = syntheses[0];
      browserHistory.push(`${get('synthesis', { synthesisId: firstSynthesis.post.id, slug: slug })}`);
    }
  }

  render() {
    const { syntheses, slug, hasSyntheses } = this.props;
    return (
      <Section title="debate.syntheses.summary" translate>
        <div className="center create-synthesis">
          <Link className="button-submit button-dark">
            <Translate value="debate.syntheses.createNewSynthesis" />
          </Link>
        </div>
        {!hasSyntheses ? (
          <h2 className="dark-title-2 margin-left-xxl">
            <Translate value="synthesis.noSynthesisYet" />
          </h2>
        ) : (
          <SynthesesList syntheses={fakeSyntheses} />
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