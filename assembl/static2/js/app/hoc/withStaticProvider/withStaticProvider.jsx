import React, { Component } from 'react';
import Aux from '../aux/aux';

/*
  `withStaticProvider` component is a high order component used to
  wrap a container (page) or component in order to pass specific
  configuration to the descendant children without using props.
  In our case, we want to separate static logic from backend logic
  for HTML/CSS integration purpose

  params:
    * isStaticPage: flag that tells if we are in static page mode
    * WrappedComponent: component that should be wrapped

  examples :
    export withStaticProvider(true/false, Container/Component)
    export withStaticProvider(true, BrightMirrorShowPage)
    export withStaticProvider(false, NavBar)
*/

const withStaticProvider = (isStaticPage, WrappedComponent) => (
  class extends Component {
    state = {
      isStaticPage: isStaticPage
    };

    render() {
      return (
        <Aux>
          <WrappedComponent {...this.props} isStaticPage={this.state.isStaticPage} />
        </Aux>
      );
    }
  }
);

export default withStaticProvider;