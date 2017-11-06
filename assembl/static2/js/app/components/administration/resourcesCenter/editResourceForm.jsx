// @flow
import classnames from 'classnames';
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';

// import { updateResourceText, updateResourceTitle } from '../../../actions/adminActions';
import FormControlWithLabel from '../../common/formControlWithLabel';

type EditResourceFormProps = {
  embedCode: string,
  id: string,
  order: number,
  text: string,
  title: string
};

const EditResourceForm = ({ embedCode, id, order, text, title }: EditResourceFormProps) => {
  const handleTitleChange = () => {};
  const handleTextChange = () => {};
  const handleEmbedCodeChange = () => {};
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
      <FormControlWithLabel label={textLabel} onChange={handleTextChange} required type="rich-text" value={text} />
      <FormControlWithLabel
        componentClass="textarea"
        label={embedCodeLabel}
        onChange={handleEmbedCodeChange}
        required={false}
        type="text"
        value={embedCode}
      />
      <div className="separator" />
    </div>
  );
};

export default EditResourceForm;