#!/usr/bin/env node 

import readline from 'readline';
import request from 'request';
import fs from 'fs';
import { parse } from 'csv-parse';
import store from 'store';

const rl = readline.createInterface({
    input: process.stdin, 
    output: process.stdout,
    terminal: true
});

const APIKey = '2113ace96680eda406f8326d24571685fdb785975bc1005ba38c797e15ad5084';

const askOptions = () => {
    return new Promise((resolve, reject) => {
        rl.question(`\n Please enter your input. If you: \n
            Press 1: to return the latest portfolio value per token in USD \n
            Press 2: then you need to enter a token to return the latest portfolio value for that token in USD \n
            Press 3: then you need to a date to return the latest portfolio value per token in USD on that date \n
            Press 4: then you need to enter a date an a token to return return the portfolio value of the token in USD on that date \n
            Press 5: to exit the program
        `,  (option) => {
            console.log('You have selected the option: ' + option);
            resolve(option);
        });
        rl.on('error', (error) => {
            reject(error.message);
        });
    });
};

const askUserForToken = () => {
    return new Promise((resolve, reject) => {
        rl.setPrompt('Enter the token: ');
        rl.prompt();
        rl.on('line', (token) => {
            resolve(token.toUpperCase());
        });
        rl.on('error', (error) => {
            reject(error.message);
        });
    });
};

const askUserForDate = () => {
    return new Promise((resolve, reject) => {
        rl.setPrompt('Enter the Date. Do not enter a future date or a date before 01/01/1970. Please follow the format mm/dd/yyyy. For example: 02/05/2018 Your input: ');
        rl.prompt();
        rl.on('line', (token) => {
            resolve(token);
        });
        rl.on('error', (error) => {
            reject(error.message);
        });
    });
};

const askUserForDateAndToken = () => {
    return new Promise((resolve, reject) => {
        rl.setPrompt('Enter the date and token. Do not enter a future date or a date before 01/01/1970. Please follow the format mm/dd/yyyy-token. For example: 02/05/2018-btc Your input: ');
        rl.prompt();
        rl.on('line', (token) => {
            resolve(token);
        });
        rl.on('error', (error) => {
            reject(error.message);
        });
    });
};

const getValuePerToken = (selectedDate, ...requiredTokens) => {
    const readCSVData = fs.createReadStream('./transactions.csv').pipe(parse({ delimiter: ',', from_line: 2 }));//.pipe(csvParser());

    return new Promise ((resolve, reject) => {
        let btcArr = { 'token': 'BTC', 'amount': 0 };
        let ethArr = { 'token': 'ETH', 'amount': 0 };
        let xprArr = { 'token': 'XRP', 'amount': 0 };
        let valueOutput = [];

        readCSVData
            .on('data', (row) => {
                if(checkTimestamp(Number(row[0]), selectedDate)) {
                    if (row[2] === 'BTC' && requiredTokens.includes('BTC')) {
                        if (row[1] === 'DEPOSIT') {
                            btcArr.amount +=+ Number(row[3]);
                        } else {
                            btcArr.amount -=+ Number(row[3]);
                        }
                    } else if (row[2] === 'ETH' && requiredTokens.includes('ETH')) {
                        if (row[1] === 'DEPOSIT') {
                            ethArr.amount +=+ Number(row[3]);
                        } else {
                            ethArr.amount -=+ Number(row[3]);
                        }
                    } else if (row[2] === 'XRP' && requiredTokens.includes('XRP')) {
                        if (row[1] === 'DEPOSIT') {
                            xprArr.amount +=+ Number(row[3]);
                        } else {
                            xprArr.amount -=+ Number(row[3]);
                        }
                    }
                }
            })
            .on('end', () => {
                valueOutput.push(btcArr);
                valueOutput.push(ethArr);
                valueOutput.push(xprArr);
                resolve(valueOutput);
            }).on('error', (error) => {
                console.log('error.message >>>', error.message);
                reject(error.message);
            });
        });
};

const fetchAPIs = (APIUrl) => {
    return new Promise ((resolve, reject) => {
        request.get(APIUrl)
            .on('response', (response) => {
                response.on('data', data => {
                    resolve(JSON.parse(data));
                });
            })
            .on('error', error => {
                reject(error);
            });
    });
};

const convertDateToTimestamp = (strDate) => { // Format: 02/13/2009 mm/dd/yyyy 
    const date = Date.parse(strDate); // GMT - 7
    const userTimezoneOffset = (new Date(date).getTimezoneOffset() * 60000)/1000; // convert the date to the timestamp at midnight without timezone. This may be affected by Daylight Saving GMT - 8. If the Daylight Saving is in effect, the clock goes backward one hour
    return date/1000 - userTimezoneOffset;
};

const checkTimestamp = (timeStamp, thatDate) => {
    if (thatDate === 0)
        return true;
    else {
        const onedDayLater = thatDate + 86399; //one day has 86399 seconds
        return (timeStamp >= thatDate && timeStamp <= onedDayLater);
    }
};

const convertNumberIntoUSD = (number) => {
    return (number).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
    });
};

const storeValuesLocally = (token, value) => {
    store.set(token, value);
};

const checkStoredValues = (...token) => {
    let isAvailable = true;
    token.map(val => {
        if (!store.get(val)) {
            isAvailable = false;
        }
    });
    return isAvailable;
};

const main = async () => {
    let userOption = await askOptions();

    try {
        if (!isNaN(parseInt(userOption)) && userOption >= 1 && userOption <= 5) {
            switch(userOption) { 
                case '1':
                    let latestTokenValues = [];
                    if (checkStoredValues('BTC','ETH', 'XRP')) {
                        latestTokenValues = [ {token: 'BTC', amount: store.get('BTC')}, {token: 'ETH', amount: store.get('ETH')}, {token: 'XRP', amount: store.get('XRP')} ];
                    } else {
                        latestTokenValues = await getValuePerToken(0, 'BTC','ETH', 'XRP');
                        storeValuesLocally('BTC', latestTokenValues[0].amount);
                        storeValuesLocally('ETH', latestTokenValues[1].amount);
                        storeValuesLocally('XRP', latestTokenValues[2].amount);
                    }

                    const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,XRP&tsyms=USD&api_key=${APIKey}`; // Tokens: fsyms=BTC,ETH,XRP, Currency: tsyms=USD
                    const rateValuesinUSD = await fetchAPIs(url);

                    if ('Response' in rateValuesinUSD)
                        throw Error('API Fetch failed');

                    const latestPortfolioforBTCinUSD = latestTokenValues[0].amount * rateValuesinUSD.BTC.USD;
                    const latestPortfolioforETHinUSD = latestTokenValues[1].amount * rateValuesinUSD.ETH.USD;
                    const latestPortfolioforXRPinUSD = latestTokenValues[2].amount * rateValuesinUSD.XRP.USD;

                    console.log('\x1b[32m%s\x1b[0m','The latest portfolio value for BTC in USD: ', convertNumberIntoUSD(latestPortfolioforBTCinUSD), '\n');
                    console.log('\x1b[32m%s\x1b[0m','The latest portfolio value for ETH in USD: ', convertNumberIntoUSD(latestPortfolioforETHinUSD), '\n');
                    console.log('\x1b[32m%s\x1b[0m', 'The latest portfolio value for XRP in USD: ', convertNumberIntoUSD(latestPortfolioforXRPinUSD), '\n');

                    console.log('\x1b[33m%s\x1b[0m', 'Select other options \n');
                    main();
                    break;
                case '2':
                    const token = await askUserForToken();

                    if (['BTC', 'ETH', 'XRP'].indexOf(token.toUpperCase()) !== -1) {
                        let latestTokenValues = [];
                        if (checkStoredValues('BTC','ETH', 'XRP')) {
                            latestTokenValues = [ {token: 'BTC', amount: store.get('BTC')}, {token: 'ETH', amount: store.get('ETH')}, {token: 'XRP', amount: store.get('XRP')} ];
                        } else {
                            latestTokenValues = await getValuePerToken(0, token);
                            storeValuesLocally(token, latestTokenValues.find(ele => ele.token === token).amount);
                        }

                        const url = `https://min-api.cryptocompare.com/data/price?fsym=${token}&tsyms=USD&api_key=${APIKey}`;  // Tokens: fsyms=token, Currency: tsyms=USD
                        const rateValuesinUSD = await fetchAPIs(url);
                        // console.log('rateValuesinUSD  <2>', rateValuesinUSD)

                        if ('Response' in rateValuesinUSD)
                            throw Error('API Fetch failed');

                        const latestPortfolioforTokeninUSD = latestTokenValues.find(ele => ele.token === token).amount * rateValuesinUSD.USD;

                        console.log('\x1b[32m%s\x1b[0m',`The latest portfolio value for ${token} in USD:`, convertNumberIntoUSD(latestPortfolioforTokeninUSD), '\n');

                        console.log('\x1b[33m%s\x1b[0m', 'Select other options \n');
                        main();
                    } else {
                        console.error('\x1b[33m%s\x1b[0m', 'Please just enter one of these tokens: BTC, ETH, XRP. Please go back to the main menu \n');
                        console.log('\x1b[33m%s\x1b[0m', 'Select other options \n');
                        main();
                    }
                    break;   
                case '3':
                    const dateInput = await askUserForDate();
                    const dateToTimestamp = convertDateToTimestamp(dateInput);

                    if (!isNaN(dateToTimestamp) && dateToTimestamp >= 0) {
                        const tokenValuesOnDate = await getValuePerToken(dateToTimestamp, 'BTC','ETH', 'XRP');

                        if (tokenValuesOnDate[0].amount === 0 && tokenValuesOnDate[1].amount === 0 && tokenValuesOnDate[2].amount === 0){
                            console.log('\x1b[33m%s\x1b[0m', 'We cannot find the data on the given inputs. Please go back to the main menu \n');
                            main();
                            return;
                        }

                        const btcUrlOnDate = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=btc&tsym=USD&toTs=${dateToTimestamp}&limit=1&api_key=${APIKey}`; // btc on date date
                        const ethUrlOnDate = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=eth&tsym=USD&toTs=${dateToTimestamp}&limit=1&api_key=${APIKey}`; // eth on date date
                        const xrpUrlOnDate = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=xrp&tsym=USD&toTs=${dateToTimestamp}&limit=1&api_key=${APIKey}`; // xrp on date date

                        const btcRateOnDateInUSD = await fetchAPIs(btcUrlOnDate);
                        const ethRateOnDateInUSD = await fetchAPIs(ethUrlOnDate);
                        const xrpRateOnDateInUSD = await fetchAPIs(xrpUrlOnDate);

                        if (btcRateOnDateInUSD.Response === 'Error' || ethRateOnDateInUSD.Response === 'Error' || xrpRateOnDateInUSD.Response === 'Error'){
                            throw Error('API Fetch failed');
                        }
 
                        const portfolioforBTCinUSDonDate = tokenValuesOnDate[0].amount * btcRateOnDateInUSD.Data.Data[1].close;
                        const portfolioforETHinUSDonDate = tokenValuesOnDate[1].amount * ethRateOnDateInUSD.Data.Data[1].close;
                        const portfolioforXRPinUSDonDate = tokenValuesOnDate[2].amount * xrpRateOnDateInUSD.Data.Data[1].close;

                        console.log('\x1b[32m%s\x1b[0m',`The portfolio value for BTC in USD on ${dateInput}: `, convertNumberIntoUSD(portfolioforBTCinUSDonDate), '\n');
                        console.log('\x1b[32m%s\x1b[0m',`The portfolio value for ETH in USD on ${dateInput}:`, convertNumberIntoUSD(portfolioforETHinUSDonDate), '\n');
                        console.log('\x1b[32m%s\x1b[0m', `The portfolio value for XRP in USD on ${dateInput}:`, convertNumberIntoUSD(portfolioforXRPinUSDonDate), '\n');

                        console.log('\x1b[33m%s\x1b[0m', 'Select other options \n');
                        main();
                    } else {
                        console.error('\x1b[33m%s\x1b[0m', 'Sorry you did enter a wrong date in format. Please go back to the main menu \n');
                        console.log('\x1b[33m%s\x1b[0m', 'Select other options \n');
                        main();
                    }
                    break;
                case '4':
                    const dateAndtoken = await askUserForDateAndToken();
                    const datetoTimestampOpt4 = convertDateToTimestamp(dateAndtoken.split('-')[0]);
                    const tokenInputOpt4 = (dateAndtoken.split('-')[1] !== undefined) ? dateAndtoken.split('-')[1].toUpperCase() : '';

                    if (!isNaN(datetoTimestampOpt4) && ['BTC', 'ETH', 'XRP'].indexOf(tokenInputOpt4) !== -1 && datetoTimestampOpt4 >= 0) {
                        const tokenValuesOnDate = await getValuePerToken(datetoTimestampOpt4, tokenInputOpt4);

                        if (tokenValuesOnDate.find(ele => ele.token === tokenInputOpt4).amount === 0) {
                            console.log('\x1b[33m%s\x1b[0m', 'We cannot find the data on the given inputs. Please go back to the main menu \n');
                            main();
                            return;
                        }
                        
                        const tokenUrlOnThatDate = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${tokenInputOpt4}&tsym=USD&toTs=${datetoTimestampOpt4}&limit=1&api_key=${APIKey}`; // token on date date
                        const tokenRateOnDateInUSD = await fetchAPIs(tokenUrlOnThatDate);
                        
                        if (tokenRateOnDateInUSD.Response === 'Error')
                            throw Error('API Fetch failed');

                        const portfolioforTokeninUSDonDate = tokenValuesOnDate.find(ele => ele.token === tokenInputOpt4).amount * tokenRateOnDateInUSD.Data.Data[1].close;

                        console.log('\x1b[32m%s\x1b[0m',`The portfolio value for ${tokenInputOpt4} in USD on ${dateAndtoken.split('-')[0]}: `, convertNumberIntoUSD(portfolioforTokeninUSDonDate), '\n');
                        console.log('\x1b[33m%s\x1b[0m', 'Select other options \n');
                        main();
                    } else {
                        console.error('\x1b[33m%s\x1b[0m', 'Sorry you entered a wrong date or token in format. Please go back to the main menu \n');
                        console.log('\x1b[33m%s\x1b[0m', 'Select other options \n');
                        main();
                    }
                    break;
                case '5':
                    console.log('\x1b[31m%s\x1b[0m', 'You closed the program');
                    rl.close();
                    process.exit(0);
                default:
                    rl.close();
            }
        } else {
            console.error('\x1b[33m%s\x1b[0m', 'Enter from 1 to 5. Please go back to the main menu \n');    
            main();
        }
    } catch (error) {
        console.error('Error was found: ', error.message);
        console.log('\x1b[31m%s\x1b[0m', 'the error was found. Please try again');
        main();
    }
};

main();
