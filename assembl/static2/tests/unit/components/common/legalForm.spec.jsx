import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import ShallowRenderer from 'react-test-renderer/shallow';
import LegalForm from '../../../../js/app/components/login/legalForm';

import { closeModal } from '../../../../js/app/utils/utilityManager';

jest.mock('../../../../js/app/utils/utilityManager');

describe('LegalForm component', () => {
  const { renderIntoDocument, findRenderedDOMComponentWithClass, Simulate } = ReactTestUtils;
  const fakeTerms = `Armelle Le Comte (Oxfam). Les pays émergents représentent une grande diversité.
Un pays comme l’Inde a encore des centaines de millions d’habitants qui vivent
dans une pauvreté extrême, qui n’ont pas accès à l’électricité, par exemple.
Les pays émergents comme la Chine sont aussi très attrayants pour les investisseurs privés,
notamment pour développer les énergies renouvelables, ce qu’on appelle « l’atténuation ».
Les besoins en adaptation, eux, dépendent beaucoup plus des financements publics car ils sont
moins rentables. Il ne faut pas oublier non plus que les pays émergents et les pays en développement
plus pauvres investissent eux-mêmes des ressources financières domestiques considérables pour faire
face aux impacts du changement. Un pays comme la Tanzanie, par exemple, mobilise bien plus dans son
budget national pour le climat que ce qu’elle reçoit des bailleurs internationaux.
Maxime : Quelle est la contrepartie exigée des pays bénéficiaires, en particulier en termes
d’évaluation indépendante des projets financés ? Armelle Le Comte. Chaque bailleur international
a ses propres modalités de mise en œuvre et d’exigence vis-à-vis des pays bénéficiaires qu’il soutient.
Ces règles sont strictes et complexes d’un point de vue administratif pour des pays en développement
qui disposent souvent de peu de personnel. Certains fonds bilatéraux passent directement d’un Etat
à un autre, d’autres transitent par des ONG qui mènent directement des projets sur le terrain.
Cela étant dit, les bailleurs doivent améliorer la transparence des projets qu’ils soutiennent
sur le terrain. L’Agence française de développement, par exemple, ne donne pas toujours toutes
les informations, notamment en ce qui concerne les impacts sociaux et environnementaux.`;
  const style = { height: '350px', width: '440px' };
  const handleAcceptButtonSpy = jest.fn(() => {});
  const props = {
    style: style,
    text: fakeTerms,
    handleAcceptButton: handleAcceptButtonSpy,
    legalContentsType: 'termsAndConditions'
  };

  it('should not render an Accept Button when terms are not scrolled down', () => {
    const renderer = new ShallowRenderer();
    const component = renderer.render(<LegalForm {...props} />);
    const findButton = () => {
      findRenderedDOMComponentWithClass(component, 'button-submit button-dark terms-submit');
    };
    expect(findButton).toThrow();
  });
  it('should render an Accept Button when terms are scrolled down and checkbox not checked in SignupForm', () => {
    const component = renderIntoDocument(<LegalForm {...props} />);

    const box = findRenderedDOMComponentWithClass(component, 'terms-box justify');
    box.scrollTop = box.clientHeight;
    box.dispatchEvent(new window.UIEvent('scroll', { detail: 0 }));
    findRenderedDOMComponentWithClass(component, 'button-submit button-dark terms-submit');
  });
  it('should render an Accept Button and clicking on it should call handleAcceptButton and closeModal', () => {
    const component = renderIntoDocument(<LegalForm {...props} />);
    const box = findRenderedDOMComponentWithClass(component, 'terms-box justify');
    box.scrollTop = box.clientHeight;
    box.dispatchEvent(new window.UIEvent('scroll', { detail: 0 }));
    const button = findRenderedDOMComponentWithClass(component, 'button-submit button-dark terms-submit');
    Simulate.click(button);
    expect(handleAcceptButtonSpy).toBeCalled();
    expect(closeModal).toBeCalled();
  });
  it('should not render an Accept Button when terms are partially scrolled down and checkbox not checked in SignupForm', () => {
    const component = renderIntoDocument(<LegalForm {...props} />);
    const box = findRenderedDOMComponentWithClass(component, 'terms-box justify');
    box.scrollTop = 10;
    box.dispatchEvent(new window.UIEvent('scroll', { detail: 0 }));
    const findButton = () => {
      findRenderedDOMComponentWithClass(component, 'button-submit button-dark terms-submit');
    };
    expect(findButton).toThrow();
  });
  it('should not render an Accept Button when terms are scrolled down and checkbox is already checked in SignupForm', () => {
    const component = renderIntoDocument(<LegalForm {...props} checked />);
    const box = findRenderedDOMComponentWithClass(component, 'terms-box justify');
    box.dispatchEvent(new window.UIEvent('scroll', { detail: 0 }));
    const findButton = () => {
      findRenderedDOMComponentWithClass(component, 'button-submit button-dark terms-submit');
    };
    expect(findButton).toThrow();
  });

  it('should match snapshot', () => {
    const renderer = new ShallowRenderer();
    renderer.render(<LegalForm {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});