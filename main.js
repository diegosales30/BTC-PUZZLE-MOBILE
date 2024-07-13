import ranges from './ranges.js';
import readline from 'readline';
import chalk from 'chalk';
import CoinKey from 'coinkey';
import walletsArray from './wallets.js';
import fs from 'fs';
import crypto from 'crypto';

const walletsSet = new Set(walletsArray);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let shouldStop = false;

let min, max = 0;
const bold = chalk.bold.green;
console.clear();
console.log(chalk.red('--------------------'));
console.log(chalk.bold(chalk.green("BTC-PUZZLE V1")));
console.log(bold("by:DiegoDev"));
console.log(chalk.red('--------------------'));

rl.question(`${chalk.yellowBright('SELECIONE ')} ${chalk.cyan(1)} - ${chalk.cyan(160)}: `, (answer) => {
    if (parseInt(answer) < 1 || parseInt(answer) > 160) {
        console.log(chalk.bgRed('Erro: você precisa escolher um número entre 1 e 160'));
    } else {
        min = BigInt(ranges[answer-1].min);
        max = BigInt(ranges[answer-1].max);
        console.log('Puzzle escolhido:', chalk.cyan(answer));
        console.log('Chaves possíveis:', chalk.yellow((max - min).toLocaleString('pt-BR')));

        rl.question(`${chalk.yellow('COMEÇAR? Y/N:')}(${chalk.cyan('Y')})`, (answer1) => {
            if (answer1 == 'y' || answer1 == "Y") {
                encontrarBitcoins(min, max, shouldStop);
                rl.close();
            } else {
                console.log(chalk.red('Operação cancelada!'));
                console.log(chalk.yellow('CTRL + C para recomeçar.'));
            }
        });
    }
});

rl.on('SIGINT', () => {
    shouldStop = true;
    rl.close();
    process.exit();
});

process.on('SIGINT', () => {
    shouldStop = true;
    rl.close();
    process.exit();
});

function getRandomPrivateKey(min, max) {
    const range = max - min;
    const randomOffset = BigInt('0x' + crypto.randomBytes(16).toString('hex')) % range;
    return min + randomOffset;
}

async function encontrarBitcoins(min, max, shouldStop) {
    let segundos = 0;
    const startTime = Date.now();

    console.log('Buscando Bitcoins...');

    const executeLoop = async () => {
        while (!shouldStop) {
            const key = getRandomPrivateKey(min, max);
            let pkey = key.toString(16).padStart(64, '0');
            let formattedPkey = pkey.replace(/^0+/, ''); // Remove leading zeros
    
            console.log(`keys: ${formattedPkey}`);
    
            if (Date.now() - startTime > segundos) {
                segundos += 1000;
                console.log(segundos / 1000);
                if (segundos % 10000 == 0) {
                    const tempo = (Date.now() - startTime) / 1000;
                    console.clear();
                    console.log('Resumo:');
                    console.log('Velocidade:', Number(key - min) / tempo, 'chaves por segundo');
                    console.log('Chaves buscadas:', (key - min).toLocaleString('pt-BR'));
                    console.log('Última chave tentada:', formattedPkey);
    
                    const filePath = 'Ultima_chave.txt';
                    const content = `Última chave tentada: ${formattedPkey}`;
                    try {
                        fs.writeFileSync(filePath, content, 'utf8');
                    } catch (err) {
                        console.error('Erro ao escrever no arquivo:', err);
                    }
                }
            }
    
            let publicKey = generatePublic(pkey);
            if (walletsSet.has(publicKey)) {
                const tempo = (Date.now() - startTime) / 1000;
                console.log(chalk.red('******************'));
                console.log('Time:', chalk.yellow(tempo));
                console.log('P-Key found:', chalk.yellow(formattedPkey));
                console.log('WIF:', chalk.yellow(generateWIF(pkey)));
                const filePath = 'keys.txt';
                const lineToAppend = `Private key: ${pkey}, WIF: ${generateWIF(pkey)}\n`;
    
                try {
                    fs.appendFileSync(filePath, lineToAppend);
                    console.log('chave salva no arquivo:', chalk.yellow('keys.txt'));
                    console.log(chalk.red('******************'));
                } catch (err) {
                    console.error('Erro ao escrever chave em arquivo:', err);
                }
    
                shouldStop = true;
            }
    
            await new Promise(resolve => setImmediate(resolve));
        }
    };
    await executeLoop();
}

function generatePublic(privateKey) {
    let _key = new CoinKey(Buffer.from(privateKey, 'hex'));
    _key.compressed = true;
    return _key.publicAddress;
}

function generateWIF(privateKey) {
    let _key = new CoinKey(Buffer.from(privateKey, 'hex'));
    return _key.privateWif;
}

export default encontrarBitcoins;