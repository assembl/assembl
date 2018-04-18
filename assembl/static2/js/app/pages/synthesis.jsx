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
import SideMenu from '../components/synthesis/sideMenu';
import { getDomElementOffset } from '../utils/globalFunctions';

type SynthesisProps = {
  synthesis: Object,
  routeParams: RouterParams,
  synthesisPostId: string
};

type SynthesisState = {
  node: ?HTMLElement,
  sideMenuIsHidden: boolean,
  ideaOnScroll?: string
};

export class DumbSynthesis extends React.Component<void, SynthesisProps, SynthesisState> {
  props: SynthesisProps;

  state: SynthesisState;

  constructor(props: SynthesisProps) {
    super(props);
    this.state = {
      introNode: null,
      conclusionNode: null,
      sideMenuNode: null,
      sideMenuIsHidden: true
    };
  }

  componentWillMount() {
    window.addEventListener('scroll', this.updateTopOnScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.updateTopOnScroll);
  }

  updateTop = (node: HTMLElement) => {
    this.setState({ introNode: node });
  };

  updateBottom = (node: HTMLElement) => {
    this.setState({ conclusionNode: node });
  }

  updateSideMenuNode = (node: HTMLElement) => {
    console.log('node', node);
    this.setState({ sideMenuNode: node });
  }

  updateTopOnScroll = () => {
    const { introNode, conclusionNode, sideMenuNode } = this.state;
    console.log('sideMenuNode', sideMenuNode);
    if (introNode && conclusionNode) {
      const introNodeTop = getDomElementOffset(introNode).top;
      const introNodeHeight = introNode.getBoundingClientRect().height;
      const sideMenuHeight = sideMenuNode && sideMenuNode.getBoundingClientRect().height;

      const conclusionNodeTopOffset = getDomElementOffset(conclusionNode).top;

      const total = introNodeTop + introNodeHeight;
      const scroll = window.pageYOffset;
      const windowHeight = window.innerHeight;
      const sideMenuTop = ((1800 - windowHeight) / 50);
      this.setState({ sideMenuTop: sideMenuTop });
      // console.log('scroll: ', scroll, '| body.scrollHeight: ', body.scrollHeight, '| screen.height: ', screen.height, '| windowHeight: ', window.innerHeight, '| footer.offsetHeight: ', footer.offsetHeight, '| conclusionHeight: ', conclusionHeight);

      if ((scroll + (sideMenuTop / 100) * windowHeight + sideMenuHeight + 90) >= (conclusionNodeTopOffset) || scroll + 50 < total) {
        // 50 corresponds to the gap between the first Idea and the introduction
        // 90 corresponds to the gap between the top of the conclusion node and the top of its div
        this.setState({ sideMenuIsHidden: true });
      } else {
        this.setState({ sideMenuIsHidden: false });
      }
    }
  };

  handleScrollForMenu = (node: HTMLElement) => {
    this.setState({ ideaOnScroll: node.id });
  };

  render() {
    const { synthesis, routeParams, synthesisPostId } = this.props;
    const { sideMenuIsHidden, ideaOnScroll, sideMenuTop } = this.state;
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
          <Header title={subject} imgUrl={synthesis.img ? synthesis.img.externalUrl : ''} type="synthesis" />
          <Grid fluid>
            {introduction && (
              <Section title="introduction" translate className="synthesis-block" innerRef={this.updateTop}>
                <Row>
                  <Col mdOffset={3} md={8} smOffset={1} sm={10}>
                    <div dangerouslySetInnerHTML={{ __html: introduction }} />
                  </Col>
                </Row>
              </Section>
            )}
            <Row className="background-grey synthesis-tree">
              <Col md={3} className="affix" style={{ top: `${sideMenuTop}%` }}>
                {!sideMenuIsHidden && (
                  <SideMenu
                    rootIdeas={roots}
                    descendants={descendants}
                    synthesisPostId={synthesisPostId}
                    ideaOnScroll={ideaOnScroll}
                    innerRef={this.updateSideMenuNode}
                  />
                )}
              </Col>
              <Col mdOffset={3} md={8} sm={11}>
                {roots.map((rootIdea, index) => (
                  <IdeaSynthesisTree
                    hasSiblings={hasSiblings}
                    key={rootIdea.id}
                    rootIdea={rootIdea}
                    index={index + 1}
                    parents={[]}
                    subIdeas={getChildren(rootIdea, descendants)}
                    slug={routeParams.slug}
                    handleScrollForMenu={this.handleScrollForMenu}
                  />
                ))}
              </Col>
            </Row>
            {conclusion && (
              <Section title="conclusion" translate className="synthesis-block" id="conclusion" innerRef={this.updateBottom}>
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