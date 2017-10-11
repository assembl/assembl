import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import classNames from 'classnames';
import TopPostForm from './topPostForm';
import { hexToRgb } from '../../../utils/globalFunctions';
import { MIN_WIDTH_COLUMN } from '../../../constants';

class topPostFormContainer extends React.Component {
  isColumnViewInline() {
    const { messageColumns } = this.props;
    const screenWidth = window.innerWidth;
    const columnSize = screenWidth / messageColumns.length;
    if (columnSize < MIN_WIDTH_COLUMN) {
      return true;
    }
    return false;
  }
  getClassNames() {
    const { messageColumns } = this.props;
    return classNames({ 'columns-view': messageColumns.length > 0 }, { 'columns-view-inline': this.isColumnViewInline() });
  }
  getMessageColumns() {
    const { messageColumns } = this.props;
    let ideaOnColumns = [];
    if (messageColumns.length === 0) {
      ideaOnColumns.push(1);
    } else {
      ideaOnColumns = messageColumns;
    }
    return ideaOnColumns;
  }
  render() {
    const { ideaId, refetchIdea, messageColumns } = this.props;
    const ideaOnColumns = this.getMessageColumns();
    return (
      <Grid fluid className={messageColumns.length > 0 ? '' : 'background-color'}>
        <div className="max-container">
          <Row>
            <div className={this.getClassNames()}>
              {ideaOnColumns.map((column, index) => {
                return (
                  <Col
                    xs={12}
                    md={12 / ideaOnColumns.length}
                    key={`${column.messageClassifier}-${index}`}
                    className={messageColumns.length > 0 ? 'top-post-form-inline' : ''}
                    style={this.isColumnViewInline() ? { width: MIN_WIDTH_COLUMN } : {}}
                  >
                    <div className="top-post-form" style={{ backgroundColor: `rgba(${hexToRgb(column.color)},0.2)` }}>
                      <Row>
                        <Col
                          xs={12}
                          sm={messageColumns.length > 0 ? 10 : 3}
                          md={messageColumns.length > 0 ? 10 : 2}
                          smOffset={messageColumns.length > 0 ? 1 : 1}
                          mdOffset={messageColumns.length > 0 ? 1 : 2}
                          className="no-padding"
                        >
                          <div className="start-discussion-container">
                            <div
                              className={
                                messageColumns.length > 0
                                  ? 'start-discussion-icon start-discussion-icon-2'
                                  : 'start-discussion-icon'
                              }
                            >
                              <span className="assembl-icon-discussion color" />
                            </div>
                            <div
                              className={messageColumns.length > 0 ? 'start-discussion start-discussion-2' : 'start-discussion'}
                            >
                              <h3 className="dark-title-3 no-margin">
                                {messageColumns.length > 0 ? column.name : <Translate value="debate.thread.startDiscussion" />}
                              </h3>
                            </div>
                          </div>
                        </Col>
                        <Col
                          xs={12}
                          sm={messageColumns.length > 0 ? 10 : 7}
                          md={messageColumns.length > 0 ? 10 : 6}
                          mdOffset={messageColumns.length > 0 ? 1 : 0}
                          className="no-padding"
                        >
                          <TopPostForm
                            ideaId={ideaId}
                            refetchIdea={refetchIdea}
                            ideaOnColumn={messageColumns.length > 0}
                            messageClassifier={column.messageClassifier}
                          />
                        </Col>
                      </Row>
                    </div>
                  </Col>
                );
              })}
            </div>
          </Row>
        </div>
      </Grid>
    );
  }
}

export default topPostFormContainer;