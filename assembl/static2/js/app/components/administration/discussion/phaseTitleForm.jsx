// @flow
import React from 'react';
import { connect } from 'react-redux';
import { OverlayTrigger, Button, FormGroup } from 'react-bootstrap';
import { I18n, Translate } from 'react-redux-i18n';
import classnames from 'classnames';
import { updatePhaseTitle, deletePhase, movePhaseUp, movePhaseDown } from '../../../actions/adminActions/timeline';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { deletePhaseTooltip, upTooltip, downTooltip } from '../../common/tooltips';
import { getEntryValueForLocale } from '../../../utils/i18n';

type PhaseTitleFormProps = {
  id: string,
  title: string,
  editLocale: string,
  handleTitleChange: Function,
  handleDeleteClick: Function,
  handleUpClick: Function,
  handleDownClick: Function,
  phaseIndex: number,
  numberOfPhases: number,
  hasConflictingDates: boolean
};

export const DumbPhaseTitleForm = ({
  id,
  title,
  editLocale,
  handleTitleChange,
  handleDeleteClick,
  handleUpClick,
  handleDownClick,
  phaseIndex,
  numberOfPhases,
  hasConflictingDates
}: PhaseTitleFormProps) => {
  const phaseLabel = I18n.t('administration.timelineAdmin.phaseLabel');
  const isTitleEmpty = title.length === 0;
  const isFirst = phaseIndex === 1;
  const isLast = phaseIndex === numberOfPhases;
  const phaseSideTitleClassNames = classnames('phase-side-title', { 'phase-side-title-low': isTitleEmpty });
  const deleteButtonClassNames = classnames('admin-icons', { 'side-button-high': isTitleEmpty });
  const upButtonsClassNames = classnames('admin-icons', { 'end-items': isLast, 'side-button-high': isTitleEmpty });
  const downButtonClassNames = classnames('admin-icons', { 'end-items': isFirst, 'side-button-high': isTitleEmpty });
  return (
    <div className="phase-title-form-container">
      <div className="flex phase-title-form">
        <Translate value="administration.timelineAdmin.phase" count={phaseIndex} className={phaseSideTitleClassNames} />
        <FormGroup validationState={hasConflictingDates ? 'warning' : null}>
          <FormControlWithLabel
            key={`phase-${id}`}
            label={`${phaseLabel} ${editLocale.toUpperCase()}`}
            onChange={handleTitleChange}
            type="text"
            value={title}
            required
            className={hasConflictingDates && 'warning'}
          />
        </FormGroup>
        <div className="flex">
          {!isLast ? (
            <OverlayTrigger placement="top" overlay={downTooltip}>
              <Button onClick={handleDownClick} className={downButtonClassNames}>
                <span className="assembl-icon-down-small grey" />
              </Button>
            </OverlayTrigger>
          ) : null}
          {!isFirst ? (
            <OverlayTrigger placement="top" overlay={upTooltip}>
              <Button onClick={handleUpClick} className={upButtonsClassNames}>
                <span className="assembl-icon-up-small grey" />
              </Button>
            </OverlayTrigger>
          ) : null}
          <OverlayTrigger placement="top" overlay={deletePhaseTooltip}>
            <Button onClick={handleDeleteClick} className={deleteButtonClassNames}>
              <span className="assembl-icon-delete grey" />
            </Button>
          </OverlayTrigger>
        </div>
      </div>
      <div className="warning-label">
        {hasConflictingDates && <Translate value="administration.timelineAdmin.warningLabel" />}
      </div>
    </div>
  );
};

const mapStateToProps = (state, { id, editLocale }: PhaseTitleFormProps) => {
  const phase = state.admin.timeline.phasesById.get(id);
  return {
    title: getEntryValueForLocale(phase.get('titleEntries'), editLocale, ''),
    hasConflictingDates: phase.get('hasConflictingDates')
  };
};

const mapDispatchToProps = (dispatch, { id, editLocale }: PhaseTitleFormProps) => ({
  handleTitleChange: e => dispatch(updatePhaseTitle(id, editLocale, e.target.value)),
  handleDeleteClick: () => dispatch(deletePhase(id)),
  handleUpClick: () => dispatch(movePhaseUp(id)),
  handleDownClick: () => dispatch(movePhaseDown(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbPhaseTitleForm);