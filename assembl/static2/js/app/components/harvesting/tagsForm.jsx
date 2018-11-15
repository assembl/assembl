// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { Form, Field } from 'react-final-form';
import { type ApolloClient, withApollo } from 'react-apollo';

import SelectFieldAdapter from '../form/selectFieldAdapter';
import TagsQuery from '../../graphql/TagsQuery.graphql';

export type FormData = {
  handleSubmit: Function,
  pristine: boolean,
  submitting: boolean
};

type Props = {
  client: ApolloClient,
  initialValues: Array<string>,
  renderFooter: (formData: FormData) => React.Node,
  onSubmit: ({ tags: Array<string> }) => void
};

export const tagsLoader = (client: ApolloClient) => inputValue =>
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

class TagsForm extends React.Component<Props> {
  static defaultProps = {
    initialValues: []
  };

  getTagsLoader = () => {
    const { client } = this.props;
    return tagsLoader(client);
  };

  pristine = (currentTags) => {
    const { initialValues } = this.props;
    return currentTags.length === initialValues.length && currentTags.every(tag => initialValues.includes(tag));
  };

  render() {
    const { initialValues, renderFooter, onSubmit } = this.props;
    return (
      <Form
        initialValues={{ tags: initialValues }}
        onSubmit={onSubmit}
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
                value={initialValues}
                loadOptions={this.getTagsLoader()}
                className="tags-select"
                placeholder="harvesting.tags.select.placeholder"
                noOptionsMessage={() => <Translate value="harvesting.tags.select.noOptions" />}
                formatCreateLabel={newOption => <Translate value="harvesting.tags.select.newOption" option={newOption} />}
              />
              {renderFooter({ handleSubmit: handleSubmit, pristine: pristine, submitting: submitting })}
            </form>
          );
        }}
      />
    );
  }
}

export default withApollo(TagsForm);