export const runAeScript = (functionName: string): void => {
  const csInterface = new window.CSInterface();
  // We call the namespace defined in host/index.jsx
  const command = `$._TheGlez.${functionName}()`;
  csInterface.evalScript(command);
};

export const openUrl = (url: string): void => {
    const csInterface = new window.CSInterface();
    csInterface.openURLInDefaultBrowser(url);
}