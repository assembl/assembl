// @flow
import * as React from 'react';
import { Col, Grid, Row } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import classNames from 'classnames';
import debounce from 'lodash/debounce';

import TopPostForm from './topPostForm';
import { hexToRgb } from '../../../utils/globalFunctions';
import { MIN_WIDTH_COLUMN, SMALL_SCREEN_HEIGHT } from '../../../constants';

type TopPostFormContainerProps = {
  bodyPlaceholderMsgId?: string,
  draftable: boolean,
  draftSuccessMsgId?: ?string,
  messageColumns: IdeaMessageColumns,
  fillBodyLabelMsgId?: string,
  filter: any,
  fullscreen: boolean,
  ideaId: string,
  isColumnViewInline: boolean,
  instructionLabelMsgId?: string,
  postSuccessMsgId?: string,
  refetchIdea: Function,
  showForm: boolean,
  hashtagFilter: any,
  topPostsCount: number
};

type TopPostFormContainerState = {
  sticky: boolean,
  expanded: boolean,
  topPostFormOffset: number
};

class DumbTopPostFormContainer extends React.Component<TopPostFormContainerProps, TopPostFormContainerState> {
  topPostFormContainer: ?HTMLDivElement;

  static defaultProps = {
    draftable: false,
    draftSuccessMsgId: null,
    fullscreen: false,
    hashtagFilter: null,
    filter: null,
    instructionLabelMsgId: 'debate.thread.startDiscussion',
    isColumnViewInline: false,
    messageColumns: [],
    showForm: true
  };

  constructor(props: TopPostFormContainerProps) {
    super(props);
    this.state = { sticky: false, expanded: false, topPostFormOffset: 0 };
  }

  componentWillMount() {
    window.addEventListener('scroll', this.setFormPosition);
  }

  componentWillReceiveProps() {
    if (this.topPostFormContainer) {
      this.setState({ topPostFormOffset: this.topPostFormContainer.offsetTop });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.setFormPosition);
  }

  setFormPosition = debounce(() => {
    if (!this.state.expanded) {
      if (this.state.topPostFormOffset <= window.pageYOffset && window.innerHeight > SMALL_SCREEN_HEIGHT) {
        this.setState({ sticky: true });
      } else {
        this.setState({ sticky: false });
      }
    }
  }, 100);

  getClassNames() {
    const { messageColumns, isColumnViewInline } = this.props;
    return classNames({ 'columns-view': messageColumns.length > 1 }, { 'columns-view-inline': isColumnViewInline });
  }

  setFormContainerRef = (el: ?HTMLDivElement) => {
    this.topPostFormContainer = el;
  };

  getColumnsInfos() {
    const { messageColumns } = this.props;
    let columnsInfos = [];
    if (messageColumns.length > 1) {
      columnsInfos = messageColumns;
    } else {
      columnsInfos.push({ messageClassifier: '', color: '', name: '' });
    }

    return columnsInfos;
  }

  render() {
    const {
      bodyPlaceholderMsgId,
      draftable,
      draftSuccessMsgId,
      fillBodyLabelMsgId,
      fullscreen,
      hashtagFilter,
      filter,
      ideaId,
      instructionLabelMsgId,
      isColumnViewInline,
      messageColumns,
      postSuccessMsgId,
      refetchIdea,
      showForm,
      topPostsCount
    } = this.props;
    const columnsInfos = this.getColumnsInfos();
    const containerClassNames = messageColumns.length <= 1 && topPostsCount >= 1 ? 'top-post-sticky' : '';
    const containerMdOffset = fullscreen ? 1 : 2;
    const formMdSize = fullscreen ? 7 : 5;
    if (!showForm && !hashtagFilter) {
      return null;
    }
    return (
      <div id="top-post-form" ref={this.setFormContainerRef} className={containerClassNames}>
        {showForm ? (
          <Grid fluid className={messageColumns.length > 1 ? '' : 'background-color'}>
            <div className="max-container">
              <Row>
                <div className={this.getClassNames()}>
                  {columnsInfos.map(column => (
                    <Col
                      xs={12}
                      md={12 / columnsInfos.length}
                      key={column.messageClassifier}
                      style={isColumnViewInline ? { width: MIN_WIDTH_COLUMN } : {}}
                    >
                      <div
                        className="top-post-form"
                        style={messageColumns.length > 1 ? { backgroundColor: `rgba(${hexToRgb(column.color)},0.2)` } : {}}
                      >
                        <Row>
                          <Col
                            xs={12}
                            sm={messageColumns.length > 1 ? 10 : 3}
                            md={messageColumns.length > 1 ? 10 : 2}
                            smOffset={messageColumns.length > 1 ? 1 : 1}
                            mdOffset={messageColumns.length > 1 ? 1 : containerMdOffset}
                            className="no-padding"
                          >
                            <div className="start-discussion-container">
                              <div className="start-discussion-icon">
                                <span className="assembl-icon-discussion color" />
                              </div>
                              <div
                                className={
                                  messageColumns.length > 1 ? 'start-discussion start-discussion-multicol' : 'start-discussion'
                                }
                              >
                                <h3 className="dark-title-3 no-margin">
                                  {messageColumns.length > 1 ? column.name : <Translate value={instructionLabelMsgId} />}
                                </h3>
                              </div>
                            </div>
                          </Col>
                          <Col
                            xs={12}
                            sm={messageColumns.length > 1 ? 9 : 6}
                            md={messageColumns.length > 1 ? 9 : formMdSize}
                            mdOffset={messageColumns.length > 1 ? 1 : 0}
                            className="no-padding"
                          >
                            <TopPostForm
                              onDisplayForm={(isActive) => {
                                this.setState({ sticky: !isActive, expanded: isActive });
                              }}
                              ideaId={ideaId}
                              refetchIdea={refetchIdea}
                              ideaOnColumn={messageColumns.length > 1}
                              messageClassifier={column.messageClassifier || null}
                              fillBodyLabelMsgId={fillBodyLabelMsgId}
                              bodyPlaceholderMsgId={bodyPlaceholderMsgId}
                              postSuccessMsgId={postSuccessMsgId}
                              draftable={draftable}
                              draftSuccessMsgId={draftSuccessMsgId}
                            />
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  ))}
                </div>
              </Row>
            </div>
          </Grid>
        ) : null}
        {hashtagFilter ? (
          <Grid
            fluid
            className={classNames(['background-grey', 'hashtag-filter-container'])}
            style={{ paddingTop: '20px', paddingBottom: '20px' }}
          >
            <div className="max-container">
              <Row>
                <Col xs={1} md={1} lg={1}>
                  &nbsp;
                </Col>
                <Col xs={8} md={6} lg={5}>
                  {hashtagFilter}
                </Col>
                <Col xs={2} md={3} lg={5}>
                  &nbsp;
                </Col>
                <Col xs={1} md={1} lg={1}>
                  {filter}
                </Col>
              </Row>
            </div>
          </Grid>
        ) : null}
      </div>
    );
  }
}

export default DumbTopPostFormContainer;