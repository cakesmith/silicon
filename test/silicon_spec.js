var Silicon;

describe('silicon', function () {

  beforeEach(function () {

    Silicon = require('../src/silicon');

  });

  it('should be sane', function () {

    expect(true).toBe(true);

  });

  it('should be defined', function () {

    expect(Silicon).toBeDefined();
    expect(Silicon.chips).toBeDefined();

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

      Silicon.add(xor);

    });

    it('should add a simple chip', function () {

      expect(Silicon.chips['xor']).toBeDefined();

    });

    it('should simulate the chip', function () {

      var xorSim = Silicon.simulate('xor');
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


      rsLatchChip = Silicon.add(rsLatch);
      rs = rsLatchChip.simulate();

    });

    it('should add the rsLatch', function () {

      expect(Silicon.chips.rsLatch).toBeDefined();

    });

    it('should resolve a circular dependency if it stabilizes', function () {

      expect(rs(0, 0)).toEqual({q: 0, notQ: -1});
      expect(rs(0, -1)).toEqual({q: -1, notQ: 0});
      expect(rs(0, 0)).toEqual({q: -1, notQ: 0});
      expect(rs(-1, 0)).toEqual({q: 0, notQ: -1});
      expect(rs(0, 0)).toEqual({q: 0, notQ: -1});


    });

    it('should reset internal signals', function () {

      var rs = Silicon.simulate('rsLatch');
      expect(rs(0, 0)).toEqual({q: 0, notQ: -1});
      expect(rs(0, -1)).toEqual({q: -1, notQ: 0});
      expect(rs(0, 0)).toEqual({q: -1, notQ: 0});

      rs.reset();

      expect(rs(0, 0)).toEqual({q: 0, notQ: -1});
      expect(rs(0, -1)).toEqual({q: -1, notQ: 0});
      expect(rs(0, 0)).toEqual({q: -1, notQ: 0});

      Silicon.reset('rsLatch');

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

      Silicon.add(circular);


    });


    it('should detect a true circular definition that does not stabilize', function () {

      var circle = Silicon.simulate('circular');
      var errorMsg = 'Error: Chip "circular" does not stabilize in 2 iterations. This could be due to a circular dependency.';
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

      Silicon.add(xor);

    });

    it('should resolve signal objects', function () {

      expect(Silicon.chips['xor']['arch']).toEqual({
        out     : {or: ['_signal0', '_signal2']},
        _signal0: {and: ['a', '_signal1']},
        _signal2: {and: ['_signal3', 'b']},
        _signal1: {not: ['b']},
        _signal3: {not: ['a']}
      });

    });

  });

  describe('plugins', function() {



  });


});