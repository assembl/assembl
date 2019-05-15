// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Col, Grid, Row } from 'react-bootstrap';
import debounce from 'lodash/debounce';

import { renderSynthesisBody } from '../utils/linkify';
import Header from '../components/common/header';
import Section from '../components/common/section';
import SynthesisQuery from '../graphql/SynthesisQuery.graphql';
import manageErrorAndLoading from '../components/common/manageErrorAndLoading';
import IdeaSynthesisTree from '../components/synthesis/IdeaSynthesisTree';
import { getChildren, getPartialTree } from '../utils/tree';
import SideMenu from '../components/synthesis/sideMenu';
import { getDomElementOffset } from '../utils/globalFunctions';
import type { Synthesis } from '../components/synthesis/types.flow';

type SynthesisProps = {
  synthesis: Synthesis,
  routeParams: { slug: string, synthesisId: string },
  synthesisPostId: string
};

type SynthesisState = {
  introBlock: ?HTMLElement,
  conclusionBlock: ?HTMLElement,
  bodyBlock: ?HTMLElement,
  sideMenuNode: ?HTMLElement,
  sideMenuIsHidden: boolean,
  ideaOnScroll?: string,
  sideMenuHeight: number,
  sideMenuOverflow: string,
  setSideMenuHeight: string
};

const sideMenuTopPercentage = 15;

export class DumbSynthesis extends React.Component<SynthesisProps, SynthesisState> {
  constructor(props: SynthesisProps) {
    super(props);
    this.state = {
      introBlock: null,
      conclusionBlock: null,
      bodyBlock: null,
      sideMenuNode: null,
      sideMenuIsHidden: true,
      sideMenuHeight: 0,
      sideMenuOverflow: 'auto',
      setSideMenuHeight: '100%'
    };
  }

  componentWillMount() {
    window.addEventListener('scroll', this.updateSideMenuVisibility);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.updateSideMenuVisibility);
  }

  updateIntroBlock = (node: HTMLElement) => {
    this.setState({ introBlock: node });
  };

  updateConclusionBlock = (node: HTMLElement) => {
    this.setState({ conclusionBlock: node });
  };

  updateBodyBlock = (node: HTMLElement) => {
    this.setState({ bodyBlock: node });
  };

  updateSideMenuNode = (node: HTMLElement) => {
    this.setState({ sideMenuNode: node });
  };

  updateSideMenuVisibility = debounce(() => {
    const { introBlock, conclusionBlock, sideMenuNode } = this.state;
    if (introBlock && conclusionBlock) {
      const introNodeTop = getDomElementOffset(introBlock).top;
      const introNodeHeight = introBlock.getBoundingClientRect().height;
      const sideMenuHeight = sideMenuNode && sideMenuNode.getBoundingClientRect().height;
      if (sideMenuHeight && sideMenuHeight > 0) {
        this.setState({ sideMenuHeight: sideMenuHeight });
      }
      const conclusionBlockTopOffset = getDomElementOffset(conclusionBlock).top;
      const firstIdeaTopOffset = introNodeTop + introNodeHeight;
      const scroll = window.pageYOffset;
      const { innerHeight, innerWidth } = window;
      const sideMenuTopOffset = innerHeight * sideMenuTopPercentage / 100;
      // this value is the gap between the top of sideMenu and the top of the window set by the css 'top' property
      if (sideMenuHeight && sideMenuHeight + sideMenuTopOffset > innerHeight) {
        this.setState({ sideMenuOverflow: 'scroll', setSideMenuHeight: '80%' });
      }

      const hasScrollReachedSynthesis = scroll + 60 > firstIdeaTopOffset;
      // 60 corresponds to the gap between the first Idea and the introduction block (synthesis-tree's padding)
      const isBottomReached = scroll + sideMenuTopOffset + this.state.sideMenuHeight + 90 >= conclusionBlockTopOffset;
      // 90 corresponds to the gap between the top of the conclusion block and the top of its div (padding)

      if (isBottomReached || !hasScrollReachedSynthesis || innerWidth < 1000) {
        this.setState({ sideMenuIsHidden: true });
      } else {
        this.setState({ sideMenuIsHidden: false });
      }
    }
  }, 100);

  handleScrollForMenu = (node: HTMLElement) => {
    this.setState({ ideaOnScroll: node.id });
  };

  render() {
    const { synthesis, routeParams, synthesisPostId } = this.props;
    const { sideMenuIsHidden, ideaOnScroll, sideMenuOverflow, setSideMenuHeight } = this.state;
    const { introduction, conclusion, body, ideas, subject } = synthesis;
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
              <Section title="introduction" translate className="synthesis-block" innerRef={this.updateIntroBlock}>
                <Row>
                  <Col mdOffset={3} md={8} smOffset={1} sm={10}>
                    <div dangerouslySetInnerHTML={{ __html: introduction }} />
                  </Col>
                </Row>
              </Section>
            )}
            {body && (
              <Section title="" className="synthesis-block" innerRef={this.updateBodyBlock}>
                <Row>
                  <Col mdOffset={3} md={8} smOffset={1} sm={10}>
                    {renderSynthesisBody(body)}
                  </Col>
                </Row>
              </Section>
            )}
            <Row className="background-grey synthesis-tree">
              <Col
                md={3}
                className="affix"
                style={{
                  top: `${sideMenuTopPercentage} %`,
                  overflow: sideMenuOverflow,
                  height: setSideMenuHeight
                }}
              >
                <SideMenu
                  rootIdeas={roots}
                  descendants={descendants}
                  synthesisPostId={synthesisPostId}
                  ideaOnScroll={ideaOnScroll}
                  innerRef={this.updateSideMenuNode}
                  show={!sideMenuIsHidden}
                />
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
              <Section
                title="conclusion"
                translate
                className="synthesis-block"
                id="conclusion"
                innerRef={this.updateConclusionBlock}
              >
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
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      return {
        error: data.error,
        loading: data.loading,
        synthesis: data.synthesisPost.publishesSynthesis,
        synthesisPostId: data.synthesisPost.id
      };
    }
  }),
  manageErrorAndLoading({ displayLoader: true })
)(DumbSynthesis);