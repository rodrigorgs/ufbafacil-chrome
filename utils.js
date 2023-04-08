function getElementByXpath(path, doc) {
  doc = doc || document;
  return doc.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function throwError(message) {
  console.error(message);
  throw new Error(message);
}

async function searchAndSelectFirstOptionRichFaces(selector, value) {
  const elem = document.querySelector(selector);
  elem.focus();
  performEvent('keydown', elem, { char: value });
  await new Promise(res => setTimeout(res, 2000));
  performEvent('click', '.rich-sb-cell-padding.richfaces_suggestionSelectValue');
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