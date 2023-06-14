const openAiAPIErrorHandler = (response) => {
    if (response.status === 401) {
        return "OpenAI API key is invalid, please contact support: litvinov1618@gmail.com.";
    }

    if (response.status === 429) {
        return "You are sending requests too quickly. Wait a few seconds and try again.";
    }

    if (response.status === 500) {
        return "The OpenAI server had an error while processing your request. Please try again in a few minutes.";
    }

    return "Something went wrong. Please try again in a few minutes.";
};

module.exports = openAiAPIErrorHandler;