// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { FormGroup } from 'react-bootstrap';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FileUploader from '../../common/fileUploader';
import FormControlWithLabel from '../../common/formControlWithLabel';

type Props = {
  discussionPhaseTitle: string,
  index: number
};

const DumbPhaseForm = ({ index, discussionPhaseTitle }: Props) => {
  const descriptionPh = 'Description';
  const headerImgUrl = '/url';
  const headerImgTitle = 'Desc';
  const headerImgMimeType = 'img/jpeg';
  const handleDescriptionChange = () => {};
  const handleImageChange = () => {};
  return (
    <div className="admin-phase-box">
      <div className="phase-title">
        <Translate value="administration.menu.phase" count={index + 1} description={discussionPhaseTitle} />
      </div>
      <FormControlWithLabel
        label={descriptionPh}
        onChange={handleDescriptionChange}
        required
        type="text"
        value={descriptionPh}
        componentClass="textarea"
      />
      <FormGroup>
        <label htmlFor="landing-page-img-header">
          <Translate value="administration.landingPage.timeline.image" />
        </label>
        <FileUploader
          fileOrUrl={headerImgUrl}
          imgTitle={headerImgTitle}
          handleChange={handleImageChange}
          mimeType={headerImgMimeType}
          name="landing-page-img-header"
          isAdminUploader
          onDeleteClick={handleImageChange}
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
    discussionPhaseTitle: getEntryValueForLocale(phase.get('titleEntries'), editLocale, '')
  };
};

export default connect(mapStateToProps)(DumbPhaseForm);