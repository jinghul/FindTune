/**
 * Generates a random string containing numbers and letters -- used for state check
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

/**
 * Return a random subset of elements from the list.
 * @param  {Array} array The length of the string.
 * @param  {Integer} count The number of elements to return.
 * @return {Array} The subset of random elements from the list.
 */
function getRandomElements(array, count) {
    if (count == 0) {
        return []
    } else if (count >= array.length) {
        return shuffleArray(array);
    }

    var random_elements = [];
    var taken = [];
    while (count) {
        var random = Math.floor(Math.random() * array.length);
        if (!taken.includes(random)) {
            taken.push(random);
            random_elements.push(array[random]);
            count--;
        }
    }

    return random_elements;
}

/**
 * Shuffles the given array in place.
 * @param {Array} array 
 */
function shuffleArray(array) {
    var return_array = array.slice();
    for (let i = return_array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [return_array[i], return_array[j]] = [return_array[j], return_array[i]];
    }
    return return_array;
}

/**
 * Returns where the difference between
 * two dates is greater than a number (ms)
 * @param {Date} date1 
 * @param {Date} date2 
 * @param {Number} compare 
 */
function compareTime(date1, date2, compare) {
    if (Math.abs(date2 - date1) > compare) {
        return true;
    }
}


module.exports.generateRandomString = generateRandomString;
module.exports.getRandomElements = getRandomElements;
module.exports.shuffleArray = shuffleArray;
module.exports.compareTime = compareTime;