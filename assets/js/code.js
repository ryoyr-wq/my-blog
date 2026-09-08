const scriptBundle = document.getElementById('script-bundle')
const copyText = scriptBundle?.getAttribute('data-copy') || 'Copy'
const copiedText = scriptBundle?.getAttribute('data-copied') || 'Copied'
const copySymbol = '⧉'
const copiedSymbol = '✓'

function setCopyButtonState(button, symbol, label) {
  button.textContent = symbol
  button.setAttribute('aria-label', label)
  button.setAttribute('title', label)
}

function createCopyButton(highlightWrapper) {
  const button = document.createElement('button')
  button.className = 'copy-button'
  button.type = 'button'
  setCopyButtonState(button, copySymbol, copyText)
  button.addEventListener('click', () => copyCodeToClipboard(button, highlightWrapper))
  highlightWrapper.insertBefore(button, highlightWrapper.firstChild)
}

async function copyCodeToClipboard(button, highlightWrapper) {
  const codeToCopy = getCodeText(highlightWrapper)

  function fallback(code) {
    const textArea = document.createElement('textarea')
    textArea.contentEditable = 'true'
    textArea.readOnly = false
    textArea.className = 'copy-textarea'
    textArea.value = code
    highlightWrapper.insertBefore(textArea, highlightWrapper.firstChild)
    const range = document.createRange()
    range.selectNodeContents(textArea)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    textArea.focus()
    textArea.setSelectionRange(0, 999999)
    document.execCommand('copy')
    highlightWrapper.removeChild(textArea)
  }

  try {
    const result = await navigator.permissions.query({ name: 'clipboard-write' })
    if (result.state === 'granted' || result.state === 'prompt') {
      await navigator.clipboard.writeText(codeToCopy)
    } else {
      fallback(codeToCopy)
    }
  } catch (_) {
    fallback(codeToCopy)
  } finally {
    button.blur()
    setCopyButtonState(button, copiedSymbol, copiedText)
    setTimeout(() => setCopyButtonState(button, copySymbol, copyText), 2000)
  }
}

function getCodeText(highlightWrapper) {
  const highlightDiv = highlightWrapper.querySelector('.highlight')
  if (!highlightDiv) return ''

  const codeBlock = highlightDiv.querySelector('code')
  const inlineLines = codeBlock?.querySelectorAll('.cl')
  const tableCodeCell = highlightDiv.querySelector('.lntable .lntd:last-child code')
  if (!codeBlock) return ''

  if (inlineLines.length > 0) {
    return Array.from(inlineLines).map((line) => line.textContent.replace(/\n$/, '')).join('\n')
  }

  if (tableCodeCell) return tableCodeCell.textContent.trim()
  return codeBlock.textContent.trim()
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.highlight-wrapper').forEach(createCopyButton)
})
