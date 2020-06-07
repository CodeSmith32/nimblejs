NimbleJS v1.2
=============

NimbleJS is a lightweight JavaScript input library, providing a simple abstraction for a variety of browser inputs. Nimble is designed for adding to basic games as a means of obtaining input, providing an event-based input system for applications, as well as a step-based input system for games. For this reason, it also includes a basic step event handler as well as an HTML5 canvas handler. Here is a full list of Nimble's modules:

- nimble.Canvas:      A handler for HTML5 canvases, resizing and rendering them as necessary
- nimble.Steps:       A step handler for managing a steploop
- nimble.Keyboard:    A handler for keyboard inputs
- nimble.Mouse:       A handler for mouse inputs and pointerlock
- nimble.Touch:       A handler for multifinger touch-screen inputs
- nimble.Orientation: A handler for gyroscope and accelerometer inputs (on supporting devices)

In addition to being written in ES5, Nimble has a decent amount of compatibility support for old browsers (supporting back to IE9), and also has some built-in browser detection and fallbacks to normalize some differences in conventions among browsers.

## General Module Rules

These rules generally apply to all modules. Please read this section first, as some of the methods and properties mentioned here do not appear in the list of methods or properties under the modules.

### Basic Module Instantiation

All Nimble modules are classes, and are contained under the main class, `nimble`. Instantiating modules may be written as the following:

```
var keyboard = new nimble.Keyboard();
var mouse = new nimble.Mouse();
var touch = new nimble.Touch();
var orient = new nimble.Orientation();
```

At any point after this (e.g., in a step loop), one can easily use any of the handlers, as such:

```
if(keyboard.control) {
	// the 'control' key is currently pressed; do something
}

if(mouse.y < 50) {
	// the mouse is near the top of the browser
}

for(var id in touch.fingers) {
	var finger = touch.fingers[id];
	var dx = finger.x - this.x, dy = finger.y - this.y;
	if(dx*dx + dy*dy < this.rad*this.rad) {
		// the finger is touching a circle
	}
}
```

### Module Contexts

All module constructors have one argument: the context to which they apply. This is the element / JavaScript object the event listeners are added to. For instance, in order to set up mouse listeners for only an element with ID "editor-container", one may write:

```
var mouse = new nimble.Mouse( document.getElementById('editor-container') );
```

This will cause the handler to set up its listeners on the specific element. In addition, for the mouse and touch handlers, cursor and finger screen coordinates are relative to the frame of their handler's context.

When unspecified, the context for all modules defaults to `window`. Notice that specifying a context other than `window` doesn't necessarily make sense for some modules, e.g., nimble.Keyboard. Also, be aware that the context for nimble.Canvas should *not* be the canvas element. Instead, the context specified for nimble.Canvas should be the element containing the canvas, as nimble.Canvas will automaticaly poll this object for its new inner width and height in order to fill it.

### Enabling / Disabling Modules

By default, when instantiating Nimble modules, all their necessary listeners will be immediately bound to the context or window. To disable a module, you may simply call:

```
keyboard.disable();
```

This will cause it to remove all its listeners from its context. Thus, after this point, the module will not respond to any events. To re-enable it, just call:

```
keyboard.enable();
```

This will cause it to re-add all its listeners back to its context object.
One can also check to see if a module is enabled by calling `isenabled()`, e.g.,

```
if(!keyboard.isenabled()) {
	keyboard.enable();
}
```

Notice that enabling or disabling a `nimble.Steps` module will cause it to run or stop the step-loop. See the `nimble.Steps` module for more details.

To set the default for newly instantiated modules, simply change the boolean, `nimble.enableByDefault` which defaults to `true`.

### Preparing Modules for Step-based Events

In addition to checking the state of inputs at any moment, Nimble also provide an interface for input states that specifically operate for step-based systems. This type of handling allows one to easily test for things such as, 'Was the keyboard key pressed down within this step?' 'How much did the mousewheel scroll within this step?' 'Did the user release the mouse button within this step?'. To set up a module for step-based state, simply start by settings its `steps` property to `true`:

```
var keyboard = new nimble.Keyboard();
keyboard.steps = true; // use step-based state
```

Then, most importantly, to make sure its step-based state stays accurate, run its `stepclear()` method at the *end of your step-loop*:

```
function stepLoop() {
	// do step stuff

	keyboard.stepclear();
	// and maybe stepclear() other modules
}
```

Once its set up, from within the step-loop you can now simply utilize the step-based state of your modules:

```
function stepLoop() {
	// ...
	if(keyboard.pressed.escape) {
		pauseGame();
	}
	// ...

	keyboard.stepclear();
	// and maybe stepclear() other modules
}
```

Almost all input modules provide step-based input states, and all modules (except for nimble.Steps) have a legal `stepclear()` method. See individual module information for more on what's provided for step-based configuration. Note that, for nimble.Canvas objects, `stepclear()` should be called instead at the *beginning* of the step or before any drawing occurs, as it will clear the canvas.

### Event-based Handling and Hooks

In addition to step-based handling, nimble also lets you hook event-based listeners to inputs. To do this, all modules (and some submodules, like Touch::fingers) have three methods:

**`<module instance>.hook(event,callback)`**<br/>
**`<module instance>.on(event,callback)`**

This method (both method names alias the same function) allow you to hook a function as a callback to an event. Event callbacks are triggered when the event occurs, and in the order they were added.

Notice: If, within an callback of an event, another function is hooked to that very event, that newly hooked function will not be called until the next time the event occurs.

- `event` is a string with one or more space-separated events the callback should be attached to.
- `callback` is the function that will be called when the event occurs. This function is passed one object as a parameter: the event object. See the "Hooks" sections for individual modules to see what is in this object per method. Also see just below for details on the `event` parameter.

**`<module instance>.unhook(event,callback)`**<br/>
**`<module instance>.off(event,callback)`**

This method (both method names alias the same function) will remove the callback from the list of callbacks for the specified event.

Notice: In the case that, within a callback of an event a function is unhooked from that very event: if the callback was not yet called, it will be removed and not called during that event.

- `event` is a string of one or more space-separated events that the callback should be unhooked from.
- `callback` is the callback function that should be removed from the list of callbacks. If the function is not bound to the event, the call has no effect.

**`<module instance>.unhookAll(event)`**<br/>
**`<module instance>.offAll(event)`**

This method (both method names alias the same function) will completely clear all callbacks from the list of callbacks hooked to a specific event.

Notice: In the case that this is called within a callback hooked to this very event, the rest of the callbacks that had not been called will miss the event.

- `event` is the event that the callbacks should be cleared from.

So, for instance, to hook to a nimble.Mouse module on mouse button down events, do

```
var mouse = new nimble.Mouse();
mouse.hook("down",mouseDownCallback);
```

This callback will now be called for any mouse button down event. Then, to remove the hook, simply run:

```
mouse.unhook("down",mouseDownCallback);
```

Hooks are also used for other important things such as hooking to nimble.Canvas redrawing and nimble.Step running. For instance, to hook a step loop to nimble.Steps, do

```
var step = nimble.Steps();
function stepLoop(ev) {
	// ...
}

step.hook("step",stepLoop);

```

As mentioned above, the callback also receives one parameter: the event object. This parameter is an object holding the properties of the event. For more information on the properties for each callback, refer to each modules hooks.

```
function mouseDownCallback(ev) {
	if(ev.button == "left" && ev.y < 50) {
		// ...
	}
}

// ...
function stepLoop(ev) {
	obj.x += ev.delta
}
// ...
```

Notice, all The callback parameter object will always have an `event` property, which is the name of the event that it was hooked to. This allows one function to be hooked to multiple hooks. For instance, if hooking to both mouse "down" and "up" events, the event can be distinguished like so:

```
var mouse = new nimble.Mouse();
function mouseEvent(ev) {
	if(ev.button=="left") {
		if(ev.event == "down") {
			// ...
		} else if(ev.event == "up") {
			// ...
		}
	}
}
mouse.hook("down up",mouseEvent);
```

In addition to `event`, if the type of event is one that is triggered by an actual event, `original` is another available property that refers to the original JavaScript event object, as triggered by the browser.

For more information on what hooks are available for what modules, and what their callbacks provide, see details on the specific modules.

## nimble.Canvas

A module for initiating an HTML5 canvas in either 2D or 3D, and handling screen resize, redrawing, and clearing the screen.

### Properties:

**`nimble.Canvas::context`**

The canvas context (either a CanvasRenderingContext, if canvas was initiated in 2D, or a WebGLRenderingContext, if initiated in 3D, or null if not initiated). When the canvas is resized, this value is kept updated with the new context.

**`nimble.Canvas::width`**

The width of the canvas the module is attached to.

**`nimble.Canvas::height`**

The height of the canvas the module is attached to.

**`nimble.Canvas::antialias`**

If to use antialiasing on the canvas. This value must be assigned before initiating the canvas for it to work. Otherwise, it'll apply the next time the canvas is resized or updated with `update()`.

**`nimble.Canvas::back`**

The background color to be used when clearing the canvas. For 2D contexts, this value should be a valid CSS string value (e.g., "white" or "#404040"). For 3D contexts, this value should be a hex integer representing the color (e.g., red would be 0xff0000).

### Methods:

**`nimble.Canvas::update()`**

Refreshes the canvas by re-adjusting its size, creating a new context, and re-rendering.

**`nimble.Canvas::canvas(canvasElement,dimensions)`**<br/>
**`canvasDOMElement nimble.Canvas::canvas()`**

Initiates the canvas module by giving it the canvas DOM element to work with, and providing the number of dimensions to render.

- `canvasElement` is the DOM canvas element, selected from the document.
- `dimensions` refers to whether or not the canvas context should be initiated in 2D or 3D (via WebGL). This should be a number, either `2` or `3`.

Also, as an overload, if no arguments are sent, the canvas the module currently has will be returned.

**`nimble.Canvas::stepclear()`**

Clears the canvas screen with the background color. An proxy to `nimble.Canvas::clear(color)` that accepts no color.

**`nimble.Canvas::clear(color)`**

Clears the canvas with the given color.

- `color` is the color to clear the screen with. If none is provided, the background color is used instead. If no background color is specified, for 2D contexts the canvas is cleared, and for 3D contexts black is used.

**`nimble.Canvas::redraw()`**

Redraws the screen, running all listeners hooked to the "draw" hook. This method is typically the method to call in the step-loop.

### Hooks:

**`"draw"`**

Runs whenever canvas redrawing is triggered.

- `ev.event` event type: "draw"
- `ev.context` the canvas context, e.g., `nimble.Canvas::context`
- `ev.width` the width of the canvas
- `ev.height` the height of the canvas

**`"resize"`**

Runs whenever the canvas is resized. This hook is triggered just before the "draw" hook is triggered.

- `ev.event` event type: "resize"
- `ev.context` the new canvas context, having just been generated by `getContext(...)`
- `ev.width` the new width of the canvas
- `ev.height` the new height of the canvas
- `ev.original` the original event object

## nimble.Steps

A simple step-loop handler for running a simple step-based game. Makes use of requestAnimationFrame for looping (thus the step-loop will freeze when switching tabs).

### Methods:

**`nimble.Steps::start()`**

Starts the step-loop. This method is a convenient alias of `nimble.Steps::enable()`. Note that the nimble step-loop will start on instantiation by default. To disable this, set `nimble.enableByDefault` to `false`. See above under *Enabling / Disabling Modules for more information*.

**`nimble.Steps::stop()`**

Stops the step-loop. This method is a convenient alias of `nimble.Steps::disable()`.

**`nimble.Steps::running()`**

Returns whether or not the step-loop is currently running. This method is a convenient alias of `nimble.Steps::isenabled()`.

**`nimble.Steps::fps()`**

Returns the estimated number of frames-per-second that the step-loop has been running at.

### Hooks:

**`"step"`**

Hooks to the step event. This event is triggered on each loop. The loop is run via `requestAnimationFrame`.

- `ev.event` event type: "step"
- `ev.delta` the time, in milliseconds, since just before the last step

## nimble.Keyboard

A simple keyboard input handler.

### Properties:

**`nimble.Keyboard::<keyname>`**

An instance of nimble.Keyboard maps the following properties directly to booleans representing if the respective key is down at the moment:

backspace, tab, numclear, enter, shift, control, alt, space, pageup, pagedown, end, home, left, up, right, down, pausebreak, capslock, escape, printscreen, insert, del, windows, numpad0, numpad1, numpad2, numpad3, numpad4, numpad5, numpad6, numpad7, numpad8, numpad9, multiply, add, subtract, decimal, divide, f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12, numlock, scrolllock, semicolon, equals, comma, period, minus, slash, accent, lbracket, rbracket, quote, backslash

Notice that the key names refer only to the names of the characters generated when not holding shift.

In addition to these named keys, all single uppercase letters are mapped to booleans in a similar manner. Indices 0 to 9 are also mapped the same way, though to access these, one must do

```
if(keyboard[0]) {
	// the '0' key is being pressed
}
```

**`nimble.Keyboard::codes`**

A utility object mapping all the keys listed above to their respective keycodes. For instance, `keyboard.codes.backspace == 8`, `keyboard.codes.enter == 13`, `keyboard.codes[0] == 48`, etc. In addition to the names listed above, the following character names are also included (characters generated when holding shift):

colon, plus, lessthan, greaterthan, underscore, question, atilda, verticalbar

**`nimble.Keyboard::icodes`**

A utility object mapping all keycodes to their respective string names. For instance, `keyboard.icodes[8] == "backspace"`, `keyboard.icodes[13] == "enter"`, `keyboard.icodes[0] == "0"`, etc.

**`nimble.Keyboard::pressed`**

An object containing the names of any keys that were pressed down since the last step. These are keys that were not pressed in the previous step, and are now being pressed in this step. This object maps keys by name to booleans, the same way as above.

Note that, for this object, not all keys are existing properties at any given time. This means that something like `keyboard.pressed.up` will yield `undefined` if the up arrow was not pressed since the last step. Typically this doesn't affect application operation, since `undefined` is a false value.

Because it's a step-based state object, the keyboard module must be set up for step-based events for it to work (See above).

**`nimble.Keyboard::released`**

An object containing the names of any keys that were released since the last step. These are keys that were pressed down in the previous step, but are not pressed in this step. This object also maps keys by name to booleans, the same way as above.

Note that, for this object, not all keys are existing properties at any given time. This means that something like `keyboard.released.up` will yield `undefined` if the up arrow was not released since the last step. Typically this doesn't affect application operation, since `undefined` is a false value.

Because it's a step-based state object, the keyboard module must be set up for step-based events for it to work (See above).

**`nimble.Keyboard::steps`**

The nimble.Keyboard module supports step-based state, and therefore has a `steps` property that, when set to `true`, will trigger it to update its step-based state. Be sure to use `stepclear()` as prescribed above under *Preparing Modules for Step-based Events*.

### Methods:

**`nimble.Keyboard::stepclear()`**

Use this method at the end of the step-loop when utilizing the keyboard's step-based state.

### Hooks:

**`"down"`**

Triggered whenever a key is pressed down.

- `ev.event` event type: "down"
- `ev.code` the keycode of the key being pressed
- `ev.key` the string name of the key being pressed
- `ev.original` the original event object

**`"up"`**

Triggered whenever a key is released.

- `ev.event` event type: "up"
- `ev.code` the keycode of the key being released
- `ev.key` the string name of the key being released
- `ev.original` the original event object

## nimble.Mouse

A simple mouse cursor input handler. Captures mouse position, clicking and scrolling (both vertically and horizontally). Also handles pointerlock, making pointerlock setup and capturing very simple.

### Properties:

**`nimble.Mouse::<button>`**

An instance of nimble.Mouse maps the following properties directly to booleans representing whether or not the mouse button is down at the moment:

left, middle, right

**`nimble.Mouse::codes`**

A utility object mapping the mouse buttons to their respective button codes. The three mouse buttons have the following codes:

- left: 1
- middle: 2
- right: 3

**`nimble.Mouse::icodes`**

A utility object mapping the mouse button codes to their respective button names:

- 1: left
- 2: middle
- 3: right

**`nimble.Mouse::pressed`**

An object containing the names of any mouse buttons that were pressed down since the last step. These are buttons that were not pressed in the previous step, and are now being pressed in this step. This object maps buttons by name to booleans, the same way as above.

Note that, for this object, not all button names are existing properties at any given time. This means that something like `mouse.pressed.left` will yield `undefined` if the left mouse button was not pressed since the last step. Typically this doesn't affect application operation, since `undefined` is a false value.

Because it's a step-based state object, the mouse module must be set up for step-based events for it to work (See above).

**`nimble.Mouse::released`**

An object containing the names of any mouse buttons that were released down since the last step. These are buttons that were down in the previous step, and are now not being pressed in this step. This object maps buttons by name to booleans, the same way as above.

Note that, for this object, not all button names are existing properties at any given time. This means that something like `mouse.released.left` will yield `undefined` if the left mouse button was not released since the last step. Typically this doesn't affect application operation, since `undefined` is a false value.

Because it's a step-based state object, the mouse module must be set up for step-based events for it to work (See above).

**`nimble.Mouse::wheeldelta`**

An object listing the changes in the mouse wheel scrolling. If step-based events are set up for the mouse module, this value will be the change in scroll since the last step. If not, it will be since the module was created (or enabled). This object has three properties:

- `x` the change in the horizontal scrolling
- `y` the change in the vertical scrolling
- `d` the general 'delta' in scrolling in any direction (typically use this when disregarding horizontal scrolling)

**`nimble.Mouse::x`**<br/>
**`nimble.Mouse::y`**

The x and y of the mouse at any given time. Note this value will not be accurate if the mouse moves outside the browser (or context object) except when clicking and dragging from the window.

**`nimble.Mouse::xdelta`**<br/>
**`nimble.Mouse::ydelta`**

The change in the mouse position since the last step. When inside pointerlock, these values should be used instead of mouse position. When step-based events are set up for the mouse module, these values will represent the pointerlock mouse movement since the last step. If not, they will represent the mouse movement since the Mouse module was created (or enabled).

**`nimble.Mouse::xwheel`**<br/>
**`nimble.Mouse::ywheel`**<br/>
**`nimble.Mouse::wheel`**

The delta change in scrolling since the Mouse module was created (or enabled). Applications are free to set these values to 0 and watch them change again.

**`nimble.Mouse::steps`**

The nimble.Mouse module supports step-based state, and therefore has a `steps` property that, when set to `true`, will trigger it to update its step-based state. Be sure to use `stepclear()` as prescribed above under *Preparing Modules for Step-based Events*.

### Methods:

**`nimble.Mouse::pointerlock(pointerlockMode)`**<br/>
**`pointerlockRequested nimble.Mouse::pointerlock()`**

Sets/gets if this element's context should be a pointerlock element or not. Pointerlock elements will trigger pointerlock to start when they're clicked on. If the mouse is in pointerlock mode on this element, setting this to `false` will exit pointerlock mode.

If no parameters are given, returns if this module was set to use pointerlock on its element. Notice, this method does not tell whether or not the mouse is currently in pointerlock mode or not. For that, see `nimble.Mouse::ispointerlocked()`.

**`nimble.Mouse::ispointerlocked()`**

Returns whether or not the mouse is currently in pointerlock.

**`nimble.Mouse::exitpointerlock()`**

If the mouse is currently in pointerlock mode, this will exit from it.

**`nimble.Mouse::stepclear()`**

Use this method at the end of the step-loop when utilizing the mouse's step-based state.

### Hooks:

**`"wheel"`**

Triggered when the mouse scrolls.

- `ev.event` event type: "wheel"
- `ev.wheel` the change in the mouse wheel scrolling
- `ev.xwheel` the change in horizontal scrolling
- `ev.ywheel` the change in vertical scrolling
- `ev.x` the mouse x when scrolling
- `ev.y` the mouse y when scrolling
- `ev.pointerlocked` a boolean: whether or not the mouse is in pointerlock on this module's context
- `ev.original` the original event object

**`"down"`**

Triggered when a mouse button is pressed.

- `ev.event` event type: "down"
- `ev.code` the code of the pressed button (1, 2, or 3)
- `ev.button` the name of the pressed button ("left", "middle", or "right")
- `ev.x` the mouse x when clicking
- `ev.y` the mouse y when clicking
- `ev.pointerlocked` a boolean: whether or not the mouse is in pointerlock on this module's context
- `ev.original` the original event object

**`"up"`**

Triggered when a mouse button is released.

- `ev.event` event type: "down"
- `ev.code` the code of the released button (1, 2, or 3)
- `ev.button` the name of the released button ("left", "middle", or "right")
- `ev.x` the mouse x when releasing
- `ev.y` the mouse y when releasing
- `ev.pointerlocked` a boolean: whether or not the mouse is in pointerlock on this module's context
- `ev.original` the original event object

**`"move"`**

Triggered when the mouse moves.

- `ev.event` event type: "down"
- `ev.x` the new mouse x
- `ev.y` the new mouse y
- `ev.xdelta` the change in mouse x since the last mouse move event; also updated when in pointerlock mode
- `ev.ydelta` the change in mouse y since the last mouse move event; also updated when in pointerlock mode
- `ev.pointerlocked` a boolean: whether or not the mouse is in pointerlock on this module's context
- `ev.original` the original event object

**`"pointerlock"`**

Triggered when pointerlock on this element changes.

- `ev.event` event type: "pointerlock"
- `ev.x` the mouse x when the change occurs
- `ev.y` the mouse y when the change occurs
- `ev.pointerlocked` a boolean: `true` if the pointerlock change locked the mouse, or `false` if it failed or is exiting
- `ev.failed` if the event was triggered because the context failed to obtain pointerlock
- `ev.original` the original event object

## nimble.Touch

A simple touchscreen handler, capturing any number of finger touches, and tracking them by object instead of identifier. This allows one to obtain a finger object, and watch it as its position changes, without having to query the module to see every change.

### Properties:

**`nimble.Touch::fingers`**

An object mapping finger IDs to finger objects. As it is not a sequential array, this object should be iterated with `for(i in touch.fingers)`.

**`nimble.Touch::pressed`**

An array of the finger objects for fingers that began touching the screen since the last step. These are fingers that were not touching in the previous step, and are now touching the screen in this step. Unlike the `fingers` object, this is an array.

Because it's a step-based state object, the touch module must be set up for step-based events for it to work (See above).

**`nimble.Touch::released`**

An array of the finger objects for fingers that stopped touching the screen since the last step. These are fingers that were touching in the previous step, and are now no longer touching the screen in this step. Unlike the `fingers` object, this is an array.

Because it's a step-based state object, the touch module must be set up for step-based events for it to work (See above).

**`nimble.Touch::steps`**

The nimble.Touch module supports step-based state, and therefore has a `steps` property that, when set to `true`, will trigger it to update its step-based state. Be sure to use `stepclear()` as prescribed above under *Preparing Modules for Step-based Events*.

### Methods:

**`nimble.clear()`**

This is a hard-clear method, cancelling all fingers on the screen. This will clear all the fingers from the `fingers` object, and, if using step-based state, all the fingers will be added to the `released` array, as if they had been released. After calling this, any actual fingers touching the screen will need to be removed and retouch the screen before triggering anything else.

**`nimble.stepclear()`**

Use this method at the end of the step-loop when utilizing the touch module's step-based state.

### Hooks:

**`"start"`**

Triggered whenever fingers touch the screen.

- `ev.event` event type: "start"
- `ev.fingers` an array of new finger objects that just started touching the screen
- `ev.original` the original event object

**`"move"`**

- `ev.event` event type: "move"
- `ev.fingers` an array of the finger objects that just moved
- `ev.original` the original event object

**`"end"`**

- `ev.event` event type: "end"
- `ev.fingers` an array of the finger objects that were just released or canceled
- `ev.canceled` if this event was triggered from a touch being canceled instead of released
- `ev.original` the original event object

### nimble.Touch::Fingers

Each instance of this class represents a finger as it has touched and moves across the screen. This object is the `finger` object referred to in various places above. Finger objects track their own finger's x and y, and also have their own hooks.

### Properties:

**`nimble.Touch::Finger::x`**<br/>
**`nimble.Touch::Finger::y`**

The position of the finger on the screen. This coordinate will be relative to the touch module's context object.

**`nimble.Touch::Finger::identifier`**

This is the browser-generated identifier (usually just an integer) indicating which finger is touching the screen. This is provided by the browser usually to enable tracking specific fingers, but since Nimble handles this automatically, and generates finger tracking objects, there's usually no need to use this identifier.

**`nimble.Touch::Finger::ended`**

A boolean: whether or not this finger is still touching the screen. Because Nimble's finger tracking is handled by objects, one may obtain a finger object he wants to track, and assign it to a variable. From that point, he can track the x and y of the object as it moves. In order to determine when it's released, this property can be queried.

### Hooks:

**`"move"`**

Triggered when the finger moves on the screen.

- `ev.event` event type: "move"
- `ev.x` the new x of the finger
- `ev.y` the new y of the finger
- `ev.original` the original event object; note this object may have information on the movement of other fingers

**`end`**

Triggered when the finger leaves the screen or is canceled. Also triggered when the fingers are cleared via `nimble.Touch::clear()`.

- `ev.event` event type: "end"
- `ev.x` the x of the finger when it left
- `ev.y` the y of the finger when it left
- `ev.canceled` if this event was triggered from the finger touch being canceled instead of released; this value may also be the integer '2' in the case of fingers being cleared.
- `ev.original` the original event object; this will be `null` if fingers were cleared

## nimble.Orientation

A module for handling device orientation and acceleration, providing mappings back and forth between reality space and device space.

Notice that some devices do not have a gyroscope, an accelerometer, or both. In such cases, the properties related to unavailable inputs will simply remain 0.

### Properties:

**`nimble.Orientation::alpha`**<br/>
**`nimble.Orientation::beta`**<br/>
**`nimble.Orientation::gamma`**

The alpha, beta, and gamma rotation of the device in degrees. For more information on rotation of devices, look up the 'deviceorientation' JavaScript event. A thorough description of the event and angle system can be found here:
https://w3c.github.io/deviceorientation/spec-source-orientation.html#deviceorientation

**`nimble.Orientation::xgrav`**<br/>
**`nimble.Orientation::ygrav`**<br/>
**`nimble.Orientation::zgrav`**

The vector of the acceleration including gravity. Given that the device's orientation at times can be off, this gives a vector generally relating what direction 'down' is to the device in relation to the screen. E.g., if `zgrav` is `-9.81`, the device is probably down flat. If `xgrav` or `ygrav` are non-zero, the device is tilted downward in that general direction.

Note that some device accelerometers don't include acceleration with gravity. If not, Nimble will auto-fill these values with a guestimate based on the device's orientation according to its gyroscope.

**`nimble.Orientation::xacc`**<br/>
**`nimble.Orientation::yacc`**<br/>
**`nimble.Orientation::zacc`**

The vector of the acceleration excluding gravity.

Note that some device accelerometers don't include acceleration without gravity. If not, Nimble will take the acceleration that includes gravity and try to subtract gravity out based on the device's orientation according to its gyroscope. Please be aware this is not extremely accurate, especially when the device's gyroscope is not well calibrated.

**`nimble.Orientation::xorient`**<br/>
**`nimble.Orientation::yorient`**<br/>
**`nimble.Orientation::zorient`**

Each of these properties is an object containing three values: `x`, `y`, and `z`. Each of these properties represents a base vector. Each base vector is in reality-space (x being east-west, y being north-south, and z being up-down), and represents the base-vector orientation of the device in this reality-space system.

**`nimble.Orientation::xreal`**<br/>
**`nimble.Orientation::yreal`**<br/>
**`nimble.Orientation::zreal`**

Each of these properties is an object containing three values: `x`, `y`, and `z`. Each of these properties represents a base vector. Each base vector is in screen-space coordinates, and represents the direction that follows an axis in reality.

### Methods:

**`nimble.Orientation::stepclear()`**

For consistency's sake, this method is included. Please note the nimble.Orientation module *does not have* step-based state (at least as of now). This method is included simply to avoid an error being thrown if `stepclear()` is called for a general list of modules.

### Hooks:

**`"rotate"`**

Triggered when a change occurs in device rotation.

- `ev.event` event type: "rotate"
- `ev.alpha` the new alpha angle
- `ev.beta` the new beta angle
- `ev.gamma` the new gamma angle
- `ev.original` the original event object

**`"move"`**

Triggered when a change in device acceleration occurs.

- `ev.event` event type: "move"
- `ev.xacc` the new x acceleration
- `ev.yacc` the new y acceleration
- `ev.zacc` the new z acceleration
- `ev.xgrav` the new x acceleration with gravity
- `ev.ygrav` the new y acceleration with gravity
- `ev.zgrav` the new z acceleration with gravity
- `ev.original` the original event object

## Final Notes

I wrote Nimble mainly for my own personal use. For its simplicity and flexibility for use in games / game engines, I'm releasing it for free public use. I cannot guarantee full stability. If you discover bugs (i.e., differences between the operations as described above and the actual operations of the code), feel free to report them. However, if you don't like how something operates, or if you're looking for additional operation, you're free to ask me, as I might choose to change it. However, I don't plan on making any major updates to it in the near future, other than continuing to include support for minor changes in technologies to preserve its compatibility. Otherwise, feel free to modify or fork it.

As a secondary note, please be aware that allowed use of many of the new JavaScript APIs are being quickly retracted from what are considered 'insecure origins'. This is mostly happening in Chrome, and will soon apply to deviceorientation and devicemotion, which nimble.Orientation relies on. If / when this happens, nimble.Orientation will cease to operate on insecure origins such as sites with the 'http' protocol as well as opening an HTML file directly from your desktop. To get around this, you may try using Firefox, as it's far looser on this issue.<br/>
For more information, this discussion lists many of the considered changes:
https://groups.google.com/a/chromium.org/forum/#!topic/blink-dev/2LXKVWYkOus%5B1-25%5D
