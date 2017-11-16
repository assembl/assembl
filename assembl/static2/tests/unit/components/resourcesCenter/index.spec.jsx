import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import ResourcesCenter from '../../../../js/app/components/resourcesCenter';

describe('ResourcesCenter component', () => {
  it('should render the list of resources', () => {
    const headerBackgroundUrl = 'https://framapic.org/OXN2uadCiz5c/LtgDfpT5JnNV.png';
    const headerTitle = 'Centre de ressources en ligne';
    const mockResources = [
      {
        doc: null,
        embedCode: 'https://www.youtube.com/embed/3m7BgIvC-uQ',
        image: null,
        text:
          '<p>Le 1er octobre, deux millions de Catalans (soit 43 % des électeurs) se prononcent ' +
          'à 90 % pour l’indépendance de leur région, au cours d’un référendum jugé illégal par le ' +
          'pouvoir central espagnol et empêché, parfois brutalement, par les forces de l’ordre.</p>',
        title: 'La crise en Catalogne'
      },
      {
        doc: 'https://wwww.fakeurl.com',
        embedCode: null,
        image: 'http://img.lemde.fr/2017/11/13/0/0/3847/2565/534/0/60/0/aaa6aa4_31822-8xbq9n.k1vw019k9.jpg',
        text:
          '<p>Depuis sa réouverture, il y a un an, la salle emblématique tente d’écrire une ' +
          'nouvelle page de son histoire.</p>',
        title: 'Autre titre'
      },
      {
        doc: null,
        embedCode: 'https://www.youtube.com/embed/3m7BgIvC-uQ',
        image: 'http://img.lemde.fr/2017/11/13/0/0/3847/2565/534/0/60/0/aaa6aa4_31822-8xbq9n.k1vw019k9.jpg',
        text:
          '<p>Les données rassemblées par les scientifiques du GCP suggèrent en outre que le ' +
          'découplage entre croissance économique et croissance des émissions de carbone est ' +
          'possible</p>',
        title: 'I add both an image and a video'
      }
    ];
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(
      <ResourcesCenter resources={mockResources} headerBackgroundUrl={headerBackgroundUrl} headerTitle={headerTitle} />
    );
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});