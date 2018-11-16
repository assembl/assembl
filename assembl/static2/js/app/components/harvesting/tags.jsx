// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';

import TagsForm, { type FormData } from './tagsForm';

type Props = {
  initialValues: Array<string>,
  canEdit: boolean,
  updateTags: (tags: Array<string>, callback: (tags: Array<string>) => void) => void
};

type State = {
  editing: false,
  submitting: boolean,
  currentTags: Array<string>
};

export type TagsData = {
  tags: Array<string>
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
    this.setState(
      {
        submitting: true
      },
      () => {
        updateTags(tags, (newtags: Arra<string>) => {
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

  pristine = (currentTags: Array<string>) => {
    const { initialValues } = this.props;
    return currentTags.length === initialValues.length && currentTags.every(tag => initialValues.includes(tag));
  };

  removeTag = (tag: string) => {
    this.setState(state => ({
      ...state,
      currentTags: state.currentTags.filter(currentTag => currentTag !== tag)
    }));
  };

  renderTags = () => {
    const { canEdit } = this.props;
    const { currentTags, submitting } = this.state;
    const pristine = this.pristine(currentTags);
    return (
      <div className="harvesting-tags-container">
        <label htmlFor="tags">{I18n.t('harvesting.tags.label')}</label>
        <div className="harvesting-tags-titles-container">
          {currentTags.map(tag => (
            <div key={tag} className="harvesting-tag-container">
              <span className="harvesting-tag-title">{tag}</span>
              {canEdit ? <div className="assembl-icon-cancel" onClick={() => this.removeTag(tag)} /> : null}
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