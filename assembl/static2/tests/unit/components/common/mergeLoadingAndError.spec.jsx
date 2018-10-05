// @flow
import * as React from 'react';

import mergeLoadingAndError from '../../../../js/app/components/common/mergeLoadingAndError';

const DummyComponent = () => <div>My Dummy Component</div>;

describe('mergeLoadingAndError HOC', () => {
  it('should merge all loading and all errors props', () => {
    const queryMetadataNames = ['firstQuery', 'secondQuery'];
    const wrappedProps = {
      firstQuery: {
        error: null,
        loading: true
      },
      secondQuery: {
        error: new Error('Error in second query'),
        loading: false
      }
    };
    const decorated = mergeLoadingAndError(queryMetadataNames)(DummyComponent)(wrappedProps);
    // $FlowFixMe
    expect(decorated.props.error).toEqual(new Error('Error in second query'));
    // $FlowFixMe
    expect(decorated.props.loading).toBeTruthy();
  });

  it('should merge all loading and all errors props (no error and loading false)', () => {
    const queryMetadataNames = ['firstQuery', 'secondQuery'];
    const wrappedProps = {
      firstQuery: {
        error: undefined,
        loading: false
      },
      secondQuery: {
        error: undefined,
        loading: false
      }
    };
    const decorated = mergeLoadingAndError(queryMetadataNames)(DummyComponent)(wrappedProps);
    // $FlowFixMe
    expect(decorated.props.error).toBeUndefined();
    // $FlowFixMe
    expect(decorated.props.loading).toBeFalsy();
  });
});