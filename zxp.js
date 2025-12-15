const AdmZip = require('adm-zip');
const fs = require('fs');

console.log('📦 Empacotando ToolKit - By The Glez...');

try {
    const zip = new AdmZip();

    // 1. Adicionar Pastas Essenciais
    if (fs.existsSync('CSXS')) zip.addLocalFolder("CSXS", "CSXS");
    if (fs.existsSync('host')) zip.addLocalFolder("host", "host");
    if (fs.existsSync('dist')) zip.addLocalFolder("dist", "dist");

    // 2. Adicionar Arquivos na Raiz
    zip.addLocalFile("index.html");
    if (fs.existsSync('metadata.json')) zip.addLocalFile("metadata.json");
    
    // 3. Salvar como .zxp
    // Um ZXP não assinado é basicamente um zip. Instaladores como ZXPInstaller 
    // podem reclamar, mas a estrutura interna está correta.
    zip.writeZip("ToolKit-ByTheGlez.zxp");
    
    console.log("✅ SUCESSO! Arquivo 'ToolKit-ByTheGlez.zxp' criado na raiz.");
    console.log("ℹ️  Para instalar: Use o ZXPInstaller ou mude a extensão para .zip e extraia na pasta de extensões da Adobe.");
} catch (e) {
    console.error("❌ Erro ao criar ZXP:", e);
}