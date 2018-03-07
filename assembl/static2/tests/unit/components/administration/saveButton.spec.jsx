import React from 'react';
import renderer from 'react-test-renderer';

import * as saveButton from '../../../../js/app/components/administration/saveButton';

describe('runSerial function', () => {
  const { runSerial } = saveButton;
  it('should run promises in serial', async () => {
    const task1 = jest.fn();
    const task2 = jest.fn();
    await runSerial([task1, task2]).then(() => {
      expect(task1.mock.calls.length).toBe(1);
      expect(task2.mock.calls.length).toBe(1);
    });
  });
});

describe('getMutationPromises', () => {
  it('should create a list of mutations from given params');
});

describe('Save button component', () => {
  const Component = saveButton.default;
  const saveActionSpy = jest.fn();
  it('should render a save button', () => {
    const props = {
      saveAction: saveActionSpy
    };
    const component = renderer.create(<Component {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a disabled save button', () => {
    const props = {
      disabled: true,
      saveAction: saveActionSpy
    };
    const component = renderer.create(<Component {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a save button with specific classes', () => {
    const props = {
      saveAction: saveActionSpy,
      specificClasses: 'my-great-green-save-button'
    };
    const component = renderer.create(<Component {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});