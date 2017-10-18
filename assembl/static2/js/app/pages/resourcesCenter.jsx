import React from 'react';
import Header from '../components/home/header';
import ResourceBlock from '../components/resourcesCenter/resourceBlock';

class ResourcesCenter extends React.Component {
  render() {
    const title = 'Economie - Rapport sur la réforme du Lorem ipsum et la chute des capitaux.';
    const imgUrl = 'http://img.bfmtv.com/c/1256/708/6fe/831e6b4c6f0fb3ff26b8123515740.jpg';
    const bodyText =
      'Definitions abound and generally overlap by pointing to ‘agents’ (programs running on computer systems) able to learn, adapt and deploy themselves successfully in dynamic and uncertain environments. Intelligence in that sense intersects with autonomy, adaptability through the ability to learn from a dynamic environment. The ambiguity which has and still surrounds the notion of \'Artificial Intelligence\' calls for a little exercise in pedagogy over its definition, boundaries and dynamics.Definitions abound and generally overlap by pointing to ‘agents’ (programs running on computer systems) able to learn, adapt and deploy themselves successfully in dynamic and uncertain environments. Intelligence in that sense intersects with autonomy, adaptability through the ability to learn from a dynamic environment. The ambiguity which has and still surrounds the notion of \'Artificial Intelligence\' calls for a little exercise in pedagogy over its definition, boundaries and dynamics. ';

    return (
      <div className="resources-center">
        <Header />
        <ResourceBlock title={title} imgUrl={imgUrl} bodyText={bodyText} index={1} />
        <ResourceBlock title={title} imgUrl={imgUrl} bodyText={bodyText} index={2} />
        <ResourceBlock title={title} imgUrl={imgUrl} bodyText={bodyText} index={3} />
        <ResourceBlock title={title} imgUrl={imgUrl} bodyText={bodyText} index={4} />
      </div>
    );
  }
}

export default ResourcesCenter;