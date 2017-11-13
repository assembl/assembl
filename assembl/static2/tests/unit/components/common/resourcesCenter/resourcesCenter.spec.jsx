import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import ResourcesCenter from '../../../../../js/app/components/resourcesCenter/resourcesCenter';

describe('ResourcesCenter component', () => {
  it('should render the list of resources', () => {
    const headerBackgroundUrl = 'https://framapic.org/OXN2uadCiz5c/LtgDfpT5JnNV.png';
    const mockResources = [
      {
        doc: null,
        embedCode: 'https://www.youtube.com/embed/3m7BgIvC-uQ',
        image: null,
        text:
          '<p>Le 1er octobre, deux millions de Catalans (soit 43 % des électeurs) se prononcent à 90 % pour l’indépendance de leur région, au cours d’un référendum jugé illégal par le pouvoir central espagnol et empêché, parfois brutalement, par les forces de l’ordre.</p><p>Dans les jours suivants, la tension gagne la rue, avec une grève générale le 3 octobre, suivie de plusieurs manifestations d’indépendantistes, mais aussi des rassemblements de partisans de l’unité avec l’Espagne.</p><p>Sur le plan politique, le président catalan, Carles Puigdemont, et le chef du gouvernement espagnol, Mariano Rajoy, ne parviennent pas à nouer un dialogue autrement que par ultimatums.</p>',
        title: 'La crise en Catalogne'
      },
      {
        doc: 'https://wwww.fakeurl.com',
        embedCode: null,
        image: 'http://img.lemde.fr/2017/11/13/0/0/3847/2565/534/0/60/0/aaa6aa4_31822-8xbq9n.k1vw019k9.jpg',
        text:
          '<p>Depuis sa réouverture, il y a un an, la salle emblématique tente d’écrire une nouvelle page de son histoire. Avec près de 80 000 spectateurs venus assister à une cinquantaine de concerts ou autres spectacles, le Bataclan – dont la capacité d’accueil a augmenté de deux cents places (1 700 aujourd’hui) – affiche, d’après la société de production Alias, cogérante du lieu, un taux de remplissage de plus de 90 %. Elle subit toutefois une baisse de plus de 20 % du nombre d’événements organisés, comparé au rythme d’avant le drame. Jusqu’à ce lundi soir, Xavier n’avait jamais vraiment eu l’occasion de repasser devant la salle de spectacle. Comme de nombreux Parisiens, il était venu le lendemain de l’attaque terroriste déposer une bougie. Puis, plus rien. « Bizarre » d’ailleurs de revenir. Le soir du 13 novembre 2015, il aurait dû assister au concert des Eagles of Death Metal. A l’époque encore étudiant, il avait finalement annulé sa place pour ne pas manquer ses cours du soir. « Je dois potentiellement ma vie à mon assiduité », relève-t-il, enveloppé dans un manteau en laine. Alors, « ce soir, quand du balcon du premier étage je regarderai la fosse, je repenserai sûrement à ce qu’il s’est passé. Mais le Bataclan reste une institution », lançait-il quelques minutes avant de pénétrer dans le bâtiment surveillé par une poignée d’agents de sécurité.</p>',
        title: 'Autre titre'
      },
      {
        doc: null,
        embedCode: 'https://www.youtube.com/embed/3m7BgIvC-uQ',
        image: 'http://img.lemde.fr/2017/11/13/0/0/3847/2565/534/0/60/0/aaa6aa4_31822-8xbq9n.k1vw019k9.jpg',
        text:
          '<p>Les données rassemblées par les scientifiques du GCP suggèrent en outre que le découplage entre croissance économique et croissance des émissions de carbone est possible : au cours de la décennie 2007-2016, vingt-deux pays représentant un cinquième des émissions mondiales ont ainsi vu leurs productions de CO2 décroître tout en parvenant à faire croître leur économie. C’est toutefois encore loin d’être une règle générale. Au cours des dix dernières années et dans la majorité des cas – pour cent un pays représentant la moitié des émissions –, faire grimper le produit intérieur brut entraîne mécaniquement la production de CO2. « En dépit de la hausse de 2017, il est peu probable que les émissions mondiales reviennent à des taux de croissance durablement élevés, comme ce qui a été observé dans les années 2000 avec des augmentations de plus de 2 % par an, écrivent les chercheurs. Il est plus probable que les émissions vont se stabiliser, ou croître légèrement, grosso modo en accord avec les engagements nationaux soumis dans le cadre de l’accord de Paris. » Cependant, ces engagements sont encore loin de mettre l’atmosphère terrestre sur la trajectoire des 2 0C de réchauffement. Une semaine avant le début de la COP23, une autre synthèse, supervisée cette fois par le Programme des Nations unies pour l’environnement (PNUE), jugeait insuffisants les engagements nationaux pris fin 2015 pour contenir le réchauffement sous le seuil critique des 2 0C. A supposer que les 195 Etats signataires de l’accord de Paris respectent l’intégralité de leurs promesses, la planète s’achemine vers une hausse du thermomètre d’au moins 3 0C à la fin du siècle, alertent les experts onusiens.</p>',
        title: 'I add both an image and a video'
      }
    ];
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<ResourcesCenter resources={mockResources} headerBackgroundUrl={headerBackgroundUrl} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});