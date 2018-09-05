import { getAdminMenuSection } from '../../../../js/app/utils/administration/menu';

describe('Menu', () => {
  describe('Menu section getter', () => {
    it('should return the menu section', () => {
      const menu = {
        foo: {
          title: 'Foo',
          sectionId: 'foo-id',
          subMenu: {
            subFoo: {
              title: 'Sub Foo',
              sectionId: 'sub-foo-id'
            }
          }
        },
        bar: {
          title: 'Bar',
          sectionId: 'bar-id'
        }
      };

      let section = getAdminMenuSection('foo-id.sub-foo-id', menu);
      expect(section.sectionId).toEqual('sub-foo-id');
      expect(section.title).toEqual('Sub Foo');
      section = getAdminMenuSection('bar-id', menu);
      expect(section.sectionId).toEqual('bar-id');
      expect(section.title).toEqual('Bar');
    });
  });
});