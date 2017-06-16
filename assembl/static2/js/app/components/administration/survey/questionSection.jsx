import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { Row, Col } from 'react-bootstrap';

import VideoForm from './videoForm';
import QuestionsForm from './questionsForm';
import SectionTitle from '../sectionTitle';

export class QuestionSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedThematicId: props.thematics ? props.thematics[0] : ''
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!this.state.selectedThematicId) {
      this.setState({
        selectedThematicId: nextProps.thematics ? nextProps.thematics[0] : ''
      });
    }
  }

  render() {
    const { i18n, selectedLocale, thematics } = this.props;
    const selectedThematicId = this.state.selectedThematicId;
    return (
      <div className="admin-box">
        <SectionTitle i18n={i18n} phase="survey" tabId="1" annotation={I18n.t('administration.annotation')} />
        <div className="admin-content">
          <Row>
            {thematics.map((thematicId, index) => {
              const linkClassName = selectedThematicId === thematicId ? 'tab-title-active' : 'tab-title';
              return (
                <Col xs={12} md={Math.round(12 / thematics.length)} key={index}>
                  <a
                    className={linkClassName}
                    key={thematicId}
                    onClick={() => {
                      this.setState({ selectedThematicId: thematicId });
                    }}
                  >
                    {`${I18n.t('administration.thematic')} ${index + 1}`}
                  </a>
                </Col>
              );
            })}
          </Row>
          {selectedThematicId &&
            <Row>
              <VideoForm thematicId={selectedThematicId} selectedLocale={selectedLocale} />
              <QuestionsForm thematicId={selectedThematicId} selectedLocale={selectedLocale} />
            </Row>}
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ admin: { thematicsById, thematicsInOrder } }) => {
  return {
    thematics: thematicsInOrder
      .filter((id) => {
        return !thematicsById.getIn([id, 'toDelete']);
      })
      .toArray()
  };
};

export default connect(mapStateToProps)(QuestionSection);