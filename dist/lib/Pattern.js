"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SEPARATOR = '/';
const SINGLE = '+';
const ALL = '#';
function clean(pattern) {
    if (typeof pattern === 'string') {
        return cleanSingle(pattern);
    }
    else if (Array.isArray(pattern)) {
        return cleanMulti(pattern);
    }
    else {
        throw new TypeError('pattern must be a string or array');
    }
}
exports.clean = clean;
function cleanSingle(pattern) {
    const patternSegments = pattern.split(SEPARATOR);
    const topicSegments = [];
    for (let currentPattern of patternSegments) {
        const patternChar = currentPattern[0];
        if (patternChar === SINGLE) {
            topicSegments.push(SINGLE);
        }
        else if (patternChar === ALL) {
            topicSegments.push(ALL);
        }
        else {
            topicSegments.push(currentPattern);
        }
    }
    return topicSegments.join(SEPARATOR);
}
exports.cleanSingle = cleanSingle;
function cleanMulti(patterns) {
    if (!Array.isArray(patterns)) {
        throw new TypeError('patterns must be an array');
    }
    const clean = [];
    for (let pattern of patterns) {
        clean.push(cleanSingle(pattern));
    }
    return clean;
}
exports.cleanMulti = cleanMulti;
function matches(pattern, topic) {
    const patternSegments = pattern.split(SEPARATOR);
    const topicSegments = topic.split(SEPARATOR);
    const patternLength = patternSegments.length;
    const topicLength = topicSegments.length;
    const lastIndex = patternLength - 1;
    for (let i = 0; i < patternLength; i++) {
        const currentPattern = patternSegments[i];
        const patternChar = currentPattern[0];
        const currentTopic = topicSegments[i];
        if (!currentTopic && currentPattern !== ALL)
            return false;
        if (patternChar === ALL)
            return i === lastIndex;
        if (patternChar !== SINGLE && currentPattern !== currentTopic)
            return false;
    }
    return patternLength === topicLength;
}
exports.matches = matches;
function extract(pattern, topic) {
    const params = {};
    const patternSegments = pattern.split(SEPARATOR);
    const topicSegments = topic.split(SEPARATOR);
    const patternLength = patternSegments.length;
    for (let i = 0; i < patternLength; i++) {
        const currentPattern = patternSegments[i];
        const patternChar = currentPattern[0];
        if (currentPattern.length === 1)
            continue;
        if (patternChar === ALL) {
            params[currentPattern.slice(1)] = topicSegments.slice(i);
            break;
        }
        else if (patternChar === SINGLE) {
            params[currentPattern.slice(1)] = topicSegments[i];
        }
    }
    return params;
}
exports.extract = extract;
