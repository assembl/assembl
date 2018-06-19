// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup } from 'react-bootstrap';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FileUploader from '../../common/fileUploader';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { updatePhaseDescription, updatePhaseImage } from '../../../actions/adminActions/timeline';

type Props = {
  phaseTitle: string,
  index: number,
  phaseDescription: string,
  phaseImgMimeType: string,
  phaseImgUrl: string,
  phaseImgTitle: string,
  handleDescriptionChange: Function,
  handleImageChange: Function
};

const DumbPhaseForm = ({
  index,
  phaseTitle,
  phaseDescription,
  phaseImgMimeType,
  phaseImgUrl,
  phaseImgTitle,
  handleDescriptionChange,
  handleImageChange
}: Props) => {
  const descriptionPh = I18n.t('administration.ph.descriptionPhase');
  return (
    <div className="admin-phase-box">
      <div className="phase-title">
        <Translate value="administration.menu.phase" count={index + 1} description={phaseTitle} />
      </div>
      <FormControlWithLabel
        label={descriptionPh}
        onChange={handleDescriptionChange}
        required
        type="text"
        value={phaseDescription}
        componentClass="textarea"
      />
      <FormGroup>
        <label htmlFor="landing-page-img-header">
          <Translate value="administration.landingPage.timeline.image" />
        </label>
        <FileUploader
          fileOrUrl={phaseImgUrl}
          imgTitle={phaseImgTitle}
          handleChange={handleImageChange}
          mimeType={phaseImgMimeType}
          name="landing-page-img-header"
          isAdminUploader
          onDeleteClick={() => {
            handleImageChange('TO_DELETE');
          }}
        />
        <div className="description-block">
          <Translate value="administration.landingPage.timeline.imageDescription" />
        </div>
      </FormGroup>
    </div>
  );
};

const mapStateToProps = (state, { phaseId, editLocale }) => {
  const { phasesById } = state.admin.timeline;
  const phase = phasesById.get(phaseId);
  return {
    phaseTitle: getEntryValueForLocale(phase.get('titleEntries'), editLocale, ''),
    phaseDescription: getEntryValueForLocale(phase.get('descriptionEntries'), editLocale, ''),
    phaseImgMimeType: phase.getIn(['image', 'mimeType']),
    phaseImgUrl: phase.getIn(['image', 'externalUrl']),
    phaseImgTitle: phase.getIn(['image', 'title'])
  };
};

const mapDispatchToProps = (dispatch, { phaseId, editLocale }) => ({
  handleDescriptionChange: e => dispatch(updatePhaseDescription(phaseId, editLocale, e.target.value)),
  handleImageChange: value => dispatch(updatePhaseImage(phaseId, value))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbPhaseForm);