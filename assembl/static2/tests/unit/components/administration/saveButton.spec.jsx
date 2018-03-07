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

describe('getMutationsPromises', () => {
  const { getMutationsPromises } = saveButton;
  it('should return an empty list if items is empty', () => {
    const params = {
      items: []
    };
    const result = getMutationsPromises(params);
    expect(result).toEqual([]);
  });

  it('should return a list with create mutations on new items', () => {
    const createMutationSpy = jest.fn();
    const deleteMutationSpy = jest.fn();
    const params = {
      createMutation: createMutationSpy,
      deleteMutation: deleteMutationSpy,
      items: [
        {
          isNew: true,
          title: 'Application',
          toDelete: false
        }
      ],
      variablesCreator: (item, idx) => ({
        title: item.title,
        idx: idx
      })
    };
    const result = getMutationsPromises(params);
    expect(result.length).toBe(1);
    result.forEach(task => task());
    expect(deleteMutationSpy.mock.calls.length).toBe(0);
    expect(createMutationSpy.mock.calls.length).toBe(1);
    expect(createMutationSpy.mock.calls[0][0]).toEqual({
      variables: {
        title: 'Application',
        idx: 0
      }
    });
  });

  it('should return a list with delete mutations on deleted items', () => {
    const createMutationSpy = jest.fn();
    const deleteMutationSpy = jest.fn();
    const params = {
      createMutation: createMutationSpy,
      deleteMutation: deleteMutationSpy,
      items: [
        {
          id: 1,
          isNew: false,
          toDelete: true
        },
        {
          id: 2,
          isNew: false,
          toDelete: false
        },
        {
          id: 3,
          isNew: true,
          toDelete: true
        }
      ],
      deleteVariablesCreator: item => ({
        id: item.id
      })
    };
    const result = getMutationsPromises(params);
    expect(result.length).toBe(1);
    result.forEach(task => task());
    expect(createMutationSpy.mock.calls.length).toBe(0);
    expect(deleteMutationSpy.mock.calls.length).toBe(1);
    expect(deleteMutationSpy.mock.calls[0][0]).toEqual({
      variables: { id: 1 }
    });
  });

  it('should return a list with update mutations on non new and non deleted items', () => {
    const createMutationSpy = jest.fn();
    const deleteMutationSpy = jest.fn();
    const updateMutationSpy = jest.fn();
    const params = {
      createMutation: createMutationSpy,
      deleteMutation: deleteMutationSpy,
      updateMutation: updateMutationSpy,
      items: [
        {
          id: 3,
          isNew: false,
          toDelete: false
        },
        {
          id: 4,
          isNew: false,
          toDelete: false
        }
      ],
      lang: 'en',
      deleteVariablesCreator: () => {},
      variablesCreator: item => ({ id: item.id })
    };
    const result = getMutationsPromises(params);
    expect(result.length).toBe(2);
    result.forEach(task => task());
    expect(createMutationSpy.mock.calls.length).toBe(0);
    expect(deleteMutationSpy.mock.calls.length).toBe(0);
    expect(updateMutationSpy.mock.calls.length).toBe(2);
    expect(updateMutationSpy.mock.calls[0][0]).toEqual({
      variables: { id: 3, lang: 'en' }
    });
    expect(updateMutationSpy.mock.calls[1][0]).toEqual({
      variables: { id: 4, lang: 'en' }
    });
  });
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