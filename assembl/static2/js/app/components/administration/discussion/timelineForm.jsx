// @flow
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { List } from 'immutable';
import { OverlayTrigger, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import { addPhaseTooltip } from '../../common/tooltips';
import SectionTitle from '../sectionTitle';
import PhaseForm from './phaseForm';
import { createRandomId } from '../../../utils/globalFunctions';
import { createPhase } from '../../../actions/adminActions/timeline';
import PhaseTitleForm from './phaseTitleForm';

type TimelineFormProps = {
  editLocale: string,
  phases: List<string>, // TODO: specify object shape
  handleCreatePhase: Function
};

type TimelineFormState = {
  selectedPhaseId: string
};

export class DumbTimelineForm extends React.Component<TimelineFormProps, TimelineFormState> {
  constructor(props: TimelineFormProps) {
    super(props);
    this.state = {
      selectedPhaseId: props.phases ? props.phases.toJS()[0] : ''
    };
  }

  componentWillReceiveProps(nextProps: TimelineFormProps) {
    if (!this.state.selectedPhaseId) {
      this.setState({
        selectedPhaseId: nextProps.phases ? nextProps.phases.toJS()[0] : ''
      });
    }
  }

  getPhaseNumberById = (id: string) => (this.props.phases.toJS().indexOf(id) + 1);

  render() {
    const { editLocale, phases, handleCreatePhase } = this.props;
    const { selectedPhaseId } = this.state;
    return (
      <div className="admin-box timeline-admin">
        <SectionTitle
          title={I18n.t('administration.discussion.5')}
          annotation={I18n.t('administration.timelineAdmin.annotation')}
        />
        <Translate value="administration.timelineAdmin.instruction1" className="admin-instruction" />
        <div className="admin-content">
          <div className="form-container">
            <form>
              {phases && phases.map(id => (
                <PhaseTitleForm id={id} editLocale={editLocale} key={`phase-title-form-${id}`} />
              )
              )
              }
              <OverlayTrigger placement="top" overlay={addPhaseTooltip}>
                <div onClick={() => handleCreatePhase()} className="plus margin-l">
            +
                </div>
              </OverlayTrigger>
            </form>
          </div>
        </div>
        <Translate value="administration.timelineAdmin.instruction2" className="admin-instruction" />
        <div className="admin-content">
          <Row>
            {phases && phases.toJS().map((id, index) => {
              const linkClassNames = selectedPhaseId === id ? 'tab-title-active ellipsis' : 'tab-title ellipsis';
              return (
                <Col xs={12} md={Math.round(12 / phases.length)} key={index}>
                  <a
                    className={linkClassNames}
                    key={`phase-link-${id}`}
                    onClick={() => {
                      this.setState({ selectedPhaseId: id });
                    }}
                  >
                    <Translate value="administration.timelineAdmin.phase" count={index + 1} />
                  </a>
                </Col>
              );
            }
            )}
          </Row>
          {selectedPhaseId && (
            <Row>
              <PhaseForm
                key={`phase-form-${selectedPhaseId}-${editLocale}`}
                phaseId={selectedPhaseId}
                phaseNumber={this.getPhaseNumberById(selectedPhaseId)}
              />
            </Row>
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const { phasesInOrder, phasesById } = state.admin.timeline;
  return {
    editLocale: state.admin.editLocale,
    lang: state.i18n.locale,
    phases: phasesInOrder.filter(id => !phasesById.get(id).get('_toDelete'))
  };
};

const mapDispatchToProps = dispatch => ({
  handleCreatePhase: () => {
    const newId = createRandomId();
    return dispatch(createPhase(newId));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbTimelineForm);