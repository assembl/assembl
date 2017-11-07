// @flow
import classnames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';

import {
  deleteResource,
  updateResourceEmbedCode,
  updateResourceText,
  updateResourceTitle
} from '../../../actions/adminActions/resourcesCenter';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { getEntryValueForLocale } from '../../../utils/i18n';

type EditResourceFormProps = {
  embedCode: string,
  handleEmbedCodeChange: Function,
  handleTextChange: Function,
  handleTitleChange: Function,
  id: string,
  locale: string,
  markAsToDelete: Function,
  order: number,
  text: string,
  title: string
};

const deleteResourceTooltip = (
  <Tooltip id="deleteResourceTooltip">
    <Translate value="administration.resourcesCenter.deleteResource" />
  </Tooltip>
);

const EditResourceForm = ({
  embedCode,
  handleEmbedCodeChange,
  handleTextChange,
  handleTitleChange,
  id,
  locale,
  markAsToDelete,
  order,
  text,
  title
}: EditResourceFormProps) => {
  const divClassname = classnames('form-container', `edit-${id}`);
  const textLabel = I18n.t('administration.resourcesCenter.textLabel');
  const titleLabel = I18n.t('administration.resourcesCenter.titleLabel');
  const embedCodeLabel = I18n.t('administration.resourcesCenter.embedCodeLabel');
  return (
    <div className={divClassname}>
      <div className="title">
        <Translate value="administration.resourcesCenter.editResourceFormTitle" num={order} />
      </div>
      <FormControlWithLabel label={titleLabel} onChange={handleTitleChange} required type="text" value={title} />
      <FormControlWithLabel
        key={`text-${locale}`}
        label={textLabel}
        onChange={handleTextChange}
        required
        type="rich-text"
        value={text}
      />
      <FormControlWithLabel
        componentClass="textarea"
        label={embedCodeLabel}
        onChange={handleEmbedCodeChange}
        required={false}
        type="text"
        value={embedCode}
      />
      <div className="pointer right">
        <OverlayTrigger placement="top" overlay={deleteResourceTooltip}>
          <Button onClick={markAsToDelete}>
            <span className="assembl-icon-delete grey" />
          </Button>
        </OverlayTrigger>
      </div>
      <div className="separator" />
    </div>
  );
};

const mapStateToProps = (state, { id, locale }) => {
  const resource = state.admin.resourcesCenter.resourcesById.get(id);
  return {
    embedCode: resource.get('embedCode'),
    order: resource.get('order'),
    text: getEntryValueForLocale(resource.get('textEntries'), locale, ''),
    title: getEntryValueForLocale(resource.get('titleEntries'), locale, '')
  };
};

const mapDispatchToProps = (dispatch, { id, locale }) => {
  return {
    handleEmbedCodeChange: (e) => {
      return dispatch(updateResourceEmbedCode(id, e.target.value));
    },
    handleTextChange: (value) => {
      return dispatch(updateResourceText(id, locale, value));
    },
    handleTitleChange: (e) => {
      return dispatch(updateResourceTitle(id, locale, e.target.value));
    },
    markAsToDelete: () => {
      return dispatch(deleteResource(id));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EditResourceForm);