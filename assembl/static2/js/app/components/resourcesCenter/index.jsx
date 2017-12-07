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
  text: string,
  image: Object,
  embedCode: string,
  doc: Object
};

type ResourcesCenterProps = {
  headerTitle: string,
  resources: Array<Resource>,
  headerBackgroundUrl: string
};

const ResourcesCenter = ({ resources, headerBackgroundUrl, headerTitle }: ResourcesCenterProps) => (
  <div className="resources-center">
    <Header title={headerTitle} imgUrl={headerBackgroundUrl} />
    <section>
      {resources.map((resource, index) => {
        const { title, text, embedCode, image, doc } = resource;
        return (
          <ResourceBlock title={title} text={text} embedCode={embedCode} image={image} doc={doc} index={index} key={index} />
        );
      })}
    </section>
  </div>
);

export default ResourcesCenter;