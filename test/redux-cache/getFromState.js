import chai from 'chai';
import {getFromState, getDataAndMemoize, getTree} from '../../redux-cache/redux-cache';

let state =  {
    user: {
        1: {
            id:1,
            firstname: 'John',
            lastname: 'Silver',
            friends: [{$type: 'ref', $path: ["user", 3]}],
            friendsWithTile:[{firstname:'Jack'}]
        },
        3: {
            id:3,
            firstname: 'Jack',
            lastname: 'Black',
            friends: [{$type: 'ref', $entity: "user", $id:5}, {$type: 'ref', $path: ["user", 1]}]
        },
        5: {
            id:5,
            firstname: 'Dan'
        },
        6: {
            id: 6,
            firstname: 'Jules'
        },
        7: {
            id: 7,
            lastname: 'Verne'
        },
        8:{
            id:8,
            firstname: 'Jane',
            friends: [{$type: 'ref', $entity: "user", $id:6}, {$type: 'ref', $path: ["user", 7]}]
        }

    }
};

describe('redux-cache', ()=> {
    describe('getFromState', ()=> {
        it('should return data when data is available', ()=> {
            var path = ['user', 1, 'lastname'];
            const expectedResult = 'Silver';
            const result = getFromState(state, path);
            chai.expect(result).to.equal(expectedResult);
        });

        it('should return reference when instructed not to follow', ()=> {
            var path = ['user', 1, 'friends', 0];
            const expectedResult = {$type: 'ref', $path: ["user", 3]};
            const result = getFromState(state, path, undefined, {followRefs:false});
            chai.expect(result).to.deep.equal(expectedResult);
        });

        it('should return object referred to when encountering reference', ()=> {
            var path = ['user', 1, 'friends', 0];
            const expectedResult = {
                id:3,
                firstname: 'Jack',
                lastname: 'Black',
                friends: [{$type: 'ref', $entity: "user", $id:5}, {$type: 'ref', $path: ["user", 1]}]
            };
            const result = getFromState(state, path);
            chai.expect(result).to.deep.equal(expectedResult);
        });

        it('should return end data when encountering reference and path continues', ()=> {
            var path = ['user', 1, 'friends', 0, 'firstname'];
            const expectedResult = 'Jack';
            const result = getFromState(state, path);
            chai.expect(result).to.deep.equal(expectedResult);
        });

        it('should return empty object if data not available', ()=> {
            var path = ['user', 1, 'lastname1'];
            const expectedResult = undefined;
            const result = getFromState(state, path);
            chai.expect(result).to.deep.equal(expectedResult);
        });

        it('should return a partial data object of if data not available and asked to return partial', ()=> {
            var path = ['user', 1, 'lastname1'];
            const expectedResult = {
                exists: false,
                deepestPath: ['user',1],
                deepestData: {
                    id:1,
                    firstname: 'John',
                    lastname: 'Silver',
                    friends: [{$type: 'ref', $path: ["user", 3]}]
                },
                pathLeft:['lastname1']
            };
            const result = getFromState(state, path, undefined, {followRefs:true, returnPartial:true});
            chai.expect(result).to.deep.equal(expectedResult);
        });
    });
    describe('setInState', ()=> {
        it('should return new data', ()=> {
            var path = ['user', 1, 'lastname'];
            const expectedResult = 'newName';
            const result = getFromState(state, path, undefined, {assign:true, assignData:'newName'});
            chai.expect(result).to.equal(expectedResult);
        });
    });
    describe('getTree', ()=>{
        describe('get and memoize', ()=> {
            it('should update state with memoize data from query', ()=> {
                var path = ['user', 1, 'lastname'];
                var query = `{
                    firstname,
                    id,
                    friends {
                        firstname
                    },
                    lastname
                }`;
                let t1 = getTree(state, query, ['user', 1]);
                const expectedResult = 'newName';
                const result = getFromState(state, path, undefined, {assign:true, assignData:'newName'});
                chai.expect(result).to.equal(expectedResult);
            });
        });
    });
});