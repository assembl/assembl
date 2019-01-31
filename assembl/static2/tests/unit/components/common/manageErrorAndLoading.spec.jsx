// @flow
import React from 'react';
import renderer from 'react-test-renderer';

import manageErrorAndLoading, { TYPE } from '../../../../js/app/components/common/manageErrorAndLoading';

const DummyComponent = () => <div>My dummy component</div>;

describe('manageErrorAndLoading HOC', () => {
  it('should throw an error if error is not null/undefined', () => {
    const props = { displayLoader: true };
    const wrappedProps = {
      data: {},
      error: new Error('My awesome error'),
      loading: false
    };
    expect(() => manageErrorAndLoading(props)(DummyComponent)(wrappedProps)).toThrowError('GraphQL error');
  });

  it('should throw an error if error is not null/undefined', () => {
    const props = { displayLoader: true };
    const wrappedProps = {
      data: {},
      error: new Error('My awesome error'),
      loading: false
    };
    expect(() => manageErrorAndLoading(props)(DummyComponent)(wrappedProps)).toThrowError('GraphQL error');
  });

  it('should render an error component if data.error or error is not null/undefined and type is watson', () => {
    const props = { displayLoader: true, loaderType: TYPE.SEMANTIC_ANALYSIS };
    const wrappedProps = {
      data: {
        error: new Error('My graphql error')
      }
    };
    const rendered = renderer.create(manageErrorAndLoading(props)(DummyComponent)(wrappedProps)).toJSON();
    expect(rendered).toMatchSnapshot();
  });

  it('should return null if data are loading and we don\'t want to display a loader (use data prop)', () => {
    const props = { displayLoader: false };
    const wrappedProps = {
      data: {
        error: null,
        loading: true
      }
    };
    expect(manageErrorAndLoading(props)(DummyComponent)(wrappedProps)).toBeNull();
  });

  it('should return null if data are loading and we don\'t want to display a loader', () => {
    const props = { displayLoader: false };
    const wrappedProps = {
      data: {},
      error: null,
      loading: true
    };
    expect(manageErrorAndLoading(props)(DummyComponent)(wrappedProps)).toBeNull();
  });

  it('should display a loader if data are loading and we want to display a loader (use data prop)', () => {
    const props = { displayLoader: true };
    const wrappedProps = {
      data: {
        error: null,
        loading: true
      }
    };
    const rendered = renderer.create(manageErrorAndLoading(props)(DummyComponent)(wrappedProps)).toJSON();
    expect(rendered).toMatchSnapshot();
  });

  it('should display a loader if data are loading and we want to display a loader', () => {
    const props = { displayLoader: true };
    const wrappedProps = {
      data: {},
      error: null,
      loading: true
    };
    const rendered = renderer.create(manageErrorAndLoading(props)(DummyComponent)(wrappedProps)).toJSON();
    expect(rendered).toMatchSnapshot();
  });

  it('should render the component if everything is OK (use data prop)', () => {
    const props = { displayLoader: true };
    const wrappedProps = {
      data: {
        error: null,
        loading: false
      }
    };
    const rendered = renderer.create(manageErrorAndLoading(props)(DummyComponent)(wrappedProps)).toJSON();
    expect(rendered).toMatchSnapshot();
  });

  it('should render the component if everything is OK', () => {
    const props = { displayLoader: true };
    const wrappedProps = {
      data: {},
      error: null,
      loading: false
    };
    const rendered = renderer.create(manageErrorAndLoading(props)(DummyComponent)(wrappedProps)).toJSON();
    expect(rendered).toMatchSnapshot();
  });
});