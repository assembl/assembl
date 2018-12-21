import React from 'react';
import renderer from 'react-test-renderer';

import DummyForm from './dummyForm';
import { createEditorStateFromText } from '../../../helpers/draftjs';
import MultilingualRichTextFieldAdapter from '../../../../js/app/components/form/multilingualRichTextFieldAdapter';

// avoid random stuff in editor state and editor component to be able to use snapshots
jest.mock('draft-js/lib/generateRandomKey', () => () => '123');
jest.mock('../../../../js/app/components/common/richTextEditor/index', () => 'AssemblEditor');

describe('MultilingualRichTextFieldAdapter component', () => {
  const onChangeSpy = jest.fn();
  const onFocusSpy = jest.fn();

  it('should render a rich text field', () => {
    const props = {
      editLocale: 'fr',
      input: {
        name: 'text',
        onChange: onChangeSpy,
        onFocus: onFocusSpy,
        value: {
          en: createEditorStateFromText('Hello'),
          fr: createEditorStateFromText('Bonjour')
        }
      },
      label: 'Text',
      meta: {
        error: '',
        touched: false
      }
    };
    const component = renderer.create(
      <DummyForm>
        <MultilingualRichTextFieldAdapter {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a rich text field with attachment button', () => {
    const props = {
      editLocale: 'fr',
      input: {
        name: 'text',
        onChange: onChangeSpy,
        onFocus: onFocusSpy,
        value: {
          en: createEditorStateFromText('Hello'),
          fr: createEditorStateFromText('Bonjour')
        }
      },
      label: 'Text',
      meta: {
        error: '',
        touched: false
      },
      withAttachmentButton: true
    };
    const component = renderer.create(
      <DummyForm>
        <MultilingualRichTextFieldAdapter {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a required rich text field', () => {
    const props = {
      editLocale: 'fr',
      input: {
        name: 'text',
        onChange: onChangeSpy,
        onFocus: onFocusSpy,
        value: {
          en: createEditorStateFromText('Hello'),
          fr: createEditorStateFromText('Bonjour')
        }
      },
      label: 'Text',
      meta: {
        error: '',
        touched: false
      },
      required: true
    };
    const component = renderer.create(
      <DummyForm>
        <MultilingualRichTextFieldAdapter {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a rich text field without value', () => {
    const props = {
      editLocale: 'fr',
      input: {
        name: 'text',
        onChange: onChangeSpy,
        onFocus: onFocusSpy,
        value: {}
      },
      label: 'Text',
      meta: {
        error: '',
        touched: false
      }
    };
    const component = renderer.create(
      <DummyForm>
        <MultilingualRichTextFieldAdapter {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a rich text field untouched with error', () => {
    const props = {
      editLocale: 'fr',
      input: {
        name: 'text',
        onChange: onChangeSpy,
        onFocus: onFocusSpy,
        value: {}
      },
      label: 'Text',
      meta: {
        error: 'This field is required',
        touched: false
      }
    };
    const component = renderer.create(
      <DummyForm>
        <MultilingualRichTextFieldAdapter {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a rich text field touched with error', () => {
    const props = {
      editLocale: 'fr',
      input: {
        name: 'text',
        onChange: onChangeSpy,
        onFocus: onFocusSpy,
        value: {}
      },
      label: 'Text',
      meta: {
        error: 'This field is required',
        touched: true
      }
    };
    const component = renderer.create(
      <DummyForm>
        <MultilingualRichTextFieldAdapter {...props} />
      </DummyForm>
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});