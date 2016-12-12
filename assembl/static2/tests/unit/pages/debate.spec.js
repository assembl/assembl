import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import Debate from '../../../js/app/pages/debatePage.js';

describe('This test concern debate component', () => {
    it('Should test React renderer', () => {
        const renderer = ReactTestRenderer.create(
            <Debate/>
        );
        const result = renderer.toJSON();
        const expectedResponse = {
            type:'p',
            props:{},
            children:['Hello World! This is the new Assembl frontend!']
        };
        expect(result).toEqual(expectedResponse);
    });
});