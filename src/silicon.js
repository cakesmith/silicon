var debugging = true;

// Helper function
function isObject(x) {
  return (Object.prototype.toString.call(x) === '[object Object]');
}

var Si = Silicon.prototype;

// Chip packages

Si.pack = {};

Si.pack['basic'] = (function () {
  var basic = {};

  basic.not = {
    name: 'not',
    in  : 'a',
    out : 'out',
    sim : function (a) {
      return ~a;
    },
    vhdl: 'out <= not a'
  };

  basic.and = {
    name: 'and',
    in  : ['a', 'b'],
    out : 'out',
    sim : function (a, b) {
      return a & b;
    },
    vhdl: 'out <= a and b'
  };

  basic.or = {
    name: 'or',
    in  : ['a', 'b'],
    out : 'out',
    sim : function (a, b) {
      return a | b;
    },
    vhdl: 'out <= a or b'
  };

  basic.nor = {
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

  // IEEE multi-valued logic system as described in
  // https://standards.ieee.org/downloads/1076/1076.2-1996/std_logic_1164-body.vhdl


  var std_logic = {};

  std_logic.resolve = {
    name: 'resolve',
    in  : 's',
    out : 'result',
    sim : function (s) {

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

Si.reset = function (name) {

  var self = this;
  var chip = self.library[name];

  return chip.reset();

};

Si.simulate = function (name) {

  var self = this;
  var chip = self.library[name];

// Helper function

  function simulate(func, args) {
    return Si.simulate.call(self, func).apply(self, args);
  }

// Simulation function to be returned

  var simulationFn = function () {

    var maxTries = 1;
    var tries = maxTries;

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
              throw new Error('Chip "' + chip.name + '" did not stabilize in ' + (maxTries + 1) + ' iterations due to a circular dependency: ' + signal + ' -> ' + chip.internal[signal].func + ' -> ' + signal);
            } else {
              tries--;
              return trace(signal);
            }
          } else {
            var tracedObj = {};
            tracedObj[signal] = result;
            alreadyTraced.push(tracedObj);
            tries = maxTries;
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

// Add a reset method to the simulation function
  simulationFn.reset = chip.reset;

// Generate a simulation function if one is not already defined.
  return chip.hasOwnProperty('sim') ? chip['sim'] : simulationFn;


};

Si.synthesize = function (name) {

  var self = this;
  var chip = self.library[name];

  var vhdl = {};

  vhdl.header = [];
  vhdl.components = [];


};



// Module definition and export

function Silicon(pack) {

  var self = this;

  self.library = {};

// default to the basic chip package

  pack = pack === undefined ? 'basic' : pack;

  if (Si.pack[pack] === undefined) {
    throw new Error('Package ' + pack + ' is not defined.');
  } else {
    Object.keys(Si.pack[pack]).forEach(function(chip) {
      Si.add.call(self, Si.pack[pack][chip]);
    });
  }


}

Si.Silicon = Silicon;

module.exports = exports = new Silicon();