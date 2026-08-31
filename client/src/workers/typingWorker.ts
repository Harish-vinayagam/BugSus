interface StartMessage {
  cmd: 'start';
  speed: number;
  length: number;
}

interface StopMessage {
  cmd: 'stop';
}

type Incoming = StartMessage | StopMessage;

let timer: number | null = null;
let i = 0;

const clear = () => {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
};

self.onmessage = (ev: MessageEvent<Incoming>) => {
  const msg = ev.data;
  if (msg.cmd === 'start') {
    clear();
    i = 0;
    const { speed, length } = msg;
    timer = setInterval(() => {
      i += 1;
      // send current index (1-based)
      // @ts-ignore - Worker types
      self.postMessage({ i });
      if (i >= length) {
        // done
        // @ts-ignore
        self.postMessage({ done: true });
        clear();
      }
    }, speed) as unknown as number;
  } else if (msg.cmd === 'stop') {
    clear();
  }
};

export {};
