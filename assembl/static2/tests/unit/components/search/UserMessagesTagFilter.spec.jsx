import React from 'react';
import ReactTestUtils from 'react-dom/test-utils';
import { SearchkitManager } from 'searchkit';

import UserMessagesTagFilter from '../../../../js/app/components/search/UserMessagesTagFilter';

let component;
let queryToggleSpy;
let creatorIdToggleSpy;
let typeToggleSpy;
let performSearchSpy;

describe('UserMessagesTagFilter component', () => {
  beforeEach(() => {
    const searchkit = SearchkitManager.mock();
    creatorIdToggleSpy = jest.fn();
    typeToggleSpy = jest.fn();
    queryToggleSpy = jest.fn();
    performSearchSpy = jest.fn();
    searchkit.accessors = {
      statefulAccessors: {
        creator_id: {
          state: {
            toggle: creatorIdToggleSpy
          }
        },
        type: {
          state: {
            toggle: typeToggleSpy
          }
        }
      },
      queryAccessor: {
        state: {
          toggle: queryToggleSpy
        }
      }
    };
    searchkit.performSearch = performSearchSpy;
    component = ReactTestUtils.renderIntoDocument(<UserMessagesTagFilter searchkit={searchkit} value="John Doe" />);
  });

  describe('handleClick method', () => {
    it('should select posts from a user', () => {
      component.handleClick();
      expect(queryToggleSpy.mock.calls.length).toBe(1);
      expect(queryToggleSpy.mock.calls[0][0]).toBe(null);
      expect(creatorIdToggleSpy.mock.calls.length).toBe(1);
      expect(creatorIdToggleSpy.mock.calls[0][0]).toBe('John Doe');
      expect(typeToggleSpy.mock.calls.length).toBe(1);
      expect(typeToggleSpy.mock.calls[0][0]).toBe('post');
      expect(performSearchSpy.mock.calls.length).toBe(1);
    });
  });

  describe('isActive method', () => {
    it('should always return false', () => {});
  });
});