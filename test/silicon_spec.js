var Si;

describe('silicon', function () {

  beforeEach(function () {

    Si = require('../src/silicon');

  });

  it('should be sane', function () {

    expect(true).toBe(true);

  });

  it('should be defined', function () {

    expect(Si).toBeDefined();
    expect(Si.using).toEqual('basic')

  });

  describe('linear functions', function () {

    var xor;

    beforeEach(function () {

      xor = {

        name: 'xor',

        in : ['a', 'b'],
        out: 'out',

        arch: {
          nota: {not: 'a'},
          notb: {not: 'b'},
          w1  : {and: ['a', 'notb']},
          w2  : {and: ['nota', 'b']},
          out : {or: ['w1', 'w2']}
        }
      };

      Si.add(xor);

    });

    it('should add a simple chip', function () {

      expect(Si.library['xor']).toBeDefined();

    });

    it('should simulate the chip', function () {

      var xorSim = Si.simulate('xor');
      expect(xorSim(0, 0)).toBe(0);
      expect(xorSim(-1, 0)).toBe(-1);
      expect(xorSim(0, -1)).toBe(-1);
      expect(xorSim(-1, -1)).toBe(0);

    });

  });

  describe('recursive function: latch', function () {

    var rs, rsLatch, rsLatchChip;

    beforeEach(function () {

      rsLatch = {
        name: 'rsLatch',
        in  : ['r', 's'],
        out : ['q', 'notQ'],
        arch: {
          q   : {nor: ['r', 'notQ']},
          notQ: {nor: ['s', 'q']}
        }
      };


      rsLatchChip = Si.add(rsLatch);
      rs = rsLatchChip.simulate();

    });

    it('should add the rsLatch', function () {

      expect(Si.library.rsLatch).toBeDefined();

    });

    it('should resolve a circular dependency if it stabilizes', function () {

      expect(rs(0, 0)).toEqual({q: 0, notQ: -1});
      expect(rs(0, -1)).toEqual({q: -1, notQ: 0});
      expect(rs(0, 0)).toEqual({q: -1, notQ: 0});
      expect(rs(-1, 0)).toEqual({q: 0, notQ: -1});
      expect(rs(0, 0)).toEqual({q: 0, notQ: -1});


    });

    it('should reset internal signals', function () {

      var rs = Si.simulate('rsLatch');
      expect(rs(0, 0)).toEqual({q: 0, notQ: -1});
      expect(rs(0, -1)).toEqual({q: -1, notQ: 0});
      expect(rs(0, 0)).toEqual({q: -1, notQ: 0});

      rs.reset();

      expect(rs(0, 0)).toEqual({q: 0, notQ: -1});
      expect(rs(0, -1)).toEqual({q: -1, notQ: 0});
      expect(rs(0, 0)).toEqual({q: -1, notQ: 0});

      Si.reset('rsLatch');

      expect(rs(0, 0)).toEqual({q: 0, notQ: -1});

    });
  });

  describe('recursive function: circular', function () {

    var circular;

    beforeEach(function () {


      circular = {
        name: 'circular',
        in  : 'in',
        out : 'out',
        arch: {
          out: {not: 'out'}
        }

      };

      Si.add(circular);


    });


    it('should detect a true circular definition that does not stabilize', function () {

      var circle = Si.simulate('circular');
      var errorMsg = 'Error: Chip "circular" did not stabilize in 2 iterations due to a circular dependency: out -> not -> out';
      var returnValue;

      try {
        circle();
      } catch (e) {
        returnValue = e;
      }

      expect(returnValue).toBeDefined();
      expect(returnValue.toString()).toEqual(errorMsg);

    });
  });

  describe('signal objects', function () {

    var xor;

    beforeEach(function () {

      xor = {

        name: 'xor',

        in : ['a', 'b'],
        out: 'out',

        arch: {
          out: {or: [{and: ['a', {not: 'b'}]}, {and: [{not: 'a'}, 'b']}]}
        }
      };

      Si.add(xor);

    });

    it('should resolve signal objects', function () {

      expect(Si.library['xor']['arch']).toEqual({
        out     : {or: ['_signal0', '_signal2']},
        _signal0: {and: ['a', '_signal1']},
        _signal2: {and: ['_signal3', 'b']},
        _signal1: {not: ['b']},
        _signal3: {not: ['a']}
      });

    });

  });

  describe('synthesis', function() {







  });

  describe('changing packs', function() {

    var and;

    beforeEach(function() {

      Si.use('std_logic_1164');
      and = Si.simulate('and');

    });

    it('should have the new functionality', function() {

      expect(Si.using).toEqual('std_logic_1164');
      expect(and).toBeDefined();

    });

    it('should use the new functionality', function() {


      expect(and('U', 'X')).toEqual('U');


  });

    it('should call the after function', function() {

      expect(and(0, 1)).toEqual(0);

    });


    it('should throw an error on invalid inputs', function() {

      var t;

      try {
        and('foo', 'baz');
      } catch (e) {
        t = e;
      }

      expect(t.toString()).toEqual('Error: foo must be one of the types: 0,1,U,X,Z,W,L,H,-.');
    });


  });

  describe('std_logic_1164', function() {

    var names, chips, indexOf;
    var orTable, andTable, xorTable, notTable;

    beforeEach(function() {

      andTable = {
        'U': ['U', 'U', '0', 'U', 'U', 'U', '0', 'U', 'U'],
        'X': ['U', 'X', '0', 'X', 'X', 'X', '0', 'X', 'X'],
        '0': ['0', '0', '0', '0', '0', '0', '0', '0', '0'],
        '1': ['U', 'X', '0', '1', 'X', 'X', '0', '1', 'X'],
        'Z': ['U', 'X', '0', 'X', 'X', 'X', '0', 'X', 'X'],
        'W': ['U', 'X', '0', 'X', 'X', 'X', '0', 'X', 'X'],
        'L': ['0', '0', '0', '0', '0', '0', '0', '0', '0'],
        'H': ['U', 'X', '0', '1', 'X', 'X', '0', '1', 'X'],
        '-': ['U', 'X', '0', 'X', 'X', 'X', '0', 'X', 'X']
      };

      orTable = {
        'U': ['U', 'U', 'U', '1', 'U', 'U', 'U', '1', 'U'],
        'X': ['U', 'X', 'X', '1', 'X', 'X', 'X', '1', 'X'],
        '0': ['U', 'X', '0', '1', 'X', 'X', '0', '1', 'X'],
        '1': ['1', '1', '1', '1', '1', '1', '1', '1', '1'],
        'Z': ['U', 'X', 'X', '1', 'X', 'X', 'X', '1', 'X'],
        'W': ['U', 'X', 'X', '1', 'X', 'X', 'X', '1', 'X'],
        'L': ['U', 'X', '0', '1', 'X', 'X', '0', '1', 'X'],
        'H': ['1', '1', '1', '1', '1', '1', '1', '1', '1'],
        '-': ['U', 'X', 'X', '1', 'X', 'X', 'X', '1', 'X']
      };

      xorTable = {
        'U': ['U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U'],
        'X': ['U', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'],
        '0': ['U', 'X', '0', '1', 'X', 'X', '0', '1', 'X'],
        '1': ['U', 'X', '1', '0', 'X', 'X', '1', '0', 'X'],
        'Z': ['U', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'],
        'W': ['U', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'],
        'L': ['U', 'X', '0', '1', 'X', 'X', '0', '1', 'X'],
        'H': ['U', 'X', '1', '0', 'X', 'X', '1', '0', 'X'],
        '-': ['U', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X']
      };

      notTable = ['U', 'X', '1', '0', 'X', 'X', '1', '0', 'X'];


      indexOf = {
        'U': 0,
        'X': 1,
        '0': 2,
        '1': 3,
        'Z': 4,
        'W': 5,
        'L': 6,
        'H': 7,
        '-': 8
      };

      names = [
        'and',
        'nand',
        'or',
        'nor',
        'xor',
        'xnor',
        'not'
      ];

      chips = {};

      names.forEach(function(chip) {
        chips[chip]= Si.simulate(chip);
      });

    });


    it('should be using the correct pack', function() {

      expect(Si.using).toEqual('std_logic_1164');

    });

    it('and function', function() {

      for(a in indexOf) {
        for(b in andTable) {
          expect(chips.and(a, b).toString()).toEqual(andTable[b][indexOf[a]].toString());
        }
      }

    });

    it('or function', function() {

      for(a in indexOf) {
        for(b in orTable) {
          expect(chips.or(a, b).toString()).toEqual(orTable[b][indexOf[a]].toString());
        }
      }

    });

    it('nor function', function() {

      for(a in indexOf) {
        for(b in orTable) {
          expect(chips.nor(a, b).toString()).toEqual(chips.not(chips.or(a,b)).toString());
        }
      }


    });

    it('xor function', function() {

      for(a in indexOf) {
        for(b in xorTable) {
          expect(chips.xor(a, b).toString()).toEqual(xorTable[b][indexOf[a]].toString());
        }
      }


    });

    it('xnor function', function() {

      for(a in indexOf) {
        for(b in xorTable) {
          expect(chips.xnor(a, b).toString()).toEqual(chips.not(xorTable[b][indexOf[a]]).toString());
        }
      }


    });

    it('not function', function() {


      for (a in indexOf) {
        expect(chips.not(a).toString()).toEqual(notTable[indexOf[a]].toString());
      }


    });

  });


});
