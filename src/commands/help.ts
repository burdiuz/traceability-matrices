const generateStatic = () => console.log(``);

const lcov = () => console.log(``);

const scanFeatures = () => console.log(``);

const serve = () => console.log(``);

const stats = () => console.log(``);

const threshold = () => console.log(``);

const generalInfo = () => console.log(
`Supported commands are:
  generate-static - 
  lcov - 
  scan - 
  serve - 
  stats - 
  threshold - 
Add "--command=" argument to get more info on command arguments, example:
traceability-matrices help --command=serve
`);

const INFO = {
  "generate-static": generateStatic,
  help: () => console.log(`Have fun.`),
  lcov: lcov,
  scan: scanFeatures,
  serve: serve,
  stats: stats,
  threshold: threshold,
} as const;

export const help = (commandName: string) => {
  if (!commandName) {
    generalInfo();
    return;
  }

  if (INFO.hasOwnProperty(commandName)) {
    INFO[commandName]();
  } else {
    console.log(
      `There are no information on "${commandName}" command or it isn't supported.\n`
    );
    generalInfo();
  }
};
