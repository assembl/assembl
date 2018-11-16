// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';

import { type Option } from '../form/selectFieldAdapter';
import TagsForm, { type FormData, tagsComparator } from './tagsForm';

type Props = {
  initialValues: Array<Option>,
  canEdit: boolean,
  updateTags: (tags: Array<string>, callback: (tags: Array<Option>) => void) => void
};

type State = {
  editing: boolean,
  submitting: boolean,
  currentTags: Array<Option>
};

export type TagsData = {
  tags: Array<Option>
};

class Tags extends React.Component<Props, State> {
  static defaultProps = {
    initialValues: [],
    canEdit: false
  };

  state = {
    editing: false,
    submitting: false,
    currentTags: this.props.initialValues
  };

  renderFooter = ({ handleSubmit, pristine = false, submitting = false }: FormData) => (
    <div className="harvesting-box-footer">
      <Button disabled={submitting} key="cancel" className="button-cancel button-dark" onClick={this.cancel}>
        {I18n.t('harvesting.tags.cancel')}
      </Button>
      <Button disabled={pristine || submitting} key="validate" className="button-submit button-dark" onClick={handleSubmit}>
        {I18n.t('harvesting.tags.validate')}
      </Button>
    </div>
  );

  updateTags = (data: TagsData) => {
    const { updateTags } = this.props;
    const { tags } = data;
    const tagsValues = tags.map(tag => tag.label);
    this.setState(
      {
        submitting: true
      },
      () => {
        updateTags(tagsValues, (newtags: Array<Option>) => {
          this.setState({
            submitting: false,
            editing: false,
            currentTags: newtags
          });
        });
      }
    );
  };

  cancel = () => {
    const { initialValues } = this.props;
    this.setState({
      editing: false,
      currentTags: initialValues
    });
  };

  edit = () => {
    this.setState({
      editing: true
    });
  };

  removeTag = (tag: string) => {
    this.setState(state => ({
      ...state,
      currentTags: state.currentTags.filter(currentTag => currentTag.value !== tag)
    }));
  };

  renderTags = () => {
    const { initialValues, canEdit } = this.props;
    const { currentTags, submitting } = this.state;
    const pristine = tagsComparator(initialValues, currentTags);
    return (
      <div className="harvesting-tags-container">
        <label htmlFor="tags">{I18n.t('harvesting.tags.label')}</label>
        <div className="harvesting-tags-titles-container">
          {currentTags.map(tag => (
            <div key={tag.value} className="harvesting-tag-container">
              <span className="harvesting-tag-title">{tag.label}</span>
              {canEdit ? <div className="assembl-icon-cancel" onClick={() => this.removeTag(tag.value)} /> : null}
            </div>
          ))}
          {canEdit ? (
            <div className="harvesting-tags-edit" onClick={this.edit}>
              +
            </div>
          ) : null}
        </div>
        {!pristine &&
          this.renderFooter({
            handleSubmit: () => this.updateTags({ tags: currentTags }),
            pristine: pristine,
            submitting: submitting
          })}
      </div>
    );
  };

  renderForm = () => {
    const { currentTags } = this.state;
    return <TagsForm initialValues={currentTags} onSubmit={this.updateTags} renderFooter={this.renderFooter} />;
  };

  render() {
    const { canEdit } = this.props;
    const { editing } = this.state;
    return canEdit && editing ? this.renderForm() : this.renderTags();
  }
}

export default Tags;