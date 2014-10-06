function Silicon() {

  this.chips = {};

  Silicon.prototype.add.call(this, {
    name: 'not',
    in  : 'a',
    out : 'out',
    sim : function (a) {
      return ~a;
    }
  });

  Silicon.prototype.add.call(this, {
    name: 'and',
    in  : ['a', 'b'],
    out : 'out',
    sim : function (a, b) {
      return a & b;
    }
  });

  Silicon.prototype.add.call(this, {
    name: 'or',
    in  : ['a', 'b'],
    out : 'out',
    sim : function (a, b) {
      return a | b;
    }
  });

  Silicon.prototype.add.call(this, {
    name: 'nor',
    in  : ['a', 'b'],
    out : 'out',
    arch: {
      x  : {or: ['a', 'b']},
      out: {not: 'x'}
    }
  });


}

Silicon.prototype.add = function (model) {

  var self = this;

  // TODO check if chip is valid

  model.in = Array.isArray(model.in) ? model.in : [model.in];
  model.out = Array.isArray(model.out) ? model.out : [model.out];


  if (model.arch) {

    model.internal = {};

    Object.keys(model.arch).forEach(function (signal) {
      // Find the internal signals.
      // These signals are saved from one run
      // of a simulation function to the next.
      // Outputs are included as internal signals
      // in order to resolve circular dependencies
      var func = Object.keys(model.arch[signal])[0];
      model.internal[signal] = {};
      model.internal[signal].func = func;
      var args = model.arch[signal][func];
      model.internal[signal].args = Array.isArray(args) ? args : [args];
    });


    model.reset = function (value) {
      Object.keys(model.arch).forEach(function (signal) {
        model.internal[signal].value = value;
      });
    };
  }

  self.chips[model.name] = model;

};

Silicon.prototype.simulate = function (name) {

  var self = this;
  var chip = self.chips[name];

  var simulationFn = function () {

    var input = {},
        output = {};

    if (Object.prototype.toString.call(arguments[0]) === '[object Object]') {
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
            seen = [signal];
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

Silicon.prototype.Silicon = Silicon;

module.exports = exports = new Silicon();