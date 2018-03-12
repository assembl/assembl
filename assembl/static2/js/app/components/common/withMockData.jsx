import React from 'react';

// $FlowFixMe
export const withMockData = data => Component => props => <Component {...data} {...props} />;