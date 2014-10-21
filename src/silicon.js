var debugging = false;

// Helper functions

function isObject(x) {
  return (Object.prototype.toString.call(x) === '[object Object]');
}
var Si = Silicon.prototype;

// Chip packages

Si.pack = {};
Si.pack['basic'] = (function () {
  var basic = {};

  basic.chips = {};

  basic.chips.not = {
    name: 'not',
    in  : 'a',
    out : 'out',
    sim : function (a) {
      return ~a;
    },
    vhdl: 'out <= not a'
  };

  basic.chips.and = {
    name: 'and',
    in  : ['a', 'b'],
    out : 'out',
    sim : function (a, b) {
      return a & b;
    },
    vhdl: 'out <= a and b'
  };

  basic.chips.or = {
    name: 'or',
    in  : ['a', 'b'],
    out : 'out',
    sim : function (a, b) {
      return a | b;
    },
    vhdl: 'out <= a or b'
  };

  basic.chips.nor = {
    name: 'nor',
    in  : ['a', 'b'],
    out : 'out',
    arch: {
      x  : {or: ['a', 'b']},
      out: {not: 'x'}
    }
  };

  return basic;
}());
Si.pack['std_logic_1164'] = (function () {

  var std_logic = {};

  // IEEE multi-valued logic system as described in
  // https://standards.ieee.org/downloads/1076/1076.2-1996/std_logic_1164-body.vhdl

  // from: https://en.wikipedia.org/wiki/IEEE_1164
  // Character           Value
  //    'U'         Uninitialized
  //    'X'         Strong Drive, Unknown Logic Value
  //    '0'         Strong Drive, Logic Zero
  //    '1'         Strong Drive, Logic One
  //    'Z'         High Impedance
  //    'W'         Weak Drive, Unknown Logic Value
  //    'L'         Weak Drive, Logic Zero
  //    'H'         Weak Drive, Logic One
  //    '-'         Don't Care


  var indexOf = {
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

  var resolutionTable = {
    'U': ['U', 'U', 'U', 'U', 'U', 'U', 'U', 'U', 'U'],
    'X': ['U', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'],
    '0': ['U', 'X', '0', 'X', '0', '0', '0', '0', 'X'],
    '1': ['U', 'X', 'X', '1', '1', '1', '1', '1', 'X'],
    'Z': ['U', 'X', '0', '1', 'Z', 'W', 'L', 'H', 'X'],
    'W': ['U', 'X', '0', '1', 'W', 'W', 'W', 'W', 'X'],
    'L': ['U', 'X', '0', '1', 'L', 'W', 'L', 'W', 'X'],
    'H': ['U', 'X', '0', '1', 'H', 'W', 'W', 'H', 'X'],
    '-': ['U', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X']
  };

  var andTable = {
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

  var orTable = {
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

  var xorTable = {
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

  var notTable = ['U', 'X', '1', '0', 'X', 'X', '1', '0', 'X'];

  std_logic.before = function () {

    var args = Array.prototype.slice.apply(arguments);

    args = args.map(function (arg) {
      if (arg === 0) {
        return '0';
      } else if (arg === 1) {
        return '1';
      }
      return arg;
    });

    args.forEach(function (x) {
      if (Object.keys(indexOf).indexOf(x) === -1) {
        throw new Error(x + ' must be one of the types: ' + Object.keys(indexOf) + '.');
      }
    });

    return args;
  };

  std_logic.after = function (out) {
    if (out === '0') {
      return 0;
    } else if (out === '1') {
      return 1;
    }
    return out;
  };

  var chips = std_logic.chips = {};

  chips.resolved = {
    name: 'resolved',
    in  : 's',
    out : 'result',
    sim : function (s) {
      var r = s;
      if (Array.isArray(s)) {
        r = s[0];
        if (s.length > 1) {
          s.forEach(function (v) {
            r = resolutionTable[v][indexOf[r]];
          });
        }
      }
      return r;
    }
  };

  chips.and = {
    name: 'and',
    in  : ['l', 'r'],
    out : 'out',
    sim : function (l, r) {
      return andTable[l][indexOf[r]];
    }
  };

  chips.nand = {
    name: 'nand',
    in: ['l', 'r'],
    out: 'out',
    arch: {
      out: {not: {and: ['l', 'r']}}
    }
  };

  chips.or = {
    name: 'or',
    in: ['l', 'r'],
    out: 'out',
    sim: function(l, r) {
      return orTable[l][indexOf[r]];
    }
  };

  chips.nor = {
    name: 'nor',
    in: ['l', 'r'],
    out: 'out',
    arch: {
      out: {not: {or: ['l', 'r']}}
    }
  };

  chips.xor = {
    name: 'xor',
    in: ['l', 'r'],
    out: 'out',
    sim: function(l, r) {
      return xorTable[l][indexOf[r]];
    }
  };

  chips.xnor = {
    name: 'xnor',
    in: ['l', 'r'],
    out: 'out',
    arch: {
      out: {not: {xor: ['l', 'r']}}
    }
  };

  chips.not = {
    name: 'not',
    in: 'l',
    out: 'out',
    sim: function(l) {
      return notTable[indexOf[l]];
    }
  };

  return std_logic;
}());


// Core functionality

Si.add = function (model) {

  var self = this;

  // TODO check if chip is valid

  model.in = Array.isArray(model.in) ? model.in : [model.in];
  model.out = Array.isArray(model.out) ? model.out : [model.out];

  if (model.arch) {

    model.internal = {};

    var signals = 0;

    Object.keys(model.arch).forEach(function flatten(signal) {

      // Find the internal signals.
      // These signals are saved from one run
      // of a simulation function to the next.
      // Outputs are included as internal signals
      // in order to attempt to stabilize circular
      // dependencies.

      var arch = model.arch[signal];
      var func = Object.keys(arch)[0];
      var args = arch[func];
      var internal = model.internal[signal] = {};
      internal.func = func;
      internal.args = Array.isArray(args) ? args : [args];

      model.arch[signal][func] = internal.args = internal.args.map(function (arg) {
        if (isObject(arg)) {
          var name = '_signal' + signals++;
          model.arch[name] = arg;
          return flatten(name);
        } else {
          return arg;
        }
      });
      return signal;
    });


    model.reset = function (value) {
      Object.keys(model.arch).forEach(function (signal) {
        model.internal[signal].value = value;
      });
    };
  }

  // Add convenience methods to chip
  model.simulate = function () {
    return Si.simulate.call(self, model.name);
  };

  model.synthesize = function () {
    return Si.synthesize.call(self, model.name);
  };


  self.library[model.name] = model;

  return model;

};

Si.use = function (pack) {

  Si.library = {};

  if (Si.pack[pack] === undefined) {
    throw new Error('Package ' + pack + ' is not defined.');
  }
  Object.keys(Si.pack[pack].chips).forEach(function (chip) {
    Si.add.call(Si, Si.pack[pack].chips[chip]);
  });

  var beforeNoOp = function () {
    return arguments;
  };

  var afterNoOp = function (a) {
    return a;
  };

  Si.before = Si.pack[pack].before === undefined ? beforeNoOp : Si.pack[pack].before;

  Si.after = Si.pack[pack].after === undefined ? afterNoOp : Si.pack[pack].after;

  Si.using = pack;

  return Si;

};

Si.reset = function (name) {

  var self = this;
  var chip = self.library[name];

  return chip.reset === undefined ? function(){} : chip.reset();

};

Si.simulate = function (name) {

  var self = this;

  if(self.library[name] === undefined) {
    throw new Error('Chip [' + name + '] is not defined using pack [' + self.using + '].');
  }

  var chip = self.library[name];

// Helper function

  function simulate(func, args) {
    return Si.simulate.call(self, func).apply(self, args);
  }

// Simulation function to be returned

  var simulationFn = function () {

    var depth = 1;
    var tries = depth;

    var input = {},
        output = {};

// Sort input arguments

    if (isObject(arguments[0])) {
      input = arguments[0];
    } else {
      var args = Array.isArray(arguments[0]) ? arguments[0] : arguments;
      // arrange the arguments into the input object
      // to match the model inputs
      for (var i = 0; i < args.length; i++) {
        input[chip['in'][i]] = args[i];
      }
    }

// **** Debug Logging ****

    if (debugging) {
      console.log();
      console.log(name + ' (' + Array.prototype.slice.apply(arguments) + ')');
    }

    var alreadyTraced = [];

    chip.out.forEach(function (outputSignal) {

      var seen = [];
      var check = {};

      function trace(signal) {

        if (signal in input) {
          return input[signal];
        }

        seen.push(signal);

        var args = chip.internal[signal].args.map(function (arg) {

          if (seen.indexOf(arg) === -1) {
            return trace(arg);
          } else {
            check[arg] = chip.internal[arg].value;
            return chip.internal[arg].value;
          }
        });

        var result = chip.internal[signal].value = simulate(chip.internal[signal].func, args);

// **** Debug Logging ****

        if (debugging) {
          console.log(signal + ' <= ' + chip.internal[signal].func + '(' + chip.internal[signal].args + ') <= ' + chip.internal[signal].func + '(' + args + ') <= ' + result);
        }

        if (signal in check) {
          if (result !== check[signal]) {
            chip.internal[signal].value = result;
            seen = [];
            if (tries <= 0) {
              throw new Error('Chip "' + chip.name + '" did not stabilize in ' + (depth + 1) + ' iterations due to a circular dependency: ' + signal + ' -> ' + chip.internal[signal].func + ' -> ' + signal);
            } else {
              tries--;
              return trace(signal);
            }
          } else {
            var tracedObj = {};
            tracedObj[signal] = result;
            alreadyTraced.push(tracedObj);
            tries = depth;
            return result;
          }
        } else {
          return result;
        }
      }

      output[outputSignal] = outputSignal in alreadyTraced ? alreadyTraced[outputSignal] : trace(outputSignal);

    });

    // If output is only one signal, we'll return just that signal
    // otherwise, we can return an output signal object with structure:
    // { signal: value }

    if (Object.keys(output).length === 1) {
      return output[Object.keys(output)[0]];
    } else {
      return output;
    }

  };

  // Generate a simulation function if one is not already defined.

  var preDefined = chip.hasOwnProperty('sim') ? chip['sim'] : simulationFn;

  var s = function () {
    var before = Si.before.apply(self, arguments);
    return Si.after.call(self, preDefined.apply(self, before));
  };

  s.reset = function () {
    return Si.reset(name);
  };

  return s;

};

Si.synthesize = function (name) {

  var self = this;
  var chip = self.library[name];

  var vhdl = {};

  vhdl.header = [];
  vhdl.components = [];


};


// Module definition and export

function Silicon() {

  return Si.use('basic');

}
Si.Silicon = Silicon;
module.exports = exports = new Silicon();