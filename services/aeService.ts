export const runAeScript = (functionName: string, args?: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const csInterface = new window.CSInterface();
    
    // Serialize args if they exist
    let command = '';
    if (args) {
        const jsonArgs = JSON.stringify(args);
        // Escape backslashes for ExtendScript
        const escapedArgs = jsonArgs.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        command = `$._TheGlez.${functionName}('${escapedArgs}')`;
    } else {
        command = `$._TheGlez.${functionName}()`;
    }

    csInterface.evalScript(command, (result: string) => {
        if (result === 'evalScript error') {
            reject(new Error('Script execution failed'));
        } else {
            resolve(result);
        }
    });
  });
};

export const openUrl = (url: string): void => {
    const csInterface = new window.CSInterface();
    csInterface.openURLInDefaultBrowser(url);
}