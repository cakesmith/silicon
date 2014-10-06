Silicon.js
==========
Hardware description for software engineers.
-------------------------------------------
Silicon.js is a module used to describe and simulate logic circuits. It uses a simple object format to describe each unit (called a *chip*) that is built up from other, lower level chips.
### Super Simple API.
With Silicon.js it's easy to describe a chip. Here's an example:
```js
var Silicon = require('silicon');

var xor = {
  in: ['a', 'b'],
  out: 'out',
  arch: {
      out : { or: ['w1', 'w2'] },
      w1  : { and: ['a', 'notb'] },
      w2  : { and: ['nota', 'b'] },
      nota: { not: 'a' },
      notb: { not: 'b' }
    }
}

Silicon.add(xor);
```
This describes the *xor* chip, which takes two inputs and produces one output. The *arch* section describes the layout of the chip. There are three main sections in a chip object: `in`, `out`, and `arch`. 

`in`
  - This section describes the names of the input signals. It may be a single string, such as 'input', or an array of strings that will make up the input bus.

`out`
  - This section describes the names of the output signals. It also may be a single string or an array of strings.

`arch`
  - This is the architecture object of the chip. Each property of the object is either the name of an internal signal that may be used in any other part of the chip, or the name of an output signal. The value of this property is an object that may only have one property: the name of a chip which will provide the value of the signal. For example: to reference above, ```nota: { not: 'a' }``` will take the value of `a`, pass it as the input to the (already defined) `not` chip, and assign the value of the result to the signal `nota`, which then is referenced again as one of the inputs to the `and` chip that comprises the signal `w2`.


Calling ```Silicon.add(chip)``` will verify the validity of the chip and then add it to the internal registry of defined chips to be referenced in future architectures.