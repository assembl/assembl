// @flow
import * as React from 'react';

type Props = {
  children: React.Node,
  className: string,
  entityKey: string,
  getEditorState: Function
};

const Link = ({ children, className, entityKey, getEditorState }: Props) => {
  const entity = getEditorState()
    .getCurrentContent()
    .getEntity(entityKey);
  const entityData = entity ? entity.get('data') : undefined;
  const href = (entityData && entityData.url) || undefined;
  const target = (entityData && entityData.target) || undefined;
  const title = (entityData && entityData.title) || undefined;
  return (
    <a className={className} title={title} href={href} target={target} rel="noopener noreferrer">
      {children}
    </a>
  );
};

export default Link;