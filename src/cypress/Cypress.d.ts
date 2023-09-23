export {};

declare global {
  namespace Cypress {
    const currentTest: { title: string; titlePath: string[] } | undefined;
    const spec: { relative: string };
    const env: (name: string) => string;
  }

  namespace cy {
    const writeFile: (path: string, data: unknown) => Promise<void>;
  }

  const after: (callback: () => void) => void;
  const describe:
    & ((name: string, callback: () => void) => void)
    & ((name: string, params: object, callback: () => void) => void);
  const it: (name: string, callback: () => void) => void;
}
