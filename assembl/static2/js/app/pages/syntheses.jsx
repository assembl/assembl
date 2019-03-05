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
    subject: 'Une jolie synthèse',
    creationDate: '02-03-2019',
    link: 'http://www.google.com',
    lang: 'fr',
    userCanEdit: true,
    userCanDelete: true,
    img: 'https://images.pexels.com/photos/1097456/pexels-photo-1097456.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500'
  },
  {
    id: '4524',
    subject: 'Une seconde synthèse',
    creationDate: '01-02-2019',
    link: 'http://www.google.com',
    lang: 'fr',
    userCanEdit: true,
    userCanDelete: true,
    img:
      'https://d2v9y0dukr6mq2.cloudfront.net/video/thumbnail/BKpZoQ4viqlda90c/abstract-dark-blue-background-with-moving-colored-particles_bjfoo46np__F0000.png'
  },
  {
    id: '4524',
    subject: 'Une troisième synthèse',
    creationDate: '01-02-2019',
    link: 'http://www.google.com',
    lang: 'fr',
    userCanEdit: true,
    userCanDelete: true,
    img: 'https://images.pexels.com/photos/1090977/pexels-photo-1090977.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500'
  },
  {
    id: '4524',
    subject: 'Une quatrième synthèse tant qu\'on y est',
    creationDate: '01-02-2019',
    link: 'http://www.google.com',
    lang: 'fr',
    userCanEdit: true,
    userCanDelete: true,
    img: 'https://images.pexels.com/photos/1895162/pexels-photo-1895162.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260'
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
    console.log('syntheses', syntheses);
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