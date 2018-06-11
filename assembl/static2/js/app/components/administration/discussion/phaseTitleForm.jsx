// @flow
import React from 'react';
import { connect } from 'react-redux';
import { OverlayTrigger, Button } from 'react-bootstrap';
import { I18n, Translate } from 'react-redux-i18n';
import classnames from 'classnames';
import { updatePhaseTitle, deletePhase } from '../../../actions/adminActions/timeline';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { deletePhaseTooltip } from '../../common/tooltips';
import { getEntryValueForLocale } from '../../../utils/i18n';

type PhaseTitleFormProps = {
  id: string,
  title: string,
  editLocale: string,
  handleTitleChange: Function,
  handleDeleteClick: Function,
  phaseIndex: number
}

export const DumbPhaseTitleForm = ({
  id,
  title,
  editLocale,
  handleTitleChange,
  handleDeleteClick,
  phaseIndex
}: PhaseTitleFormProps) => {
  const phaseLabel = I18n.t('administration.timelineAdmin.phaseLabel');
  const isTitleEmpty = title.length === 0;
  const phaseSideTitleClassNames = classnames('phase-side-title', { 'phase-side-title-low': isTitleEmpty });
  const deleteButtonClassNames = classnames('admin-icons', { 'delete-button-high': isTitleEmpty });
  return (
    <div className="flex phase-title-form">
      <Translate value="administration.timelineAdmin.phase" count={phaseIndex} className={phaseSideTitleClassNames} />
      <FormControlWithLabel
        key={`phase-${id}`}
        label={`${phaseLabel} ${editLocale.toUpperCase()}`}
        onChange={handleTitleChange}
        type="text"
        value={title}
      />
      <OverlayTrigger placement="top" overlay={deletePhaseTooltip}>
        <Button onClick={handleDeleteClick} className={deleteButtonClassNames}>
          <span className="assembl-icon-delete grey" />
        </Button>
      </OverlayTrigger>
    </div>
  );
};

const mapStateToProps = (state, { id, editLocale }: PhaseTitleFormProps) => {
  const phase = state.admin.timeline.phasesById.get(id);
  return {
    title: getEntryValueForLocale(phase.get('titleEntries'), editLocale, '')
  };
};

const mapDispatchToProps = (dispatch, { id, editLocale }: PhaseTitleFormProps) => ({
  handleTitleChange: e => dispatch(updatePhaseTitle(id, editLocale, e.target.value)),
  handleDeleteClick: () => dispatch(deletePhase(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbPhaseTitleForm);