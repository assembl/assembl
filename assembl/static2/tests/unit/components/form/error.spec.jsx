import React from 'react';
import renderer from 'react-test-renderer';

import DummyForm from './dummyForm';
import Error from '../../../../js/app/components/form/error';

describe('Error component', () => {
  it('should render a field error', () => {
    const props = {
      name: 'foobar'
    };

    const component = renderer.create(
      <DummyForm>
        <Error {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});