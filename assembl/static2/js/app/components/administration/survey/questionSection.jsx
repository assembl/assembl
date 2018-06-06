import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { Row, Col } from 'react-bootstrap';
import { getEntryValueForLocale } from '../../../utils/i18n';

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
    const { editLocale, thematics, thematicsById } = this.props;

    const selectedThematicId = this.state.selectedThematicId;
    return (
      <div className="admin-box">
        <SectionTitle title={I18n.t('administration.survey.1')} annotation={I18n.t('administration.annotation')} />
        <div className="admin-content">
          <Row>
            {thematics.map((thematicId, index) => {
              const thematic = thematicsById.get(thematicId);
              const thematicTitle = getEntryValueForLocale(thematic.get('titleEntries'), editLocale);
              const linkClassNames = selectedThematicId === thematicId ? 'tab-title-active ellipsis' : 'tab-title ellipsis';
              return (
                <Col xs={12} md={Math.round(12 / thematics.length)} key={index}>
                  <a
                    className={linkClassNames}
                    key={thematicId}
                    onClick={() => {
                      this.setState({ selectedThematicId: thematicId });
                    }}
                  >
                    {thematicTitle}
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

const mapStateToProps = ({ admin: { thematicsById, editLocale } }) => ({
  thematics: thematicsById
    .filter(proposal => !proposal.get('_toDelete'))
    .sortBy(proposal => proposal.get('order'))
    .map(proposal => proposal.get('id'))
    .toList()
    .toArray(),
  thematicsById: thematicsById,
  editLocale: editLocale
});

export default connect(mapStateToProps)(QuestionSection);