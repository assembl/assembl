// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { Form, Field } from 'react-final-form';
import { Button } from 'react-bootstrap';
import SelectFieldAdapter from '../form/selectFieldAdapter';

type Props = {
  initialValues: Array<string>,
  options: Array<string>,
  canEdit: boolean
};

type State = {
  editing: false,
  currentTags: Array<string>
};

class TagsForm extends React.Component<Props, State> {
  static defaultProps = {
    initialValues: [],
    options: [],
    canEdit: false
  };

  state = {
    editing: false,
    currentTags: this.props.initialValues
  };

  renderFooter = (handleSubmit, pristine = false, submitting = false) => (
    <div className="harvesting-box-footer">
      <Button key="cancel" className="button-cancel button-dark" onClick={this.cancel}>
        {I18n.t('harvesting.tags.cancel')}
      </Button>
      <Button desabled={!pristine && !submitting} key="validate" className="button-submit button-dark" onClick={handleSubmit}>
        {I18n.t('harvesting.tags.validate')}
      </Button>
    </div>
  );

  updateExtractTags = (tags) => {
    // TODO query and mutations
    console.log(tags); //eslint-disable-line
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

  pristine = () => {
    const { initialValues } = this.props;
    const { currentTags } = this.state;
    return currentTags.length === initialValues.length && currentTags.every(tag => initialValues.includes(tag));
  };

  removeTag = (tag) => {
    this.setState(state => ({
      ...state,
      currentTags: state.currentTags.filter(currentTag => currentTag !== tag)
    }));
  };

  renderTags = () => {
    const { canEdit } = this.props;
    const { currentTags } = this.state;
    return (
      <div className="harvesting-tags-container">
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
        {!this.pristine() && this.renderFooter(() => this.updateExtractTags(currentTags))}
      </div>
    );
  };

  renderForm = () => {
    const { options } = this.props;
    const { currentTags } = this.state;
    return (
      <Form
        initialValues={{ tags: currentTags }}
        onSubmit={({ tags }) => {
          this.updateExtract(tags);
        }}
        render={({ handleSubmit, pristine, submitting }) => (
          <form onSubmit={handleSubmit} className="harvesting-tags-form-container form-container">
            <Field
              name="tags"
              component={SelectFieldAdapter}
              label={I18n.t('harvesting.tags.label')}
              // The Select fields
              isMulti
              canCreate
              value={currentTags}
              options={options}
              className="tags-select"
              placeholder="harvesting.tags.select.placeholder"
              noOptionsMessage={() => <Translate value={'harvesting.tags.select.noOptions'} />}
              formatCreateLabel={newOption => <Translate value={'harvesting.tags.select.newOption'} option={newOption} />}
            />
            {this.renderFooter(handleSubmit, pristine, submitting)}
          </form>
        )}
      />
    );
  };

  render() {
    const { canEdit } = this.props;
    const { editing } = this.state;
    return <React.Fragment>{canEdit && editing ? this.renderForm() : this.renderTags()}</React.Fragment>;
  }
}

export default TagsForm;