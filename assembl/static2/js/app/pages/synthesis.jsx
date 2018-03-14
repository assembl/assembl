// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Col, Grid, Row } from 'react-bootstrap';

import Header from '../components/common/header';
import Section from '../components/common/section';
import SynthesisQuery from '../graphql/SynthesisQuery.graphql';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import IdeaSynthesisTree from '../components/synthesis/IdeaSynthesisTree';
import { getPartialTree, getChildren } from '../utils/tree';
import SideMenu from '../components/common/sideMenu';

type SynthesisProps = {
  synthesis: Object,
  routeParams: Object,
  synthesisPostId: string
};

export class DumbSynthesis extends React.Component<void, SynthesisProps, void> {
  props: SynthesisProps;

  render() {
    const { synthesis, routeParams, synthesisPostId } = this.props;
    const { introduction, conclusion, ideas, subject } = synthesis;
    const sortedIdeas = [...ideas].sort((a, b) => {
      if (a.live.order < b.live.order) {
        return -1;
      }
      if (a.live.order > b.live.order) {
        return 1;
      }
      return 0;
    });
    const { roots, descendants } = getPartialTree(sortedIdeas);
    const hasSiblings = roots.length > 1;
    return (
      <div className="synthesis-page">
        <div className="background-light">
          <Header title={subject} imgUrl={synthesis.img ? synthesis.img.externalUrl : ''} additionalHeaderClasses="left" />
          <Grid fluid>
            <SideMenu
              // TODO: find better names for these props
              rootIdeas={roots}
              descendants={descendants}
              synthesisPostId={synthesisPostId}
            />
            {introduction && (
              <Section title="introduction" translate className="synthesis-block">
                <Row>
                  <Col mdOffset={3} md={8} smOffset={1} sm={10}>
                    <div dangerouslySetInnerHTML={{ __html: introduction }} />
                  </Col>
                </Row>
              </Section>
            )}
            <Row className="background-grey synthesis-tree">
              <Col mdOffset={3} md={7} smOffset={1} sm={10}>
                {roots.map((rootIdea, index) => (
                  <IdeaSynthesisTree
                    hasSiblings={hasSiblings}
                    key={rootIdea.id}
                    rootIdea={rootIdea}
                    index={index + 1}
                    parents={[]}
                    subIdeas={getChildren(rootIdea, descendants)}
                    slug={routeParams.slug}
                  />
                ))}
              </Col>
            </Row>
            {conclusion && (
              <Section title="conclusion" translate className="synthesis-block">
                <Row>
                  <Col mdOffset={3} md={8} smOffset={1} sm={10}>
                    <div dangerouslySetInnerHTML={{ __html: conclusion }} />
                  </Col>
                </Row>
              </Section>
            )}
          </Grid>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  lang: state.i18n.locale
});

export default compose(
  connect(mapStateToProps),
  graphql(SynthesisQuery, {
    options: props => ({
      variables: { id: props.params.synthesisId, lang: props.lang }
    }),
    props: ({ data }) => {
      if (data.loading) {
        return { loading: true };
      }
      return {
        synthesis: data.synthesisPost.publishesSynthesis,
        synthesisPostId: data.synthesisPost.id
      };
    }
  }),
  withLoadingIndicator()
)(DumbSynthesis);