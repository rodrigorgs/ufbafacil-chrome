let nextCommand = {
  name: 'wait',
}

// all commands get an object as a parameter, containing the object returned
// by getInitialData(), merged by object in the step's data property
const workflows = {
  'teste': { // workflow
    initialUrl: 'https://www.ufba.br',
    steps: [
      {command: teste}
    ]
  },
  'searchProcesso': {
    initialUrl: 'https://sipac.ufba.br/public/jsp/portal.jsf',
    getInitialData: (request) => ({numeroProcesso: request.processo}),
    steps: [
      {command: searchProcesso},
      {command: openInMesaVirtual},
    ]
  },
  'createDocument': {
    initialUrl: 'https://sipac.ufba.br/sipac/portal_administrativo/index.jsf',    
    steps: [
      {command: openCreateDocumentPage},
      {command: chooseDocumentType, data: {value: 'DECLARAÇÃO'}},
      {command: chooseDocumentSubject, data: {value: '125.322'}},
      {command: chooseNaturezaAndAssunto, data: {natureza: '1', assunto: 'teste da extensão'}},
      {command: addAssinantesAndText, data: {text: 'Testando 1, 2, 3'}}
    ]
  }
}

let currentWorkflow = null;
let currentStep = 0;
let currentInitialData = {};

////////////////////////

async function openInMesaVirtual() {
  performEvent('click', 'img[alt="Visualizar Processo na Mesa Virtual"]')
}
async function openCreateDocumentPage() {
  performEvent('mouseover', '//span[text()="Protocolo"]');
  performEvent('mouseover', '(//td[text()="Documentos"])[2]');
  performEvent('mouseup', '//td[text()="Cadastrar Documento"]');
}
async function chooseDocumentType(data) {
  const value = data.value || throwError('value is required');
  await searchAndSelectFirstOptionRichFaces('#documentoForm\\:tipo', value);
}
async function chooseDocumentSubject(data) {
  const value = data.value || throwError('value is required');
  await searchAndSelectFirstOptionRichFaces('#documentoForm\\:classificacaoConarq', value);
}
async function chooseNaturezaAndAssunto(data) {
  const natureza = data.natureza || '1'; // OSTENSIVO
  const assunto = data.assunto || throwError('assunto is required');

  document.getElementById('documentoForm:natureza').value = natureza;
  document.getElementById('documentoForm:c_assunto_detalhado').value = assunto;
  performEvent('click', "(//*[contains(text(), 'Escrever Documento')])[2]")
}
async function addAssinantesAndText(data) {
  const text = data.text || throwError('text is required');
  const editor = document.querySelector('#documentoForm\\:_texto_documento_ifr').contentDocument.body;
  editor.innerText = text;

  performEvent('mouseover', '#documentoForm\\:btnAdicionarAssinante')
  performEvent('click', '#documentoForm\\:linkAdicionarMinhaAssinatura')
}

async function teste() {
  console.log(1);
  helloWorld();
  console.log(2);
}

async function searchProcesso(data) {
  console.log('searchProcesso data:', data);
  const numeroProcesso = data.numeroProcesso || throwError('numeroProcesso is required');

  // navigateToConsultaProcessos
  performEvent('mousedown', '#l-processos');
  
  // fillInProcesso
  const parts = numeroProcesso.split(/[^\d]/);
  const inputs = document.querySelectorAll('div.num_processo-div.campo-busca > input[type="text"]');
  for (let i = 0; i < 4; i++) {
    inputs[i].value = parts[i];
    inputs[i].dispatchEvent(new Event('input'));
  }

  // clickSubmit
  performEvent('click', 'input[value="Consultar Processo"]');
}

////////////////////////

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    
    if (currentWorkflow && currentStep < currentWorkflow.steps.length) {
      // inject util functions in every page
      await chrome.scripting.executeScript({target: {tabId: tabId}, files: ['arrive.min.js', 'utils.js']});

      const step = currentWorkflow.steps[currentStep];
      const func = step['command'];
      await chrome.scripting.executeScript({
        target: {tabId: tabId},
        args: [{...currentInitialData, ...step.data}],
        function: func
      });

      currentStep++;
    } else {
      currentWorkflow = null;
      currentStep = 0;
    }
  }
});

async function redirectTo(tab, url) {  
  return chrome.scripting.executeScript({
    target: {tabId: tab.id},
    args: [url],
    function: (url) => {
      location.href = url;
    }
  });
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  currentWorkflow = workflows[request.type];
  if (currentWorkflow) {
    redirectTo(tab, currentWorkflow.initialUrl);
    currentStep = 0;
    currentInitialData = {};
    if (currentWorkflow.getInitialData) {
      currentInitialData = await currentWorkflow.getInitialData(request);
    }
  }
});
