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


}

Silicon.prototype.add = function (model) {

  // TODO check if chip is valid

  model.in = Array.isArray(model.in) ? model.in : [model.in];
  model.out = Array.isArray(model.out) ? model.out : [model.out];

  this.chips[model.name] = model;


};

Silicon.prototype.simulate = function (name) {

  var self = this;
  var chip = self.chips[name];

  return (Object.prototype.hasOwnProperty.call(chip, 'sim')) ? chip['sim'] :

    // Generate a simulation function
    // if one is not already defined

    function () {

      var input = {},
          internal = {},
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

      Object.keys(chip.arch).forEach(function (signal) {
        // Find the internal signals.
        // Out is included as an internal signal,
        // in order to resolve circular dependencies

        var func = Object.keys(chip.arch[signal])[0];
        internal[signal] = {};
        internal[signal].func = func;
        var inputs = chip.arch[signal][func];
        internal[signal].inputs = Array.isArray(inputs) ? inputs : [inputs];
        internal[signal].value = 0;
      });

      chip.out.forEach(function (outputSignal) {
        output[outputSignal] = (function resolve(signal) {

          if (signal in input) {
            return input[signal];
          } else {

            var args = internal[signal].inputs.map(resolve);
            return Silicon.prototype.simulate.call(self, internal[signal].func).apply(self, args);

          }


        }(outputSignal))
      });

      if (Object.keys(output).length === 1) {
        return output[Object.keys(output)[0]];
      } else {
        return output;
      }

    }


};


Silicon.prototype.Silicon = Silicon;

module.exports = exports = new Silicon();