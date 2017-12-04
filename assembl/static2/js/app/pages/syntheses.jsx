// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Link, browserHistory } from 'react-router';
import { Localize, Translate } from 'react-redux-i18n';

import { get } from '../utils/routeMap';
import { CLASS_NAME_GENERATOR } from '../utils/cardList';
import Section from '../components/common/section';
import Card from '../components/common/card';
import CardList from '../components/common/cardList';
import SynthesesQuery from '../graphql/SynthesesQuery.graphql';

import withLoadingIndicator from '../components/common/withLoadingIndicator';

type SynthesesProps = {
  syntheses: Array<Object>,
  slug: string,
  hasSyntheses: boolean
};

export class DumbSyntheses extends React.Component<void, SynthesesProps, void> {
  props: SynthesesProps;
  componentDidMount() {
    const { syntheses, slug } = this.props;
    if (syntheses.length === 1) {
      const firstSynthesis = syntheses[0];
      browserHistory.push(`${get('synthesis', { synthesisId: firstSynthesis.post.id, slug: slug })}`);
    }
  }
  render() {
    const { syntheses, slug, hasSyntheses } = this.props;
    return (
      <Section title="debate.syntheses" translate>
        {!hasSyntheses ? (
          <h2 className="dark-title-2 margin-left-xxl">
            <Translate value="synthesis.noSynthesisYet" />
          </h2>
        ) : (
          <CardList
            data={syntheses}
            classNameGenerator={CLASS_NAME_GENERATOR.default}
            itemClassName="theme"
            CardItem={(itemData) => {
              return (
                <Card imgUrl={itemData.img ? itemData.img.externalUrl : ''} className="synthesis-preview">
                  <Link className="content-box" to={`${get('synthesis', { synthesisId: itemData.post.id, slug: slug })}`}>
                    <div className="title-container center">
                      <h3 className="light-title-3">{itemData.subject}</h3>
                      <h4 className="light-title-4">
                        <Localize value={itemData.creationDate} dateFormat="date.format2" />
                      </h4>
                    </div>
                  </Link>
                </Card>
              );
            }}
          />
        )}
      </Section>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    lang: state.i18n.locale,
    slug: state.debate.debateData.slug
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(SynthesesQuery, {
    props: ({ data }) => {
      if (data.loading) {
        return { loading: true };
      }
      return {
        syntheses: data.syntheses,
        hasSyntheses: data.syntheses.length > 0
      };
    }
  }),
  withLoadingIndicator()
)(DumbSyntheses);