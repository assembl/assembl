// @flow
import * as React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import classNames from 'classnames';
import TopPostForm from './topPostForm';
import { hexToRgb } from '../../../utils/globalFunctions';
import { MIN_WIDTH_COLUMN, SMALL_SCREEN_HEIGHT } from '../../../constants';

type TopPostFormContainerProps = {
  messageColumns: Object,
  isColumnViewInline: boolean,
  ideaId: string,
  refetchIdea: Function,
  topPostsCount: number,
  instructionLabel: string,
  fillBodyLabel: string,
  bodyPlaceholder: string,
  postSuccessMsg: string
};

type TopPostFormContainerState = {
  sticky: boolean,
  expanded: boolean,
  topPostFormOffset: number
};

class TopPostFormContainer extends React.Component<TopPostFormContainerProps, TopPostFormContainerState> {
  setFormContainerRef: () => void;

  setFormPosition: () => void;

  topPostFormContainer: () => void;

  static defaultProps = {
    instructionLabel: 'debate.thread.startDiscussion'
  };

  constructor(props: TopPostFormContainerProps) {
    super(props);
    this.setFormContainerRef = this.setFormContainerRef.bind(this);
    this.setFormPosition = this.setFormPosition.bind(this);
    this.state = { sticky: false, expanded: false, topPostFormOffset: 0 };
  }

  componentWillMount() {
    window.addEventListener('scroll', this.setFormPosition);
  }

  componentWillReceiveProps() {
    this.setState({ topPostFormOffset: this.topPostFormContainer.offsetTop });
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.setFormPosition);
  }

  setFormPosition() {
    if (!this.state.expanded) {
      if (this.state.topPostFormOffset <= window.pageYOffset && window.innerHeight > SMALL_SCREEN_HEIGHT) {
        this.setState({ sticky: true });
      } else {
        this.setState({ sticky: false });
      }
    }
  }

  getClassNames() {
    const { messageColumns = [], isColumnViewInline } = this.props;
    return classNames({ 'columns-view': messageColumns.length > 1 }, { 'columns-view-inline': isColumnViewInline });
  }

  setFormContainerRef(el: Object) {
    this.topPostFormContainer = el;
  }

  getColumnsInfos() {
    const { messageColumns = [] } = this.props;
    let columnsInfos = [];
    if (messageColumns.length > 1) {
      columnsInfos = messageColumns;
    } else {
      columnsInfos.push({ messageClassifier: '', color: '', name: '' });
    }

    return columnsInfos;
  }

  render() {
    const { ideaId, refetchIdea, messageColumns = [], isColumnViewInline, topPostsCount,
      instructionLabel, fillBodyLabel, bodyPlaceholder, postSuccessMsg } = this.props;
    const columnsInfos = this.getColumnsInfos();
    const { sticky } = this.state;
    const containerClassNames = sticky && messageColumns.length <= 1 && topPostsCount >= 1 ? 'top-post-sticky' : '';

    return (
      <div id="top-post-form" ref={this.setFormContainerRef} className={containerClassNames}>
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
                          mdOffset={messageColumns.length > 1 ? 1 : 2}
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
                                {messageColumns.length > 1 ? column.name : <Translate value={instructionLabel} />}
                              </h3>
                            </div>
                          </div>
                        </Col>
                        <Col
                          xs={12}
                          sm={messageColumns.length > 1 ? 10 : 7}
                          md={messageColumns.length > 1 ? 10 : 6}
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
                            fillBodyLabel={fillBodyLabel}
                            bodyPlaceholder={bodyPlaceholder}
                            postSuccessMsg={postSuccessMsg}
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
      </div>
    );
  }
}

export default TopPostFormContainer;