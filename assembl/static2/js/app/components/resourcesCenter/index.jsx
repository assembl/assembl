// @flow
import * as React from 'react';
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

type Props = {
  headerBackgroundUrl: string,
  headerTitle: string,
  phaseId: string,
  resources: Array<Resource>
};

const ResourcesCenter = ({ headerBackgroundUrl, headerTitle, phaseId, resources }: Props) => (
  <div className="resources-center">
    <Header title={headerTitle} imgUrl={headerBackgroundUrl} type="resourcesCenter" phaseId={phaseId} />
    <section>
      {resources.map((resource, index) => {
        const { title, text, embedCode, image, doc, id } = resource;
        return <ResourceBlock title={title} text={text} embedCode={embedCode} image={image} doc={doc} index={index} key={id} />;
      })}
    </section>
  </div>
);

export default ResourcesCenter;