import React from 'react';
import { Grid, Row, Col } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import TopPostForm from './topPostForm';

// const mockMessageColumns = [];

const mockMessageColumns = [
  {
    color: '#e2f8e5',
    identifier: 'positive',
    name: 'Ajouter votre point de vue en faveur du thème'
  },
  {
    color: '#ccc',
    identifier: 'negative',
    name: 'Ajouter votre point de vue en défaveur du thème'
  },
  {
    color: '#f9ebeb',
    identifier: 'negative',
    name: 'Ajouter votre point de vue en défaveur du thème'
  }
];

class topPostFormContainer extends React.Component {
  getMessageColumns() {
    let ideaOnColumns = [];
    if (mockMessageColumns.length === 0) {
      ideaOnColumns.push(1);
    } else {
      ideaOnColumns = mockMessageColumns;
    }
    return ideaOnColumns;
  }
  render() {
    const { idea, refetchIdea } = this.props;
    const ideaOnColumns = this.getMessageColumns();
    return (
      <Grid fluid className={mockMessageColumns.length > 0 ? '' : 'background-color'}>
        <div className="max-container">
          <Row>
            {ideaOnColumns.map((column, index) => {
              return (
                <Col
                  xs={12}
                  md={12 / ideaOnColumns.length}
                  style={{ backgroundColor: column.color }}
                  key={`${column.identifier}-${index}`}
                >
                  <div className="top-post-form">
                    <Row>
                      <Col
                        xs={12}
                        sm={mockMessageColumns.length > 0 ? 10 : 3}
                        md={mockMessageColumns.length > 0 ? 10 : 2}
                        smOffset={mockMessageColumns.length > 0 ? 1 : 1}
                        mdOffset={mockMessageColumns.length > 0 ? 1 : 2}
                        className="no-padding"
                      >
                        <div className="start-discussion-container">
                          <div
                            className={
                              mockMessageColumns.length > 0
                                ? 'start-discussion-icon start-discussion-icon-2'
                                : 'start-discussion-icon'
                            }
                          >
                            <span className="assembl-icon-discussion color" />
                          </div>
                          <div
                            className={mockMessageColumns.length > 0 ? 'start-discussion start-discussion-2' : 'start-discussion'}
                          >
                            <h3 className="dark-title-3 no-margin">
                              {mockMessageColumns.length > 0 ? column.name : <Translate value="debate.thread.startDiscussion" />}
                            </h3>
                          </div>
                        </div>
                      </Col>
                      <Col
                        xs={12}
                        sm={mockMessageColumns.length > 0 ? 10 : 7}
                        md={mockMessageColumns.length > 0 ? 10 : 6}
                        mdOffset={mockMessageColumns.length > 0 ? 1 : 0}
                        className="no-padding"
                      >
                        <TopPostForm ideaId={idea.id} refetchIdea={refetchIdea} ideaOnColumn={mockMessageColumns.length > 0} />
                      </Col>
                    </Row>
                  </div>
                </Col>
              );
            })}
          </Row>
        </div>
      </Grid>
    );
  }
}

export default topPostFormContainer;