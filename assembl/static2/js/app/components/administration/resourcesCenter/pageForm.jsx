// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { FormGroup } from 'react-bootstrap';

import FileUploader from '../../common/fileUploader';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { updateResourcesCenterPageTitle, updateResourcesCenterHeaderImage } from '../../../actions/adminActions/resourcesCenter';
import { getEntryValueForLocale } from '../../../utils/i18n';

type PageFormProps = {
  handleHeaderImageChange: Function,
  handlePageTitleChange: Function,
  headerMimeType: string,
  headerUrl: File | string,
  editLocale: string,
  title: string
};

const DumbPageForm = ({
  handleHeaderImageChange,
  handlePageTitleChange,
  headerMimeType,
  headerUrl,
  editLocale,
  title
}: PageFormProps) => {
  const titleLabel = I18n.t('administration.resourcesCenter.pageTitleLabel');
  const headerImageFieldName = 'header-image';
  return (
    <div className="form-container">
      <FormControlWithLabel
        key={`title-${editLocale}`}
        label={titleLabel}
        onChange={handlePageTitleChange}
        type="text"
        value={title}
      />
      <FormGroup>
        <label htmlFor={headerImageFieldName}>
          <Translate value="administration.resourcesCenter.headerImageLabel" />
        </label>
        <FileUploader
          mimeType={headerMimeType}
          name={headerImageFieldName}
          fileOrUrl={headerUrl}
          handleChange={handleHeaderImageChange}
        />
      </FormGroup>
      <div className="separator" />
    </div>
  );
};

const mapStateToProps = (state, { editLocale }) => {
  const page = state.admin.resourcesCenter.page;
  return {
    locale: state.i18n.locale, // for I18n.t()
    title: getEntryValueForLocale(page.get('titleEntries'), editLocale, ''),
    headerFilename: page.getIn(['headerImage', 'title']),
    headerMimeType: page.getIn(['headerImage', 'mimeType']),
    headerUrl: page.getIn(['headerImage', 'externalUrl'])
  };
};

const mapDispatchToProps = (dispatch, { editLocale }) => ({
  handleHeaderImageChange: value => dispatch(updateResourcesCenterHeaderImage(value)),
  handlePageTitleChange: e => dispatch(updateResourcesCenterPageTitle(editLocale, e.target.value))
});

export { DumbPageForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbPageForm);