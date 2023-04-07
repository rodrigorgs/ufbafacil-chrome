function getElementByXpath(path, doc) {
  doc = doc || document;
  return doc.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function performEvent(eventName, selector, eventArgs) {
  eventArgs = eventArgs || {};

  let element = null;
  if (selector.startsWith('/')) {
    element = getElementByXpath(selector);
  } else {
    element = document.querySelector(selector);
  }
  console.log(element);
  // TODO: wait for the element to be present. See  solution that is not time-dependent: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists

  if (element === null) {
    alert(`Element not found: ${selector}`);
  }

  if (['mouseover', 'mousedown', 'mouseup', 'click'].includes(eventName)) {
    element.dispatchEvent(new MouseEvent(eventName, { bubbles: true }));
  } else {
    element.dispatchEvent(new KeyboardEvent(eventName, { bubbles: true, ...eventArgs }));
  }
}

function helloWorld() {
  console.log('hello world');
}