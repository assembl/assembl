import React from 'react';
import renderer from 'react-test-renderer';

import AtomicBlockRenderer from '../../../../../js/app/components/common/richTextEditor/atomicBlockRenderer';

function Entity(data, type) {
  this.data = data;
  this.type = type;
  this.getData = function () {
    return this.data;
  };
  this.getType = function () {
    return this.type;
  };
}

describe('AtomicBlockRenderer component', () => {
  it('should render an image block', () => {
    const data = {
      title: 'Foobar',
      externalUrl: 'http://www.example.com/foobar.jpg',
      mimeType: 'image'
    };
    const fakeEntity = new Entity(data, 'document');
    const fakeContentState = {
      getEntity: (key) => {
        if (key === '0') {
          return fakeEntity;
        }
        return null;
      }
    };
    const fakeBlock = {
      getEntityAt: offset => offset.toString() // fake entity key
    };

    const props = {
      block: fakeBlock,
      contentState: fakeContentState
    };

    const component = renderer.create(<AtomicBlockRenderer {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});