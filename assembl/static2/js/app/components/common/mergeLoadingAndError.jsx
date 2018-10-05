// @flow
import * as React from 'react';

type QueryMetadata = {
  error: ?Error,
  loading: boolean
};

export default (queryMetadatasNames: Array<string>) => (WrappedComponent: React.ComponentType<any>) => (
  props: Object
): React.Node => {
  const queryMetadatas: Array<QueryMetadata> = queryMetadatasNames.map(name => props[name]).filter(metadata => metadata);
  const firstMetadataWithError = queryMetadatas.find(metadata => metadata.error);
  const error = firstMetadataWithError ? firstMetadataWithError.error : undefined;
  const loading = queryMetadatas.some(metadata => metadata.loading);
  return <WrappedComponent {...props} error={error} loading={loading} />;
};