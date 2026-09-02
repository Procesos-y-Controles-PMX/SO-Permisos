const PORTAL_ID = 'so-modal-portal'

export function getModalPortalNode(): HTMLElement {
  if (typeof document === 'undefined') {
    throw new Error('Modal portal is only available in the browser.')
  }

  let node = document.getElementById(PORTAL_ID)
  if (!node) {
    node = document.createElement('div')
    node.id = PORTAL_ID
    document.body.appendChild(node)
  }
  return node
}
