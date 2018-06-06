// @flow
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { graphql, compose } from 'react-apollo';
import { OverlayTrigger, Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import { addPhaseTooltip, deletePhaseTooltip, upTooltip, downTooltip } from '../../common/tooltips';
import SectionTitle from '../sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import TimelineQuery from '../../../graphql/Timeline.graphql';

type TimelineFormProps = {
  editLocale: string,
  timeline: Object // TODO: specify object shape
}

export const DumbTimelineForm = ({ editLocale, timeline }: TimelineFormProps) => {
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
            {timeline && timeline.map(({ id, title }, index) => {
              const isFirst = index === 0;
              const isLast = index === timeline.size - 1;
              return (
                <div className="flex" key={id}>
                  <FormControlWithLabel
                    key={`phase-${id}`}
                    label={`${phaseLabel} ${editLocale.toUpperCase()}`}
                    onChange={() => {}}
                    type="text"
                    value={title}
                    style={{ flexGrow: 1 }}
                  />
                  <div className="flex">
                    {!isLast ? (
                      <OverlayTrigger placement="top" overlay={downTooltip}>
                        <Button onClick={() => {}} className={isFirst ? 'admin-icons end-items' : 'admin-icons'}>
                          <span className="assembl-icon-down-small grey" />
                        </Button>
                      </OverlayTrigger>
                    ) : null}
                    {!isFirst ? (
                      <OverlayTrigger placement="top" overlay={upTooltip}>
                        <Button onClick={() => {}} className={isLast ? 'admin-icons end-items' : 'admin-icons'}>
                          <span className="assembl-icon-up-small grey" />
                        </Button>
                      </OverlayTrigger>
                    ) : null}
                    <OverlayTrigger placement="top" overlay={deletePhaseTooltip}>
                      <Button onClick={() => {}} className="admin-icons">
                        <span className="assembl-icon-delete grey" />
                      </Button>
                    </OverlayTrigger>
                  </div>
                </div>
              );
            })
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
    </div>
  );
};

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