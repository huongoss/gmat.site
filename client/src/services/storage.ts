import { useEffect } from 'react';

const STORAGE_KEY = 'gmatPracticeResults';

export const saveResultsToLocalStorage = (results: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
};

export const getResultsFromLocalStorage = () => {
    const results = localStorage.getItem(STORAGE_KEY);
    return results ? JSON.parse(results) : null;
};

export const clearResultsFromLocalStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const usePracticeResults = () => {
    const results = getResultsFromLocalStorage();

    useEffect(() => {
        if (!results) {
            saveResultsToLocalStorage([]);
        }
    }, [results]);

    return {
        results,
        saveResults: saveResultsToLocalStorage,
        clearResults: clearResultsFromLocalStorage,
    };
};