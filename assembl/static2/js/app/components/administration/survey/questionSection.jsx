import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { Row, Col } from 'react-bootstrap';

import MediaForm from './mediaForm';
import QuestionsForm from './questionsForm';
import SectionTitle from '../sectionTitle';

class QuestionSection extends React.Component {
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
    const { editLocale, thematics } = this.props;
    const selectedThematicId = this.state.selectedThematicId;
    return (
      <div className="admin-box">
        <SectionTitle title={I18n.t('administration.survey.1')} annotation={I18n.t('administration.annotation')} />
        <div className="admin-content">
          <Row>
            {thematics.map((thematicId, index) => {
              const linkClassName = selectedThematicId === thematicId ? 'tab-title-active ellipsis' : 'tab-title ellipsis';
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
          {selectedThematicId && (
            <Row>
              <MediaForm
                key={`media-form-${selectedThematicId}-${editLocale}`}
                thematicId={selectedThematicId}
                editLocale={editLocale}
              />
              <QuestionsForm
                key={`questions-form-${selectedThematicId}-${editLocale}`}
                thematicId={selectedThematicId}
                editLocale={editLocale}
              />
            </Row>
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ admin: { thematicsById, thematicsInOrder, editLocale } }) => ({
  thematics: thematicsInOrder.filter(id => !thematicsById.getIn([id, 'toDelete'])).toArray(),
  editLocale: editLocale
});

export default connect(mapStateToProps)(QuestionSection);