// @flow
import React from 'react';
import Header from '../common/header';
import ResourceBlock from './resourceBlock';

export type Media = {
  type: string,
  url: string
};

export type Resource = {
  title: string,
  description: string,
  media: Media,
  doc: string
};

type ResourcesCenterProps = {
  headerTitle: string,
  headerImage: string,
  resources: Array<Resource>
};

const ResourcesCenter = ({ headerTitle, headerImage, resources }: ResourcesCenterProps) => {
  return (
    <div className="resources-center">
      <Header title={headerTitle} imgUrl={headerImage} />
      <section>
        {resources.map((resource, index) => {
          const { title, description, media, doc } = resource;
          return <ResourceBlock title={title} description={description} media={media} doc={doc} index={index} key={index} />;
        })}
      </section>
    </div>
  );
};

export default ResourcesCenter;