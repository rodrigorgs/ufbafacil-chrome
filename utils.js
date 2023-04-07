function performEvent(eventName, selector, arguments) {
  arguments = arguments || {};

  const element = document.querySelector(selector);
  if (['mouseover', 'mousedown', 'mouseup'].includes(eventName)) {
    element.dispatchEvent(new MouseEvent(eventName, { bubbles: true }));
  } else {
    element.dispatchEvent(new KeyboardEvent(eventName, { bubbles: true, ...arguments }));
  }
}

function helloWorld() {
  console.log('hello world');
}