// @flow
import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { Form, Field } from 'react-final-form';
import { type ApolloClient, withApollo } from 'react-apollo';

import SelectFieldAdapter from '../form/selectFieldAdapter';
import Tags from '../../graphql/TagsQuery.graphql';

export type FormData = {
  handleSubmit: Function,
  pristine: boolean,
  submitting: boolean
};

type Props = {
  client: ApolloClient,
  initialValues: Array<string>,
  renderFooter: (formData: FormData) => React.Node,
  onSubmit: (result: { tags: Array<string> }) => void
};

export const tagsLoader = (client: ApolloClient) => (inputValue: string) =>
  client
    .query({
      query: Tags,
      variables: { filter: inputValue },
      fetchPolicy: 'network-only'
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

  pristine = (currentTags: Array<string>) => {
    const { initialValues } = this.props;
    return currentTags.length === initialValues.length && currentTags.every(tag => initialValues.includes(tag));
  };

  render() {
    const { initialValues, renderFooter, onSubmit, client } = this.props;
    return (
      <Form
        initialValues={{ tags: initialValues }}
        onSubmit={onSubmit}
        render={({ handleSubmit, values, submitting }) => {
          // Don't use final form pristine here
          const pristine = this.pristine(values.tags);
          return (
            <form onSubmit={handleSubmit} className="harvesting-tags-form-container form-container">
              <Field
                name="tags"
                component={SelectFieldAdapter}
                label={I18n.t('harvesting.tags.label')}
                // The Select field props
                isMulti
                canCreate
                isAsync
                value={initialValues}
                loadOptions={tagsLoader(client)}
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