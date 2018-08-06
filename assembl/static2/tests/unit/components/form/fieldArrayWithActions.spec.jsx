import React from 'react';
import renderer from 'react-test-renderer';
import { Field } from 'react-final-form';

import DummyForm from './dummyForm';
import FieldArrayWithActions from '../../../../js/app/components/form/fieldArrayWithActions';

describe('FieldArrayWithActions component', () => {
  const initialValues = {
    persons: [{ firstname: 'Rosalinda', lastname: 'Tillman' }, { firstname: 'Lavinia', lastname: 'Kunde' }]
  };

  it('should render an array of fields with delete, move up, move down and a add button', () => {
    const props = {
      name: 'persons',
      renderFields: ({ name }) => (
        <React.Fragment>
          <Field name={`${name}.firstname`} component="input" label="Firstname" />
          <Field name={`${name}.lastname`} component="input" label="Firstname" />
        </React.Fragment>
      ),
      titleMsgId: 'profile.panelTitle',
      tooltips: {
        addTooltip: <div>Add</div>,
        deleteTooltip: <div>Delete</div>
      },
      withSeparators: true
    };
    const component = renderer.create(
      <DummyForm initialValues={initialValues}>
        <FieldArrayWithActions {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an array of fields with delete, move up, move down and a add button without separators', () => {
    const props = {
      name: 'persons',
      renderFields: ({ name }) => (
        <React.Fragment>
          <Field name={`${name}.firstname`} component="input" label="Firstname" />
          <Field name={`${name}.lastname`} component="input" label="Firstname" />
        </React.Fragment>
      ),
      titleMsgId: 'profile.panelTitle',
      tooltips: {
        addTooltip: <div>Add</div>,
        deleteTooltip: <div>Delete</div>
      },
      withSeparators: false
    };
    const component = renderer.create(
      <DummyForm initialValues={initialValues}>
        <FieldArrayWithActions {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});