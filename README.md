
# Assignment Title: Cryptocurrency Portfolio

The assignment requires the candidate to write a command line program to complete four goals as below: 


### Objectives:

 - Given no parameters, return the latest portfolio value per token in USD
 - Given a token, return the latest portfolio value for that token in USD
 - Given a date, return the portfolio value per token in USD on that date
 - Given a date and a token, return the portfolio value of that token in USD on that date
 
### Inputs:
The program has to read the data from a CSV file containing records of crypto transactions. The CSV data format includes four columns: 
 - timestamp: Integer number of seconds since the Epoch
 - transaction_type: Either a DEPOSIT or a WITHDRAWAL
 - token: The token symbol
 - amount: The amount transacted

### Installations and Dependencies:
```
1. yarn install
```
```
2. npm link
```
- The first command must be executed to install all the needed packages defined in the package.json file
- The second command is to allow you locally symlink a package folder and install any commands listed in the bin field of our package.json. Once executed, we gonna see the command being symlinked globally. In our case, we can directly run crypto.

### Roles of functions:
#### 1. getValuePerToken
This function is meant to loop through all the records in the CSV file and return needed outputs for purposes.
#### 2. fetchAPIs
The function is intended for API calls of cryptocompare for the exchange rates in USD.
#### 3. convertDateToTimestamp
This function is to convert the date input into the timestamp in seconds. The date format must be: mm/dd/yyyy. This timestamp conversion may be affected by Daylight Saving. If the Daylight Saving is in effect, the clock goes forward one hour.
#### 4. checkTimestamp
This function compares timestamps from CSV with the timestamp of the entered date.
#### 5. convertNumberIntoUSD
This functions is to convert numbers into the currency format in USD.
#### 6. storeValuesLocally and checkStoredValues
These two functions handle storing and checking values locally.
#### 7. askOptions, askUserForToken, askUserForDate, and askUserForDateAndToken
These functions allow the user to enter inputs in the terminal.

### Objective Implementations:
#### 1. Given no parameters, return the latest portfolio value per token in USD
To do this, we do have to call getValuePerToken to get the latest portfolio amounts of tokens (BTC, ETH, XRP). 
The portfolio value is the balance of the token where we make deposits and withdrawals through transactions. 
The token balance is calculated by getting the latest total amount of the token multiplied by the token exchange rate in USD.
The exchange rates for tokens are retrieved from Cryptocompare's APIs. To improve the performance, we utilize the local storage 
implementation with the store package. The process outputs are cached and temporarily stored in the local storage for the same request. 
This means if we press 1 for the second time, we will immediately get the results for the first and second objectives. If we go with 
the first objective first and receive the output, we will get the response right after you hit the enter when you choose the first objective
again for the second time or choose the second option for the first time. The cause of this will be explained in the second objective. The local
storage is not permanent, so when you close the program, the stored data will be erased.\
\
The API URL reads as below:

```
https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,XRP&tsyms=USD&api_key=${APIKey} //Tokens: fsyms=BTC,ETH,XRP, Currency: tsyms=USD
```
#### 2. Given a token, return the latest portfolio value for that token in USD
We go through the same process for this requirement. The only difference is that the process is executed according to the token input. The local storage 
can be applicable to this objective. However, you have to select this option three times with three tokens BTC, ETH, and XRP to quickly pick the results 
for the options of 1 and 2. The reason for this is that there is a conflict between the first and second objectives where the first one returns three portfolio
values at once, while the second one gives just one for a token at a time. \
\
The API URL reads as below:

```
https://min-api.cryptocompare.com/data/price?fsym=${token}&tsyms=USD&api_key=${APIKey} //Tokens: fsyms=${input}, Currency: tsyms=USD
```
#### 3. Given a date, return the portfolio value per token in USD on that date
This requires us to retrieve and return the portfolio values per token on the entered date. This is, we do have to pick all the records in CSV within
the timeframe from 12:00:00 AM to 11:59:59 PM of the date (24 hours/86399 seconds). For example, we enter 10/20/2018 (mm/dd/yyyy) and then we need to find and collect records with timestamps
in the timeframe from 12:00:00 AM to 11:59:59 PM of 10/20/2018. For the balance per token, we need to get exchange rates of the three tokens on the entered date. The local storage is not
applicable to this case as we cannot control all the data on dates entered by the user.\
\
The API URL reads as below:

```
https://min-api.cryptocompare.com/data/v2/histoday?fsym=btc&tsym=USD&toTs=${dateToTimestamp}&limit=1&api_key=${APIKey} // toTs: the timestamp of the date, Token: fsym=btc, Currency: tsyms=USD
https://min-api.cryptocompare.com/data/v2/histoday?fsym=eth&tsym=USD&toTs=${dateToTimestamp}&limit=1&api_key=${APIKey} // toTs: the timestamp of the date, Token: fsym=eth, Currency: tsyms=USD
https://min-api.cryptocompare.com/data/v2/histoday?fsym=xrp&tsym=USD&toTs=${dateToTimestamp}&limit=1&api_key=${APIKey} // toTs: the timestamp of the date, Token: fsym=xrp, Currency: tsyms=USD
```
#### 4. Given a date and a token, return the portfolio value of that token in USD on that date
We get the same process for this requirement. The only difference is that the process is done according to the inputs: date and token.
