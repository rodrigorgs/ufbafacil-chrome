// wait for an element that either does not exist or is not visible
function waitFor(selector) {
  return new Promise(resolve => {
    document.arrive(
      selector,
      {fireOnAttributesModification: true, onceOnly: true},
      () => { resolve(); });
  });
}

function getElementByXpath(path, doc) {
  doc = doc || document;
  return doc.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function throwError(message) {
  const fullMessage = `UFBA Fácil Error: ${message}`;
  console.error(fullMessage);
  throw new Error(fullMessage);
}

async function searchAndSelectFirstOptionRichFaces(selector, value) {
  const suggestionSelector = '.rich-sb-cell-padding.richfaces_suggestionSelectValue';
  waitFor(suggestionSelector).then(() => {
    // will be executed in the end, after the suggestion is shown
    performEvent('click', suggestionSelector);
  });

  const elem = document.querySelector(selector);
  elem.focus();
  performEvent('keydown', elem, { char: value });
}


function performEvent(eventName, selectorOrElement, eventArgs) {
  eventArgs = eventArgs || {};

  let element = null;
  if (selectorOrElement instanceof Element) {
    element = selectorOrElement;
  } else if (selectorOrElement.startsWith('/') || selectorOrElement.startsWith('(')) {
    element = getElementByXpath(selectorOrElement);
  } else {
    element = document.querySelector(selectorOrElement);
  }
  console.log(element);
  // TODO: wait for the element to be present. See  solution that is not time-dependent: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists

  if (element === null) {
    alert(`Element not found: ${selectorOrElement}`);
  }

  if (['mouseover', 'mousedown', 'mouseup', 'click'].includes(eventName)) {
    element.dispatchEvent(new MouseEvent(eventName, { bubbles: true }));
  } else {
    element.dispatchEvent(new KeyboardEvent(eventName, { bubbles: true, ...eventArgs }));
    if (eventArgs['char']) {
      element.value = eventArgs['char'];
    }
  }
}

function helloWorld() {
  console.log('hello world');
}