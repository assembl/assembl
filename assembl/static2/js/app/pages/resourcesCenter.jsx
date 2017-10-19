import React from 'react';
import Header from '../components/common/header';
import ResourceBlock from '../components/resourcesCenter/resourceBlock';

class ResourcesCenter extends React.Component {
  render() {
    const headerTitle = 'Centre de ressources en ligne';
    const headerImgUrl = 'http://i.f1g.fr/media/figaro/800x_crop/2015/06/24/XVMc0167212-19a9-11e5-8467-f08c778c772f-805x453.jpg';
    const resourceTitle = 'Economie - Rapport sur la réforme du Lorem ipsum et la chute des capitaux.';
    const resourceImgUrl = 'http://img.bfmtv.com/c/1256/708/6fe/831e6b4c6f0fb3ff26b8123515740.jpg';
    const resourceVideoUrl = 'https://player.vimeo.com/video/32975166';
    const bodyText =
      'Definitions abound and generally overlap by pointing to ‘agents’ (programs running on computer systems) able to learn, adapt and deploy themselves successfully in dynamic and uncertain environments. Intelligence in that sense intersects with autonomy, adaptability through the ability to learn from a dynamic environment. The ambiguity which has and still surrounds the notion of \'Artificial Intelligence\' calls for a little exercise in pedagogy over its definition, boundaries and dynamics.Definitions abound and generally overlap by pointing to ‘agents’... ';

    return (
      <div className="resources-center">
        <Header title={headerTitle} imgUrl={headerImgUrl} />
        <section>
          <ResourceBlock title={resourceTitle} imgUrl={resourceImgUrl} bodyText={bodyText} isDownload index={2} />
          <ResourceBlock title={resourceTitle} videoUrl={resourceVideoUrl} bodyText={bodyText} isDownload index={3} />
          <ResourceBlock title={resourceTitle} imgUrl={resourceImgUrl} bodyText={bodyText} index={4} />
          <ResourceBlock title={resourceTitle} imgUrl={resourceImgUrl} bodyText={bodyText} index={5} />
          <ResourceBlock title={resourceTitle} videoUrl={resourceVideoUrl} bodyText={bodyText} isDownload index={6} />
        </section>
      </div>
    );
  }
}

export default ResourcesCenter;