import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import Ideas from '../../../js/app/containers/ideas';

describe('This test concern Ideas component', () => {
  it('Should test React renderer', () => {
    const renderer = ReactTestRenderer.create(
      <Ideas />
      );
    const result = renderer.toJSON();
    const expectedResult = {"children": [{"children": ["Panel Title"], "props": {}, "type": "span"}], "props": {}, "type": "p"};
    expect(result).toEqual(expectedResult);
  });
});