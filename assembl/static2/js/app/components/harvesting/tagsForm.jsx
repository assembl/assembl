// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { Form, Field } from 'react-final-form';
import { Button } from 'react-bootstrap';
import { type ApolloClient, withApollo } from 'react-apollo';

import SelectFieldAdapter from '../form/selectFieldAdapter';
import TagsQuery from '../../graphql/TagsQuery.graphql';

type Props = {
  client: ApolloClient,
  initialValues: Array<string>,
  canEdit: boolean
};

type State = {
  editing: false,
  submitting: boolean,
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
    submitting: false,
    currentTags: this.props.initialValues
  };

  renderFooter = (handleSubmit, pristine = false, submitting = false) => (
    <div className="harvesting-box-footer">
      <Button disabled={submitting} key="cancel" className="button-cancel button-dark" onClick={this.cancel}>
        {I18n.t('harvesting.tags.cancel')}
      </Button>
      <Button disabled={pristine || submitting} key="validate" className="button-submit button-dark" onClick={handleSubmit}>
        {I18n.t('harvesting.tags.validate')}
      </Button>
    </div>
  );

  updateTags = (tags) => {
    // TODO query and mutations
    const { id, updateTags } = this.props;
    this.setState(
      {
        submitting: true
      },
      () => {
        updateTags({
          variables: {
            id: id,
            tags: tags
          }
        }).then((result) => {
          this.setState({
            submitting: false,
            editing: false,
            currentTags: result.data.updateExtractTags.tags.map(tag => tag.value)
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

  pristine = (currentTags) => {
    const { initialValues } = this.props;
    return currentTags.length === initialValues.length && currentTags.every(tag => initialValues.includes(tag));
  };

  removeTag = (tag) => {
    this.setState(state => ({
      ...state,
      currentTags: state.currentTags.filter(currentTag => currentTag !== tag)
    }));
  };

  getTagsLoader = () => {
    const { client } = this.props;
    return inputValue =>
      client
        .query({
          query: TagsQuery,
          variables: { filter: inputValue }
        })
        .then((value) => {
          const { data: { tags } } = value;
          return tags.map(tag => ({
            label: tag.value,
            value: tag.value
          }));
        });
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
        {!pristine && this.renderFooter(() => this.updateTags(currentTags), pristine, submitting)}
      </div>
    );
  };

  renderForm = () => {
    const { currentTags } = this.state;
    return (
      <Form
        initialValues={{ tags: currentTags }}
        onSubmit={({ tags }) => {
          this.updateTags(tags);
        }}
        render={({ handleSubmit, values, submitting }) => {
          const pristine = this.pristine(values.tags);
          return (
            <form onSubmit={handleSubmit} className="harvesting-tags-form-container form-container">
              <Field
                name="tags"
                component={SelectFieldAdapter}
                label={I18n.t('harvesting.tags.label')}
                // The Select fields
                isMulti
                canCreate
                isAsync
                value={currentTags}
                loadOptions={this.getTagsLoader()}
                className="tags-select"
                placeholder="harvesting.tags.select.placeholder"
                noOptionsMessage={() => <Translate value="harvesting.tags.select.noOptions" />}
                formatCreateLabel={newOption => <Translate value="harvesting.tags.select.newOption" option={newOption} />}
              />
              {this.renderFooter(handleSubmit, pristine, submitting)}
            </form>
          );
        }}
      />
    );
  };

  render() {
    const { canEdit } = this.props;
    const { editing } = this.state;
    return canEdit && editing ? this.renderForm() : this.renderTags();
  }
}

export default withApollo(TagsForm);