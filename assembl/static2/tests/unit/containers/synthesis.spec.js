import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import Synthesis from '../../../js/app/containers/synthesis';

describe('This test concern Synthesis component', () => {
  it('Should test React renderer', () => {
    const renderer = ReactTestRenderer.create(
      <Synthesis />
      );
    const result = renderer.toJSON();
    const expectedResult = {"children": [{"children": ["Panel Title"], "props": {}, "type": "span"}], "props": {}, "type": "p"};
    expect(result).toEqual(expectedResult);
  });
});