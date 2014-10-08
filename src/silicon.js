function Silicon() {

  var self = this;

  self.chips = {};

  var not = {
    name: 'not',
    in  : 'a',
    out : 'out',
    sim : function (a) {
      return ~a;
    }
  };

  var and = {
    name: 'and',
    in  : ['a', 'b'],
    out : 'out',
    sim : function (a, b) {
      return a & b;
    }
  };

  var or = {
    name: 'or',
    in  : ['a', 'b'],
    out : 'out',
    sim : function (a, b) {
      return a | b;
    }
  };

  var nor = {
    name: 'nor',
    in  : ['a', 'b'],
    out : 'out',
    arch: {
      x  : {or: ['a', 'b']},
      out: {not: 'x'}
    }
  };

  var builtins = [not, and, or, nor];

  builtins.forEach(function(chip) {
    Silicon.prototype.add.call(self, chip);
  });

}

function isObject(x) {
  return (Object.prototype.toString.call(x) === '[object Object]');
}

Silicon.prototype.add = function (model) {

  var self = this;

  // TODO check if chip is valid

  model.in = Array.isArray(model.in) ? model.in : [model.in];
  model.out = Array.isArray(model.out) ? model.out : [model.out];


  if (model.arch) {

    model.internal = {};

    var signals = 0;

    Object.keys(model.arch).forEach(function resolve (signal) {
      // Find the internal signals.
      // These signals are saved from one run
      // of a simulation function to the next.
      // Outputs are included as internal signals
      // in order to resolve circular dependencies


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
          return resolve(name);
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

  // This just adds the .simulate() method to the chip
  // as a convenience method.
  model.simulate = function() {
    return Silicon.prototype.simulate.call(self, model.name);
  };

  self.chips[model.name] = model;

  return model;

};

Silicon.prototype.simulate = function (name) {

  var self = this;
  var chip = self.chips[name];

  var simulationFn = function () {

    var input = {},
        output = {};

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


    var resolved = [];

    chip.out.forEach(function (outputSignal) {

      var seen = [];
      var check = [];

      function simulate(func, args) {
        return Silicon.prototype.simulate.call(self, func).apply(self, args);
      }

      function resolve(signal) {

        if (signal in input) {
          return input[signal];
        }

        seen.push(signal);

        var args = chip.internal[signal].args.map(function (arg) {

          if (seen.indexOf(arg) === -1) {
            return resolve(arg);
          } else {
            var checkObj = {};
            checkObj[arg] = chip.internal[arg].value;
            check.push(checkObj);
            return chip.internal[arg].value;
          }
        });

        var result = chip.internal[signal].value = simulate(chip.internal[signal].func, args);

        if (signal in check) {
          if (result !== check[signal]) {
            chip.internal[signal].value = check[signal];
            seen = [];
            return resolve(signal);
          } else {
            var resolvedObj = {};
            resolvedObj[signal] = result;
            resolved.push(resolvedObj);
            return result;
          }
        } else {
          return result;
        }
      }

      output[outputSignal] = outputSignal in resolved ? resolved[outputSignal] : resolve(outputSignal);


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

  simulationFn.reset = chip.reset;

// Generate a simulation function if one is not already defined.

  return Object.prototype.hasOwnProperty.call(chip, 'sim') ? chip['sim'] : simulationFn;


};

Silicon.prototype.reset = function(name) {

  var self = this;
  var chip = self.chips[name];

  return chip.reset();

};

Silicon.prototype.Silicon = Silicon;

module.exports = exports = new Silicon();