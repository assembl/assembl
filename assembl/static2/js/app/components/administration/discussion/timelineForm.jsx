// @flow
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { graphql, compose } from 'react-apollo';
import { OverlayTrigger, Button, Row, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import { addPhaseTooltip, deletePhaseTooltip } from '../../common/tooltips';
import SectionTitle from '../sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import TimelineQuery from '../../../graphql/Timeline.graphql';
import PhaseForm from './phaseForm';

type TimelineFormProps = {
  editLocale: string,
  timeline: Object // TODO: specify object shape
};

type TimelineFormState = {
  selectedPhaseId: string
};

export class DumbTimelineForm extends React.Component<TimelineFormProps, TimelineFormState> {
  constructor(props: TimelineFormProps) {
    super(props);
    this.state = {
      selectedPhaseId: props.timeline ? props.timeline[0].id : ''
    };
  }

  componentWillReceiveProps(nextProps: TimelineFormProps) {
    if (!this.state.selectedPhaseId) {
      this.setState({
        selectedPhaseId: nextProps.timeline ? nextProps.timeline[0].id : ''
      });
    }
  }

  getPhaseNumberById = (id: string) => this.props.timeline.map(phase => phase.id).indexOf(id) + 1;

  getPhaseModuleById = (id: string) => this.props.timeline.filter(phase => phase.id === id)[0].identifier;

  render() {
    const { editLocale, timeline } = this.props;
    const { selectedPhaseId } = this.state;
    const phaseLabel = I18n.t('administration.timelineAdmin.phaseLabel');
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
              {timeline && timeline.map(({ id, title }) =>
                (
                  <div className="flex" key={`title-input-phase-${id}`}>
                    <FormControlWithLabel
                      key={`phase-${id}`}
                      label={`${phaseLabel} ${editLocale.toUpperCase()}`}
                      onChange={() => {}}
                      type="text"
                      value={title}
                      style={{ flexGrow: 1 }}
                    />
                    <OverlayTrigger placement="top" overlay={deletePhaseTooltip}>
                      <Button onClick={() => {}} className="admin-icons">
                        <span className="assembl-icon-delete grey" />
                      </Button>
                    </OverlayTrigger>
                  </div>
                )
              )
              }
              <OverlayTrigger placement="top" overlay={addPhaseTooltip}>
                <div onClick={() => {}} className="plus margin-l">
            +
                </div>
              </OverlayTrigger>
            </form>
          </div>
        </div>
        <Translate value="administration.timelineAdmin.instruction2" className="admin-instruction" />
        <div className="admin-content">
          <Row>
            {timeline && timeline.map(({ id }, index) => {
              const linkClassNames = selectedPhaseId === id ? 'tab-title-active ellipsis' : 'tab-title ellipsis';
              return (
                <Col xs={12} md={Math.round(12 / timeline.length)} key={index}>
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
            })}
          </Row>
          {selectedPhaseId && (
            <Row>
              <PhaseForm
                key={`phase-form-${selectedPhaseId}-${editLocale}`}
                phaseId={selectedPhaseId}
                editLocale={editLocale}
                phaseNumber={this.getPhaseNumberById(selectedPhaseId)}
                phaseModule={this.getPhaseModuleById(selectedPhaseId)}
              />
            </Row>
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  editLocale: state.admin.editLocale,
  lang: state.i18n.locale
});

const withData = graphql(TimelineQuery, {
  options: ({ lang }) => ({
    variables: { lang: lang }
  }),
  props: ({ data: { timeline } }) => ({
    timeline: timeline
  })
});

export default compose(connect(mapStateToProps), withData)(DumbTimelineForm);