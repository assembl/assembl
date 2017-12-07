import React from 'react';
import renderer from 'react-test-renderer';

import CardList from '../../../../js/app/components/common/cardList';
import { CLASS_NAME_GENERATOR } from '../../../../js/app/utils/cardList';

describe('CardList component', () => {
  it('should match CardList snapshot', () => {
    const data = [{ title: 'Foo' }, { title: 'Bar' }];
    const rendered = renderer
      .create(
        <CardList
          data={data}
          classNameGenerator={CLASS_NAME_GENERATOR.default}
          itemClassName="classFoo"
          CardItem={itemData => <div>{itemData.title}</div>}
        />
      )
      .toJSON();
    expect(rendered).toMatchSnapshot();
  });
});