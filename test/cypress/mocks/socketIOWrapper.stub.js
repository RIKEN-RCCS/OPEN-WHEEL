const SIO = {
  emitGlobal: (...args) => {
    const last = args[args.length - 1]
    if (typeof last === 'function') { try { last({ ok: true }) } catch(_) {} }
  },
  onGlobal: () => {},
  offGlobal: () => {},
}
export default SIO
