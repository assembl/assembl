import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import Debate from '../../../js/app/containers/debate';

describe('This test concern Debate component', () => {
  it('Should test React renderer', () => {
    const renderer = ReactTestRenderer.create(
      <Debate />
      );
    const result = renderer.toJSON();
    const expectedResult = {"children": [{"children": ["Panel Title"], "props": {}, "type": "span"}], "props": {}, "type": "p"};
    expect(result).toEqual(expectedResult);
  });
});