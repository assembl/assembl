/*
  Higher order component with local content locale in its state and global content locale from store
*/
import React from 'react';

const withContentLocale = (WrappedComponent) => {
  return class ContentLocaleWrapper extends React.Component {
    constructor() {
      super();
      this.state = {
        contentLocale: undefined
      };
    }

    updateLocalContentLocale = (value) => {
      return this.setState({ contentLocale: value });
    };

    getContentLocale = () => {
      if (this.state.contentLocale) {
        return this.state.contentLocale;
      }

      const { globalContentLocale, originalLocale } = this.props;
      if (originalLocale !== 'und' && globalContentLocale.has(originalLocale)) {
        return globalContentLocale.get(originalLocale);
      }

      // no translation is asked, get the content with the site language
      return this.props.contentLocale;
    };

    render() {
      const contentLocale = this.getContentLocale();
      console.log('pass ', contentLocale);
      return (
        <WrappedComponent
          {...this.props}
          localContentLocale={this.state.contentLocale}
          updateLocalContentLocale={this.updateLocalContentLocale}
          contentLocale={contentLocale}
        />
      );
    }
  };
};

export default withContentLocale;