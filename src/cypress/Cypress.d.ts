export {};

declare global {
  namespace Cypress {
    class Promise<T = unknown> {
      constructor(
        callback: (
          res: (data: T) => void,
          rej: (error?: unknown) => void
        ) => void
      );
      then<K = T>(callback: (data: T) => K): Promise<K>;
      catch<K = void>(callback: (error: unknown) => K): Promise<K>;
    }
    const currentTest: { title: string; titlePath: string[] } | undefined;
    const spec: { relative: string };
    const env: (name: string) => string;
  }

  namespace cy {
    const writeFile: (path: string, data: unknown) => Promise<void>;
    const readFile: (path: string) => Promise<string>;
  }

  const before: (callback: () => void) => void;
  const after: (callback: () => void) => void;
  const describe: ((name: string, callback: () => void) => void) &
    ((name: string, params: object, callback: () => void) => void);
  const it: (name: string, callback: () => void) => void;
}
