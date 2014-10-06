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

      expect(Silicon.chips['xor']).toEqual(xor);

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

    var rsLatch;

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


      Silicon.add(rsLatch);

    });

    it('should add the rsLatch', function () {

      expect(Silicon.chips.rsLatch).toEqual(rsLatch);

    });

    it('should simulate a function with a circular dependency', function () {

      var rs = Silicon.simulate('rsLatch');
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


    });
  });

  describe('reursive function: circular', function () {

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


    it('should simulate circular definition', function () {

      var circle = Silicon.simulate('circular');

      expect(circle()).toEqual(-1);
      expect(circle()).toEqual(0);
      expect(circle()).toEqual(-1);

    });
  });


});