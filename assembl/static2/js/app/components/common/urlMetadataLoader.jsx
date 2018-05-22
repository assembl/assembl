import React from 'react';

import Loader from './loader';
import UrlPreview from './urlPreview';
import { fetchURLMetadata } from '../../utils/urlPreview';

class URLMetadataLoader extends React.Component {
  state = {
    loading: true,
    error: false,
    metadata: null
  };

  componentDidMount() {
    // fetch the URL metadata from our web service
    fetchURLMetadata(
      this.props.url,
      (metadata) => {
        this.setState({ loading: false, metadata: metadata });
      },
      () => {
        this.setState({ loading: false, error: true });
      }
    );
  }

  render() {
    const { loading, error, metadata } = this.state;
    if (loading) return <Loader />;
    return !error && <UrlPreview {...metadata} />;
  }
}

export default URLMetadataLoader;