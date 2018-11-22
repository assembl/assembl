// @flow
import * as React from 'react';
import { Translate } from 'react-redux-i18n';
import { Form, Field } from 'react-final-form';
import { type ApolloClient, withApollo } from 'react-apollo';
import { components } from 'react-select';

import SelectFieldAdapter, { type Option } from '../form/selectFieldAdapter';
import { tagsLoader } from './tagsForm';

type Props = {
  client: ApolloClient,
  initialValue: Option,
  excludeOptions: Array<string>,
  onSubmit: (result: { tags: Array<Option> }) => void,
  onCancel: () => void
};

const valueContainer = (
  pristine: boolean,
  onValidate?: (?SyntheticEvent<HTMLFormElement>) => ?Promise<?Object>,
  onCancel?: (SyntheticEvent<HTMLDivElement>) => void
) => ({ children, ...props }) => {
  const currentValue = props.getValue()[0];
  const hasLabel = children[0];
  return (
    <components.ValueContainer {...props}>
      <div className="harvesting-tag-input-container">
        <div className="harvesting-tag-input">
          {children}
          {currentValue && hasLabel ? <div>{currentValue.label}</div> : null}
        </div>
        {currentValue && (onValidate || onCancel) ? (
          <div className="harvesting-tag-input-control" onClick={onCancel}>
            {onCancel ? <div className="icon cancel-icon assembl-icon-cancel" /> : null}
            {onValidate && !pristine ? <div className="icon validate-icon assembl-icon-checked" onClick={onValidate} /> : null}
          </div>
        ) : null}
      </div>
    </components.ValueContainer>
  );
};

export class DumbTagForm extends React.Component<Props> {
  static defaultProps = {
    initialValue: {},
    excludeOptions: []
  };

  render() {
    const { initialValue, onSubmit, onCancel, client, excludeOptions } = this.props;
    return (
      <Form
        initialValues={{ tag: initialValue }}
        onSubmit={onSubmit}
        render={({ handleSubmit, values }) => {
          // Don't use final form pristine here
          const value = values ? values.tag : {};
          const pristine = value && initialValue.label === value.label;
          return (
            <form onSubmit={handleSubmit} className="harvesting-tag-form-container">
              <Field
                name="tag"
                component={SelectFieldAdapter}
                // The Select field props
                canCreate
                isAsync
                autoFocus
                components={{ ValueContainer: valueContainer(pristine, handleSubmit, onCancel) }}
                value={initialValue}
                loadOptions={tagsLoader(client, excludeOptions)}
                className="tags-select"
                placeholder="harvesting.tags.select.placeholder"
                noOptionsMessage={() => <Translate value="harvesting.tags.select.noOptions" />}
                formatCreateLabel={newOption => <Translate value="harvesting.tags.select.newOption" option={newOption} />}
              />
            </form>
          );
        }}
      />
    );
  }
}

export default withApollo(DumbTagForm);