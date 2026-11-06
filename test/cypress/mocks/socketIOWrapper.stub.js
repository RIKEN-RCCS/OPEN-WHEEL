const SIO = {
  emitGlobal: (...args)=>{
    const last = args[args.length - 1];
    if (typeof last === "function") {
      try {
        last({ ok: true });
      } catch {
        //the stub must not throw even if the callback does
      }
    }
  },
  onGlobal: ()=>{},
  offGlobal: ()=>{}
};
export default SIO;
