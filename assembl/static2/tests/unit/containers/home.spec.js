import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import Home from '../../../js/app/containers/home';

describe('This test concern Home component', () => {
  it('Should test React renderer', () => {
    const renderer = ReactTestRenderer.create(
      <Home />
      );
    const result = renderer.toJSON();
    const expectedResult = {"children": [{"children": ["Panel Title"], "props": {}, "type": "span"}], "props": {}, "type": "p"};
    expect(result).toEqual(expectedResult);
  });
});