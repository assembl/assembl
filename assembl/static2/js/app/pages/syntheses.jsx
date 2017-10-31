// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Link, browserHistory } from 'react-router';
import { Localize } from 'react-redux-i18n';

import { get } from '../utils/routeMap';
import { CLASS_NAME_GENERATOR } from '../utils/cardList';
import Loader from '../components/common/loader';
import Section from '../components/common/section';
import Card from '../components/common/card';
import CardList from '../components/common/cardList';
import SynthesesQuery from '../graphql/SynthesesQuery.graphql';

type SynthesesProps = {
  data: Object,
  slug: string
};

export class DumbSyntheses extends React.Component<void, SynthesesProps, void> {
  props: SynthesesProps;

  render() {
    const { data, slug } = this.props;
    if (data.loading) {
      return <Loader color="black" />;
    }
    const { syntheses } = data;
    if (syntheses.length === 1) {
      const firstSynthesis = syntheses[0];
      browserHistory.push(`${get('synthesis', { synthesisId: firstSynthesis.id, slug: slug })}`);
    }
    return (
      <div className="debate">
        <Section title="debate.syntheses">
          <CardList
            data={syntheses}
            classNameGenerator={CLASS_NAME_GENERATOR.default}
            itemClassName="theme"
            CardItem={(itemData) => {
              return (
                <Card imgUrl={itemData.imgUrl} className="synthesis-preview">
                  <Link className="content-box" to={`${get('synthesis', { synthesisId: itemData.id, slug: slug })}`}>
                    <div className="title-container center">
                      <h3 className="light-title-3">
                        {itemData.subject}
                      </h3>
                      <h4 className="light-title-4">
                        <Localize value={itemData.creationDate} dateFormat="date.format2" />
                      </h4>
                    </div>
                  </Link>
                </Card>
              );
            }}
          />
        </Section>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    lang: state.i18n.locale,
    slug: state.debate.debateData.slug
  };
};

export default compose(connect(mapStateToProps), graphql(SynthesesQuery))(DumbSyntheses);