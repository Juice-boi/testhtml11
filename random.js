function generateRandomNumber() {
    const randomNumber1 = Math.floor(Math.random() * 13); // 0-12 inclusive
    const randomNumber2 = Math.floor(Math.random() * 13); // 0-12 inclusive
    const randomNumber3 = Math.floor(Math.random() * 13); // 0-12 inclusive
    const randomNumber4 = Math.floor(Math.random() * 13); // 0-12 inclusive
    document.documentElement.style.setProperty('--random-number1', randomNumber1 * 71);
    document.documentElement.style.setProperty('--random-number2', randomNumber2 * 71);
    document.documentElement.style.setProperty('--random-number3', randomNumber3 * 71);
    document.documentElement.style.setProperty('--random-number4', randomNumber4 * 71);
    return randomNumber1;
}

generateRandomNumber();