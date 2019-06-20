import React from 'react';
import renderer from 'react-test-renderer';
import ShallowRenderer from 'react-test-renderer/shallow';

import {
  DumbPostBody,
  ExtractInPost,
  Html,
  postBodyReplacementComponents
} from '../../../../../../js/app/components/debate/common/post/postBody';
import * as fakeData from '../../../harvesting/fakeData';

describe('PostBody component', () => {
  it('should render a post body', () => {
    const bodyDivRefSpy = jest.fn();
    const props = {
      body: '<p>You can\'t index the port without programming the wireless HTTP program!</p>',
      bodyDivRef: bodyDivRefSpy,
      bodyMimeType: 'text/*',
      contentLocale: 'fr',
      extracts: [],
      id: 'XYZ333',
      isHarvesting: true,
      dbId: 124,
      lang: 'fr',
      subject: <span>open-source Associate</span>,
      originalLocale: 'en',
      translate: true,
      translationEnabled: true,
      connectedUserId: null
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbPostBody {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});

describe('Html component', () => {
  const afterLoadSpy = jest.fn();
  const { extracts } = fakeData;
  const props = {
    extracts: extracts,
    rawHtml:
      'You can\'t <span id="message-body-local:Content/1010">index <a href="url">the port</a> without programming</div>' +
      ' the <div id="message-body-local:Content/2020">wireless HTTP program</div>! <iframe src="iframe-src"></iframe>' +
      'Look at our website <a href="https://github.com/">https://github.com/</a>' +
      '<img class="atomic-image" src="http://lorempixel.com/400/200/"/>',
    divRef: () => {},
    dbId: '3059',
    contentLocale: 'en'
  };
  const shallowRenderer = new ShallowRenderer();

  it('should render a html body with extracts', () => {
    const withExtractsProps = {
      replacementComponents: postBodyReplacementComponents(afterLoadSpy, true),
      ...props
    };
    shallowRenderer.render(<Html {...withExtractsProps} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  it('should render a html body without extracts', () => {
    const withoutExtractsProps = {
      replacementComponents: postBodyReplacementComponents(afterLoadSpy, false),
      ...props
    };
    shallowRenderer.render(<Html {...withoutExtractsProps} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});

describe('ExtractInPost component', () => {
  it('should render an extract in a post (submitted by robot)', () => {
    const props = {
      extractedByMachine: true,
      id: '889900',
      nature: 'Enum.actionable_action',
      state: 'SUBMITTED',
      children: 'text'
    };
    const component = renderer.create(<ExtractInPost {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an extract in a post', () => {
    const props = {
      extractedByMachine: false,
      id: '112233',
      nature: 'Enum.concept',
      state: 'PUBLISHED',
      children: 'text'
    };
    const component = renderer.create(<ExtractInPost {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a cognitive bias extract in a post', () => {
    const props = {
      extractedByMachine: false,
      id: '112233',
      nature: 'Enum.cognitive_bias',
      state: 'PUBLISHED',
      children: 'text'
    };
    const component = renderer.create(<ExtractInPost {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});