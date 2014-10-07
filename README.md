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
  - This section describes the names of the **input signals**. It may be a single string, such as 'input', or an array of strings that will make up the input bus.

`out`
  - This section describes the names of the **output signals**. It also may be a single string or an array of strings.

`arch`
  - This is the **architecture object** of the chip. Each property of the object either names an internal signal that may be used in any other part of the chip, or the refers to the name of an output signal defined in the `out` section. The value of this property is an object that may only have **one property**: the name of a chip which will provide the value of the signal. This may sound confusing, but it's really pretty simple. For example: `nota: { not: 'a' }` will take the value of `a`, pass it as the input to the (already defined) `not` chip, and assign the value of the result to the signal `nota`. This is then is referenced again as one of the inputs to the `and` chip that comprises the signal `w2`.
  - The architecture object may contain `signal objects` which are just shorthand for defining a signal inline. It is a slightly more compact way of expressing a chip's architecture, at the expense of possibly being less readable. Example:
```js
Silicon.add({
        name: 'xor',
        in  : ['a', 'b'],
        out : 'out',
        arch: {
          out: {or: [{and: ['a', {not: 'b'}]}, {and: [{not: 'a'}, 'b']}]}
        }
      });
```
This is exactly the same architecture as before, only without the explicit signal names `w1`, `nota`, etc. You can see that `out` is comprised of an `or` chip that takes as its inputs an array consisting of the output of two `and` chips, and so on. This is merely for convenience instead of having to explicitly name each and every internal signal.


Calling ```Silicon.add(chip)``` will verify the validity of the chip and then add it to the internal registry of defined chips to be referenced in future architectures.

Once a chip is created, it can be simulated either by calling `chip.simulate()` or `Silicon.simulate('name')`. This will return a simulation function which will emulate the behavior of the chip. This function can then be called with specific arguments to return a result. For example:

```js
var Silicon = require('silicon');

var xor = Silicon.add({
  name: 'xor',
  in: ['a', 'b'],
  out: 'out',
  arch: {
    nota: {not: 'a'},
    notb: {not: 'b'},
    w1  : {and: ['a', 'notb']},
    w2  : {and: ['nota', 'b']},
    out : {or: ['w1', 'w2']}
  }
}).simulate();
```
The `not` chip uses arithmetic negation (~) so we use `-1` as **true** and `0` as **false** for these tests:
```js
expect(xor(0, 0)).toEqual(0);
expect(xor(-1, 0)).toEqual(-1);
expect(xor(0, -1)).toEqual(-1);
expect(xor(-1, -1)).toEqual(0);

```
At this point, `xor` and `Silicon.simulate('xor')` are the same function.

Under the hood, `Silicon` uses a simulation engine which stores the value of its signals between usages. The gist of the algorithm is something like this:

1. Locate all output and internal signals and assign them a random value.
2. For each output signal, trace a route through the chips back to an input signal.
3. Using the input signal's value, evaluate the route forward through the chips and determine what the output signal should be.
4. If there are any circular dependencies, note what the value for that chip is and use this value to call the dependent chip again.
5. If the new value is the same as the original value, the circular definition is stable, and we can use its output.
6. If the new value is different, the original output value will be used.

This lets us be able to simulate something like a [SR Latch][1]:
```js
var rs = Silicon.add({
        name: 'rsLatch',
        in  : ['r', 's'],
        out : ['q', 'notQ'],
        arch: {
          q   : {nor: ['r', 'notQ']},
          notQ: {nor: ['s', 'q']}
        }
      }).simulate();

expect(rs(0, 0)).toEqual({q: 0, notQ: -1});
expect(rs(0, -1)).toEqual({q: -1, notQ: 0});
expect(rs(0, 0)).toEqual({q: -1, notQ: 0});
expect(rs(-1, 0)).toEqual({q: 0, notQ: -1});
expect(rs(0, 0)).toEqual({q: 0, notQ: -1});
```
This is a perfectly valid chip definition and will not produce an infinite recursion.

We can explicitly define the simulation function of a chip if we wish. Just create a property on the chip object of 'sim' and have it return whatever simulation function you wish. For example, the built in `not` chip is defined as:
```js
Silicon.prototype.add({
  name: 'not',
  in  : 'a',
  out : 'out',
  sim : function (a) {
    return ~a;
  }
});
```


[1]:[https://en.wikipedia.org/wiki/Flip-flop_(electronics)#SR_NOR_latch]