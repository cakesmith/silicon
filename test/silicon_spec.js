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
      expect(xorSim(1, 0)).toBe(1);
      expect(xorSim(0, 1)).toBe(1);
      expect(xorSim(1, 1)).toBe(0);

    });

  });

  describe('recursive functions', function () {

    var rs;

    beforeEach(function () {

      rs = {
        name: 'rs',
        in  : ['r', 's'],
        out : 'q',
        arch: {
          q : {nor: ['r', 'n2']},
          n2: {nor: ['s', 'q']}
        }
      };

      Silicon.add(rs);

    });

    it('should add the rs latch', function () {

      expect(Silicon.chips.rs).toEqual(rs);

    });

    it('should not exceed maximum call stack', function () {

      var rsSim = Silicon.simulate('rs');
      expect(rsSim(0, 0)).toEqual({q: 1, n2: 0});


    });


  });

});