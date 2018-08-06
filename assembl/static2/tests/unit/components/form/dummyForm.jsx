import React from 'react';
import { Form } from 'react-final-form';
import arrayMutators from 'final-form-arrays';

const onSubmitSpy = jest.fn();

const DummyForm = ({ children, initialValues }) => (
  <Form
    initialValues={initialValues}
    mutators={{
      ...arrayMutators
    }}
    onSubmit={onSubmitSpy}
    render={({ handleSubmit, pristine }) => (
      <form onSubmit={handleSubmit}>
        {children}
        <button disabled={pristine} type="submit">
          Submit
        </button>
      </form>
    )}
  />
);

export default DummyForm;